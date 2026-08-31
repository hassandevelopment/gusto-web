import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Loader2, Volume2, VolumeX, AlertTriangle } from 'lucide-react'
import { playChime, unlockAudio, audioState } from '../lib/chime'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { KitchenOrder, OrderStatus } from '../types'
import KanbanColumn from '../components/kitchen/KanbanColumn'
import OrderCard from '../components/kitchen/OrderCard'
import RefundCard from '../components/kitchen/RefundCard'
import { useMediaQuery } from '../hooks/useMediaQuery'

// Status priority for the flat-grid sort (tablet/phone): New first, then down the
// lifecycle. Mirrors the left-to-right Kanban column order.
const STATUS_ORDER: Record<KitchenOrder['status'], number> = {
  placed: 0, preparing: 1, ready: 2, out_for_delivery: 3, completed: 4, cancelled: 5,
}

// Authoritative kitchen visibility (DEV-Gusto-App migration 039 / ADR-046):
// an online order is hidden until Tap captures payment. RLS is only a backstop;
// this client predicate is the authority, applied to both the queries and the
// Realtime handlers. Cash/card orders are always visible.
//
// Test orders (migration 055) are hidden everywhere. `is_test !== true` mirrors
// the query filter `is_test IS NOT TRUE`: a false or absent flag stays visible,
// so only an explicit true hides. Realtime payloads carry the full row, so a
// test order's INSERT/UPDATE is ignored here exactly as the queries exclude it.
function isKitchenVisible(o: { payment_method: string; payment_status: string; is_test?: boolean }): boolean {
  return o.is_test !== true && (o.payment_method !== 'online' || o.payment_status === 'paid')
}

// Backup-poll interval override, enabled in the PRODUCTION build (the board is
// tested on gusto.bh, so a dev-only knob is useless there). ?poll=<ms> is honoured
// only within [3s, 5min]; anything outside is IGNORED and falls back to the 60s
// default (clamp-by-reject, not clamp-to-bound: ?poll=1000 gives 60s, not 3s).
const POLL_DEFAULT_MS = 60_000
function parsePollMs(): number {
  if (typeof window === 'undefined') return POLL_DEFAULT_MS
  const raw = new URLSearchParams(window.location.search).get('poll')
  if (raw == null) return POLL_DEFAULT_MS
  const n = Number(raw)
  return Number.isFinite(n) && n >= 3_000 && n <= 300_000 ? n : POLL_DEFAULT_MS
}

// Watchdog threshold: if no socket-liveness signal (a Realtime event or a
// heartbeat 'ok') has landed in this long, treat the live link as dead and show
// the banner. 80s is just over three 25s heartbeat intervals, so ordinary jitter
// never trips it.
const SOCKET_STALE_MS = 80_000

// Cadence of the repeating unadvanced-order alarm (see the alarm effect).
const ALARM_INTERVAL_MS = 30_000

// settings.operating_hours shape: keyed by lowercase 3-letter weekday, HH:MM strings.
type DayHours = { open: string; close: string }
type OperatingHours = Record<string, DayHours>

// Current Asia/Bahrain weekday key (mon..sun) and minutes-since-local-midnight.
function bahrainDayAndMinutes(): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bahrain', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const day = (parts.find((p) => p.type === 'weekday')?.value ?? '').toLowerCase()
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24 // some engines emit '24' at midnight
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  return { day, minutes: hour * 60 + minute }
}

// Whether the restaurant is open right now per settings.operating_hours. Every
// close time is <= 23:45, so there is no past-midnight window to wrap. Gates the
// AUDIBLE alarm only, and fails CLOSED: if hours are unknown we do NOT beep, so a
// failed settings load can never produce an overnight alarm that gets muted and
// leaves the kitchen silent the next day (the exact chain this gate prevents).
// The visual alarm is never gated on this.
function isOpenNow(hours: OperatingHours | null): boolean {
  if (!hours) return false
  const { day, minutes } = bahrainDayAndMinutes()
  const today = hours[day]
  if (!today) return false
  const [oh, om] = today.open.split(':').map(Number)
  const [ch, cm] = today.close.split(':').map(Number)
  return minutes >= oh * 60 + om && minutes < ch * 60 + cm
}

// Returns the start of today (midnight) in Asia/Bahrain as a UTC ISO string.
function bahrainTodayStart(): string {
  const bahrainDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bahrain' }).format(new Date())
  return new Date(`${bahrainDate}T00:00:00+03:00`).toISOString()
}

// History view bounds. With no search term the History tab loads only the last
// HISTORY_WINDOW_DAYS (from Bahrain midnight), so a full order table never lands
// in one shot. A search drops the date bound and looks across all history, still
// capped at HISTORY_LIMIT rows; when a result set hits the cap the UI says so
// rather than silently truncating.
const HISTORY_WINDOW_DAYS = 7
const HISTORY_LIMIT = 200

// Start of the default history window: HISTORY_WINDOW_DAYS before today's Bahrain
// midnight, as a UTC ISO string. Bahrain has no DST, so subtracting whole days
// off the midnight boundary is exact.
function bahrainDaysAgoStart(days: number): string {
  const base = new Date(bahrainTodayStart())
  base.setUTCDate(base.getUTCDate() - days)
  return base.toISOString()
}

const COLUMNS: { key: KitchenOrder['status']; title: string; color: string }[] = [
  { key: 'placed',           title: 'New',              color: 'var(--color-accent)' },
  { key: 'preparing',        title: 'Preparing',        color: '#D97706' },
  { key: 'ready',            title: 'Ready',            color: 'var(--color-success)' },
  { key: 'out_for_delivery', title: 'Out for Delivery', color: '#2563EB' },
]

type FetchState = 'idle' | 'loading' | 'error'

export default function KitchenPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  // Synchronous mirror of `orders` for the Realtime closures. The setOrders
  // updater is batched (runs async), so membership and the chime decision must
  // read this ref, and every Realtime add/merge/remove writes it directly.
  // Otherwise two UPDATE events arriving before the effect below flushes would
  // both see inState=false and both try to add. The useEffect is a backstop for
  // state changes from other paths (fetchOrders, updateStatus).
  const ordersRef = useRef<KitchenOrder[]>([])
  useEffect(() => { ordersRef.current = orders }, [orders])
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'refunds'>('active')
  const [historyOrders, setHistoryOrders] = useState<KitchenOrder[]>([])
  const [historyFetchState, setHistoryFetchState] = useState<FetchState>('idle')
  // History search. `historyInput` is the controlled text box; `historyQuery` is
  // the APPLIED term (drives the empty-state copy). The ref mirrors the applied
  // term so fetchHistory can read it without being a dependency, keeping the
  // callback stable (the Realtime effect and others close over nothing here).
  // Empty applied term = default recent-window view; non-empty = search all
  // history. Applied only on submit/clear, never per keystroke.
  const [historyInput, setHistoryInput] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')
  const historyQueryRef = useRef('')
  const [refundOrders, setRefundOrders] = useState<KitchenOrder[]>([])
  const [refundFetchState, setRefundFetchState] = useState<FetchState>('idle')
  // Badge count for the Refund Owed tab. Populated on page load by a lightweight
  // id-only query (see fetchRefundCount), independent of which tab is active, so
  // the badge is correct the moment the page mounts. fetchRefunds (tab content)
  // keeps it in sync when the tab is opened; updateStatus/markRefunded nudge it
  // for the in-session create/clear paths.
  const [refundOwedCount, setRefundOwedCount] = useState(0)
  // The count the user has "seen": set to the current count when the Refund Owed
  // tab is opened. The badge pulses while refundOwedCount > acknowledgedRefundCount
  // (an unattended refund exists) and goes solid once acknowledged; it resumes
  // pulsing if the count later climbs above what was acknowledged.
  const [acknowledgedRefundCount, setAcknowledgedRefundCount] = useState(0)
  // Invariant: acknowledged must never exceed the count. Enforced in ONE place so
  // no count mutation has to remember it. Without this, clearing one of several
  // refunds would drop the count while acknowledged stayed high, and a later new
  // refund would fail to re-cross acknowledged — rendering solid instead of
  // pulsing, silently under-flagging a real unattended refund. Clamps DOWN only;
  // it never raises acknowledged, so the "unattended" signal is preserved.
  useEffect(() => {
    setAcknowledgedRefundCount((a) => Math.min(a, refundOwedCount))
  }, [refundOwedCount])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [soundOn, setSoundOn] = useState(true)
  const soundOnRef = useRef(true)
  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])
  const navigate = useNavigate()

  // Backup-poll cadence, resolved once from the URL (see parsePollMs).
  const [pollMs] = useState(parsePollMs)

  // Layer 2 connection watchdog. lastSocketAliveRef is stamped ONLY by Realtime
  // events and heartbeat 'ok', NEVER by the REST poll (two-clock rule, ADR-050):
  // a working poll must not mask a dead socket, so the banner reflects the socket's
  // health even while the board stays fresh on backup polling.
  const lastSocketAliveRef = useRef(Date.now())
  const [connectionStale, setConnectionStale] = useState(false)
  const markSocketAlive = useCallback(() => {
    lastSocketAliveRef.current = Date.now()
    setConnectionStale(false)
  }, [])

  // Operating hours (gates the audible alarm only). Mirrored into a ref so the
  // alarm interval reads the latest without re-subscribing.
  const [operatingHours, setOperatingHours] = useState<OperatingHours | null>(null)
  const hoursRef = useRef<OperatingHours | null>(null)
  useEffect(() => { hoursRef.current = operatingHours }, [operatingHours])

  // Whether the AudioContext is actually running. Drives the "tap to enable sound"
  // affordance: a suspended context makes every chime silent, so staff need to see
  // that sound is off. Not reactive on its own, so we sample audioState() on
  // gestures, on tab focus, and on each alarm tick.
  const [audioReady, setAudioReady] = useState(false)
  const refreshAudioReady = useCallback(() => { setAudioReady(audioState() === 'running') }, [])

  // ≥1280px: the 4-column Kanban board. Below that (tablet + phone) the columns
  // can't fit without horizontal scroll, and advancing a card would send it to an
  // offscreen column — so we render a flat, in-place card grid instead.
  const isWide = useMediaQuery('(min-width: 1280px)')

  // ≤639px: the header's text labels + email can't fit one row without forcing
  // horizontal page overflow. Drop the email, collapse Refresh to icon-only.
  const isPhone = useMediaQuery('(max-width: 639px)')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [])

  // TEMPORARY diagnostic (chime-lag investigation, 2026-07-24). Fires the chime
  // and logs, in one console line, which of the four paths fired, for which order
  // id(s), whether the poll considered them new, the live AudioContext state, and
  // whether the sound actually played (sounded=false means a suspended/locked
  // context silently dropped it). The next occurrence then says exactly which path
  // chimed and whether audio was locked. Remove once the lag is understood.
  const logAndChime = useCallback(
    (source: string, orderId: string | undefined, hasNew: boolean | undefined) => {
      const sounded = playChime()
      console.log(
        `[chime] source=${source} order=${orderId ?? 'n/a'} hasNew=${hasNew ?? 'n/a'} ` +
        `audio=${audioState()} sounded=${sounded} soundOn=${soundOnRef.current}`,
      )
    },
    [],
  )

  // Shared loader for the active board: the visibility-filtered active-orders
  // query plus the customer-profile merge. ONE source for the filter, so the
  // active board, manual Refresh, and the backup poll can never drift from each
  // other or from the Realtime handlers (see isKitchenVisible). Returns null on
  // any error, leaving it to the caller to decide whether to surface it.
  const loadBoardOrders = useCallback(async (): Promise<KitchenOrder[] | null> => {
    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*, addons:order_item_addons(*), variants:order_item_variants(*))')
      .not('status', 'in', '(completed,cancelled)')
      // Authoritative kitchen visibility filter (see isKitchenVisible). ANDed
      // with the status filter: hide unpaid/pending online orders from staff.
      .or('payment_method.neq.online,payment_status.eq.paid')
      // Hide pre-launch test orders (migration 055). `is not true` matches false
      // and null, so only an explicit is_test=true is excluded.
      .not('is_test', 'is', true)
      .order('placed_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch orders:', error)
      return null
    }

    // Exclude null user_id (guest + anonymized orders); passing null to the
    // profiles `id` filter throws "invalid input syntax for type uuid".
    const userIds = [...new Set(
      (rawOrders ?? [])
        .map((o: { user_id: string | null }) => o.user_id)
        .filter((id: string | null): id is string => !!id),
    )]
    const { data: profiles, error: pErr } = userIds.length
      ? await supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
      : { data: [], error: null }

    if (pErr) {
      console.error('Failed to fetch profiles:', pErr)
      return null
    }

    const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string; phone: string }) => [p.id, p]))
    return (rawOrders ?? []).map((o: KitchenOrder) => ({
      ...o,
      customer: o.user_id ? (profileMap.get(o.user_id) ?? null) : null,
    }))
  }, [])

  const fetchOrders = useCallback(async () => {
    setFetchState('loading')
    const merged = await loadBoardOrders()
    if (!merged) {
      setFetchState('error')
      return
    }
    setOrders(merged)
    setFetchState('idle')
    // No chime here by design: the old on-load chime fired for every 'placed' order
    // on any incidental trigger (load, Refresh, tab focus, reconnect), regardless of
    // age. The repeating unadvanced-order alarm replaces it (see the alarm effect).
  }, [loadBoardOrders])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Operating hours for the audible-alarm gate. Loaded on mount and refreshed on
  // tab focus (the row almost never changes; a stale copy only affects whether the
  // repeat may beep, never the board).
  const fetchOperatingHours = useCallback(async () => {
    const { data, error } = await supabase
      .from('settings').select('value').eq('key', 'operating_hours').maybeSingle()
    if (error) {
      console.error('Failed to fetch operating hours:', error)
      return
    }
    setOperatingHours((data?.value as OperatingHours | undefined) ?? null)
  }, [])

  useEffect(() => { fetchOperatingHours() }, [fetchOperatingHours])

  // ── Layer 3: backup REST poll (bounds worst-case staleness if the socket dies) ──
  // Independent of Realtime. A full resync of the active board on an interval that
  // fires the SAME chime for any genuinely new order id, so a silent socket does
  // not mean a silent alarm (the failure that matters on the pass). Dedup is
  // structural: this poll and the Realtime add both gate on ordersRef membership,
  // so whichever sees an order first adds it and chimes, and the other is a no-op.
  // Deliberately does NOT stamp lastSocketAliveRef: the poll working must never
  // mask a dead socket from the watchdog (two-clock rule, ADR-050).
  const pollForNewOrders = useCallback(async () => {
    const fetched = await loadBoardOrders()
    if (!fetched) return // transient error: keep the current board untouched
    const knownIds = new Set(ordersRef.current.map((o) => o.id))
    // Log the exact ids the poll thinks are new: if an id here also appears in an
    // earlier realtime-insert log line, the dedup failed and the poll re-chimed.
    const newIds = fetched.filter((o) => !knownIds.has(o.id)).map((o) => o.id)
    // Keep the synchronous mirror authoritative so a Realtime event landing right
    // after this resync sees the polled-in orders as already present (no re-add,
    // no double chime).
    ordersRef.current = fetched
    setOrders(fetched)
    if (newIds.length > 0 && soundOnRef.current) logAndChime('poll', newIds.join(','), true)
  }, [loadBoardOrders, logAndChime])

  useEffect(() => {
    const id = setInterval(() => { pollForNewOrders() }, pollMs)
    return () => clearInterval(id)
  }, [pollForNewOrders, pollMs])

  // ── Repeating unadvanced-order alarm ──────────────────────────────────────
  // ONE timer for the page lifetime. Each tick reads the CURRENT board (ordersRef):
  // if any order is still 'placed', beep. Purely state-derived, so it cannot outlive
  // a real unadvanced order (advancing or cancelling the last placed order silences
  // the very next tick) and no stale flag can keep it armed or leave it behind. One
  // beep per tick no matter how many placed orders, so no overlapping chimes.
  //
  // The AUDIBLE beep is gated on operating hours: it can never sound overnight, get
  // muted, and leave the kitchen silent the next day. The VISUAL alarm (the pulsing
  // "N new" indicator) is not gated and shows a stale placed order at any hour. A
  // suspended AudioContext also makes the beep silent, which is exactly why the
  // visual channel is the primary one; refreshAudioReady keeps the tap-to-enable
  // affordance honest.
  useEffect(() => {
    const id = setInterval(() => {
      refreshAudioReady()
      const placed = ordersRef.current.filter((o) => o.status === 'placed')
      if (placed.length > 0 && soundOnRef.current && isOpenNow(hoursRef.current)) {
        logAndChime('unadvanced-alarm', placed.map((o) => o.id).join(','), undefined)
      }
    }, ALARM_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refreshAudioReady])

  const fetchHistory = useCallback(async () => {
    setHistoryFetchState('loading')
    const term = historyQueryRef.current.trim()
    // Strip the characters that would break PostgREST's or()/ilike grammar
    // (comma and parens are separators; % and * are wildcards). What remains is
    // a plain substring match, which is all staff need for names and phones.
    const esc = term.replace(/[%,()*]/g, ' ').trim()

    let query = supabase
      .from('orders')
      .select('*, items:order_items(*, addons:order_item_addons(*), variants:order_item_variants(*))')
      .in('status', ['completed', 'cancelled'])
      // Same visibility filter: an abandoned/unpaid online order that was
      // cancelled was never a real kitchen order, so keep it out of History too.
      .or('payment_method.neq.online,payment_status.eq.paid')
      // Hide pre-launch test orders (migration 055), same as the active board.
      .not('is_test', 'is', true)

    if (esc) {
      // Searching: no date bound, look across all history. Customer name/phone
      // live on `profiles`, not `orders`, so resolve matching accounts to
      // user_ids first and OR them in alongside the guest fields and the order
      // number. This one extra query is what lets a name/phone search reach
      // account orders, not just guest orders.
      const { data: matchProfiles } = await supabase
        .from('profiles').select('id')
        .or(`full_name.ilike.%${esc}%,phone.ilike.%${esc}%`)
        .limit(100)
      const ids = (matchProfiles ?? []).map((p: { id: string }) => p.id)
      const ors = [`guest_name.ilike.%${esc}%`, `guest_phone.ilike.%${esc}%`]
      if (/^\d+$/.test(term)) ors.push(`order_number.eq.${term}`)
      if (ids.length) ors.push(`user_id.in.(${ids.join(',')})`)
      query = query.or(ors.join(','))
    } else {
      // Default view: only the recent window, so we never pull the whole table.
      query = query.gte('placed_at', bahrainDaysAgoStart(HISTORY_WINDOW_DAYS))
    }

    const { data: rawOrders, error } = await query
      .order('placed_at', { ascending: false })
      .limit(HISTORY_LIMIT)

    if (error) {
      console.error('Failed to fetch history:', error)
      setHistoryFetchState('error')
      return
    }

    // Exclude null user_id (guest + anonymized orders); passing null to the
    // profiles `id` filter throws "invalid input syntax for type uuid".
    const userIds = [...new Set(
      (rawOrders ?? [])
        .map((o: { user_id: string | null }) => o.user_id)
        .filter((id: string | null): id is string => !!id),
    )]
    const { data: profiles, error: pErr } = userIds.length
      ? await supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
      : { data: [], error: null }

    if (pErr) console.error('Failed to fetch history profiles:', pErr)

    const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string; phone: string }) => [p.id, p]))
    const merged: KitchenOrder[] = (rawOrders ?? []).map((o: KitchenOrder) => ({
      ...o,
      customer: o.user_id ? (profileMap.get(o.user_id) ?? null) : null,
    }))

    setHistoryOrders(merged)
    setHistoryFetchState('idle')
  }, [])

  // Apply the text box as the active search and refetch. Sets the ref (read
  // synchronously by fetchHistory) and the state (drives the empty-state copy).
  const submitHistorySearch = useCallback((e?: FormEvent) => {
    e?.preventDefault()
    const term = historyInput.trim()
    historyQueryRef.current = term
    setHistoryQuery(term)
    fetchHistory()
  }, [historyInput, fetchHistory])

  // Clear the search and return to the default recent-window view.
  const clearHistorySearch = useCallback(() => {
    setHistoryInput('')
    historyQueryRef.current = ''
    setHistoryQuery('')
    fetchHistory()
  }, [fetchHistory])

  // ── Refund-owed section (ADR-046) ─────────────────────────────────────────
  // Its own query: the full ADR-046 predicate. Rows are mostly terminal
  // (cancelled), so this does NOT reuse the active-board query; it is not filtered
  // by status or placed_at. Refetch-on-open, no Realtime for v1 (refunds are rare
  // and low-urgency; a manual Refresh covers a missed row). Customer name + phone
  // ARE joined (same as the active board): processing the Tap refund is only half
  // the job, staff also have to phone the person whose money is held.
  // Lightweight refund-owed count for the tab badge. Runs on page load (below),
  // independent of the active tab. Selects ONLY the ids matching the ADR-046
  // predicate and uses the row count — it never pulls the full order rows,
  // items, addons, or profiles that fetchRefunds needs for the tab content.
  const fetchRefundCount = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_method', 'online')
      .eq('refund_owed', true)

    if (error) {
      console.error('Failed to fetch refund-owed count:', error)
      return
    }
    setRefundOwedCount((data ?? []).length)
  }, [])

  useEffect(() => { fetchRefundCount() }, [fetchRefundCount])

  const fetchRefunds = useCallback(async () => {
    setRefundFetchState('loading')
    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*, addons:order_item_addons(*), variants:order_item_variants(*))')
      .eq('payment_method', 'online')
      // refund_owed is the single source of truth. The former second arm
      // (paid AND cancelled) existed only because nothing set refund_owed when the
      // kitchen cancelled a paid order; migration 048's trigger now sets it on every
      // write path, so that arm was redundant AND made rows unclearable (a cleared
      // row still matched paid+cancelled and returned on the next refetch forever).
      .eq('refund_owed', true)
      .order('placed_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch refunds:', error)
      setRefundFetchState('error')
      return
    }

    // Exclude null user_id (guest + anonymized orders); passing null to the
    // profiles `id` filter throws "invalid input syntax for type uuid".
    const userIds = [...new Set(
      (rawOrders ?? [])
        .map((o: { user_id: string | null }) => o.user_id)
        .filter((id: string | null): id is string => !!id),
    )]
    const { data: profiles, error: pErr } = userIds.length
      ? await supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
      : { data: [], error: null }

    if (pErr) console.error('Failed to fetch refund profiles:', pErr)

    const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string; phone: string }) => [p.id, p]))
    setRefundOrders((rawOrders ?? []).map((o: KitchenOrder) => ({
      ...o,
      customer: o.user_id ? (profileMap.get(o.user_id) ?? null) : null,
    })))
    // Reconcile the badge with the authoritative tab content. fetchRefunds only
    // runs while the user is on the Refund Owed tab, so acknowledge the count too
    // — the user is looking at it, so the badge goes solid.
    const count = (rawOrders ?? []).length
    setRefundOwedCount(count)
    setAcknowledgedRefundCount(count)
    setRefundFetchState('idle')
  }, [])

  // Clear a refund-owed order. Two shapes, gated on payment_status (ADR-046
  // amendment 3):
  //   * paid (dirs 3, 5): clear the flag ONLY, never touch status — a dir-5 order
  //     is still live on the cook board and must keep cooking; a dir-3 order stays
  //     cancelled.
  //   * not-paid + still live (dir 4): void it in the SAME update, else it lands in
  //     the digest STUCK bucket (online + placed + unpaid) and stays kitchen-invisible.
  //   * not-paid + already cancelled (dir 1): clear the flag only; preserve cancelled_by.
  // Only mutates refundOrders (drops the cleared card). Never touches the active
  // `orders` state, so a paid, live dir-5 order stays on the board untouched; the
  // Realtime echo merges refund_owed=false in place (and for dir 4, the status echo
  // removes it, which is correct — but a dir-4 row is hidden from the board anyway).
  const markRefunded = useCallback(async (order: KitchenOrder): Promise<{ ok: boolean; error?: string }> => {
    const patch =
      order.payment_status === 'paid'
        ? { refund_owed: false }
        : order.status === 'cancelled'
          ? { refund_owed: false }
          : { refund_owed: false, status: 'cancelled', cancelled_by: 'staff' }
    const { error } = await supabase.from('orders').update(patch).eq('id', order.id)
    if (error) {
      console.error('Mark refunded failed:', error)
      return { ok: false, error: error.message }
    }
    setRefundOrders((prev) => prev.filter((o) => o.id !== order.id))
    setRefundOwedCount((c) => Math.max(0, c - 1))
    return { ok: true }
  }, [])

  // ── Realtime subscription on orders (ADR-004 channel-reuse guard) ─────────
  useEffect(() => {
    const topicName = 'kitchen-orders'
    const realtimeTopic = `realtime:${topicName}`

    // ADR-004: if a channel for this topic already exists (Fast Refresh / remount
    // race before removeChannel resolves), reuse it — do NOT re-attach .on().
    const existing = supabase.getChannels().find((c) => c.topic === realtimeTopic)
    if (existing) {
      channelRef.current = existing
      return
    }

    // Fetch a single order's full shape (same nested select as fetchOrders),
    // then merge its customer profile. Returns null on any error.
    async function fetchOrderDetails(orderId: string, userId: string | null): Promise<KitchenOrder | null> {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, addons:order_item_addons(*), variants:order_item_variants(*))')
        .eq('id', orderId)
        .maybeSingle()
      if (error || !order) {
        console.error('Realtime: failed to fetch order details', error)
        return null
      }
      // Guest + anonymized orders have no profile; skip the lookup (a null id
      // filter throws on a uuid column).
      let profile = null
      if (userId) {
        const { data, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .eq('id', userId)
          .maybeSingle()
        if (pErr) console.error('Realtime: failed to fetch customer profile', pErr)
        profile = data
      }
      return { ...(order as KitchenOrder), customer: profile ?? null }
    }

    // Add an order from a Realtime event (INSERT, or an UPDATE-as-insert when a
    // hidden order first becomes visible). Membership and the chime are decided
    // from ordersRef synchronously; the setOrders updater is batched, so a flag
    // set inside it would still be false here and the chime would never fire
    // (the exact bug this fixes). The ref is written directly so a second event
    // arriving before React re-renders sees the order as already present.
    async function addOrderFromEvent(row: { id: string; user_id: string | null }, source: string) {
      const fullOrder = await fetchOrderDetails(row.id, row.user_id)
      if (!fullOrder) return
      if (!isKitchenVisible(fullOrder)) return // authoritative re-check on the full row
      if (ordersRef.current.some((o) => o.id === fullOrder.id)) return // idempotent
      ordersRef.current = [...ordersRef.current, fullOrder].sort((a, b) =>
        a.placed_at.localeCompare(b.placed_at),
      )
      setOrders(ordersRef.current)
      if (soundOnRef.current) logAndChime(source, fullOrder.id, undefined)
    }

    const channel = supabase
      .channel(topicName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          markSocketAlive() // any inbound event proves the socket is delivering
          const row = payload.new as { id: string; user_id: string | null }
          addOrderFromEvent(row, 'realtime-insert')
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          markSocketAlive()
          const updated = payload.new as Partial<KitchenOrder> & {
            id: string
            user_id: string | null
            status: OrderStatus
            payment_method: string
            payment_status: string
          }
          const inState = ordersRef.current.some((o) => o.id === updated.id)
          const terminal = updated.status === 'completed' || updated.status === 'cancelled'

          if (inState) {
            // Merge changed columns onto the known row (spread preserves nested
            // items/customer, absent on the raw payload). Drop it if it is now
            // terminal or has stopped passing the visibility filter.
            const next = ordersRef.current
              .map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
              .filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
              .filter((o) => isKitchenVisible(o))
            ordersRef.current = next
            setOrders(next)
          } else if (!terminal && isKitchenVisible(updated)) {
            // UPDATE-as-insert: a hidden order (e.g. an unpaid online order that
            // just flipped to payment_status='paid') arrives as an UPDATE for a
            // row this client has never seen. Treat it as a new order: appear
            // immediately and fire the new-order chime, exactly as an INSERT.
            addOrderFromEvent({ id: updated.id, user_id: updated.user_id ?? null }, 'update-as-insert')
          }
          // else: unknown row that is terminal or still not visible, so ignore.
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          markSocketAlive()
          const deletedId = (payload.old as { id?: string }).id
          if (!deletedId) return
          // Write the ref directly so a following synchronous event does not see
          // the removed order as still present.
          const next = ordersRef.current.filter((o) => o.id !== deletedId)
          ordersRef.current = next
          setOrders(next)
        })
      .subscribe((status) => {
        console.log(`Realtime [${topicName}]:`, status)
        // Layer 1: drive the connection banner off the subscribe lifecycle so a
        // socket that errors/closes flips it without waiting for the watchdog.
        if (status === 'SUBSCRIBED') markSocketAlive()
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionStale(true)
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, []) // single subscription for the page lifetime

  // ── Resync on tab re-focus: hedge against a silently-dropped WebSocket ────
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        fetchOrders() // full server resync; reconciles any events missed while hidden
        fetchOperatingHours() // hours may have rolled over while hidden
        unlockAudio() // the context is re-suspended on background; try to resume
        refreshAudioReady()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchOrders, fetchOperatingHours, refreshAudioReady])

  // ── Layer 2: staleness watchdog ───────────────────────────────────────────
  // Every 15s, compare now against the last socket-liveness stamp. If nothing has
  // arrived in SOCKET_STALE_MS the live link is treated as dead and the banner
  // shows — even while the Layer 3 poll keeps the board fresh (two-clock rule).
  useEffect(() => {
    const id = setInterval(() => {
      setConnectionStale(Date.now() - lastSocketAliveRef.current > SOCKET_STALE_MS)
    }, 15_000)
    return () => clearInterval(id)
  }, [])

  // ── Layer 1: socket liveness from heartbeats ──────────────────────────────
  // onHeartbeat fires ~every 25s; an 'ok' proves the socket is live even when no
  // orders are arriving, and a 'timeout'/'disconnected' flips the banner at once
  // rather than waiting for the watchdog. Registered independently of the channel
  // effect so the channel-reuse early-return can never skip it.
  useEffect(() => {
    supabase.realtime.onHeartbeat((status) => {
      if (status === 'ok') markSocketAlive()
      else if (status === 'timeout' || status === 'disconnected') setConnectionStale(true)
    })
  }, [markSocketAlive])

  // ── Unlock AudioContext on staff gestures (autoplay policy) ───────────────
  // Do NOT detach after the first gesture: the browser re-suspends the context
  // when the tab backgrounds, so every gesture must be free to resume it, and each
  // one refreshes the audioReady state that drives the tap-to-enable affordance.
  useEffect(() => {
    const unlock = () => { unlockAudio(); refreshAudioReady() }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    window.addEventListener('touchstart', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [refreshAudioReady])

  async function updateStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<{ ok: boolean; error?: string }> {
    // Cancelling a PAID online order owes the customer a refund (ADR-046 dir 3).
    // Set refund_owed in the SAME update that writes status, so the row never
    // exists as paid+cancelled without the marker. This invariant is enforced
    // ONLY by this client: a cancel done via raw SQL or a future admin tool
    // bypasses it. The durable fix is a DB trigger, queued separately.
    const cancelling = ordersRef.current.find((o) => o.id === orderId)
    const owesRefundOnCancel =
      cancelling?.payment_method === 'online' && cancelling?.payment_status === 'paid'
    const patch =
      newStatus === 'completed'
        ? { status: newStatus, completed_at: new Date().toISOString() }
        : newStatus === 'cancelled'
          ? owesRefundOnCancel
            ? { status: newStatus, cancelled_by: 'staff', refund_owed: true }
            : { status: newStatus, cancelled_by: 'staff' }
          : { status: newStatus }
    try {
      const { error } = await supabase.from('orders').update(patch).eq('id', orderId)
      if (error) return { ok: false, error: error.message }
      // Cancelling a paid online order just created a refund owed — bump the badge
      // now so it appears (and pulses, since it's unattended) without waiting for a
      // manual refresh or a trip to the Refund Owed tab.
      if (owesRefundOnCancel) setRefundOwedCount((c) => c + 1)
      // Optimistic local apply — moves/clears the card immediately without waiting for
      // the realtime echo. The echo is idempotent: same status spread + terminal filter.
      // Compute from ordersRef and write the mirror synchronously (as the Realtime
      // handlers do) so the alarm interval cannot read a just-advanced order as still
      // 'placed' in the window before the orders-sync effect flushes.
      const next = ordersRef.current
        .map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        .filter((o) => o.status !== 'completed' && o.status !== 'cancelled')
      ordersRef.current = next
      setOrders(next)
      return { ok: true }
    } catch (e) {
      console.error('Status update failed:', e)
      return { ok: false, error: 'Something went wrong' }
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Sign out failed:', e)
    } finally {
      navigate('/kitchen/login')
    }
  }

  const activeOrders = orders.filter(o => COLUMNS.some(c => c.key === o.status))

  // Unadvanced ('placed') orders drive the always-on VISUAL alarm, independent of
  // audio and of operating hours. audioBlocked is true when sound is on but the
  // context is not running, i.e. every chime is being silently dropped and staff
  // need a gesture to restore sound.
  const placedCount = orders.filter(o => o.status === 'placed').length
  const audioBlocked = soundOn && !audioReady

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100dvh', background: '#1a1515',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-ink)', color: '#fff',
        padding: isPhone ? '0 0.75rem' : '0 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap',
        minHeight: '56px', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Kitchen</h1>
          {/* Always-on VISUAL alarm: pulses red while any order is unadvanced, at any
              hour and regardless of whether audio is muted or the context is locked. */}
          {placedCount > 0 && (
            <span
              role="status"
              aria-live="polite"
              aria-label={`${placedCount} new order${placedCount === 1 ? '' : 's'} waiting to be started`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: '#DC2626', color: '#fff',
                borderRadius: 'var(--radius-pill)',
                padding: '0.15rem 0.6rem', fontWeight: 700, fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                animation: 'scheduledPulse 1.1s ease-in-out infinite',
              }}
            >
              {placedCount} new
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isPhone ? '0.5rem' : '0.75rem' }}>
          {/* Tap-to-enable-sound affordance: shown only when sound is on but the
              context is suspended (chimes silently dropped). Any gesture resumes audio
              via the window listener; this is an explicit target and escalates (pulses)
              while orders are waiting. */}
          {audioBlocked && (
            <button
              onClick={() => { unlockAudio(); refreshAudioReady() }}
              aria-label="Enable new-order sound"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-pill)',
                padding: isPhone ? '0.375rem 0.625rem' : '0.375rem 0.875rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.875rem',
                minHeight: '36px', whiteSpace: 'nowrap',
                animation: placedCount > 0 ? 'refundPulse 1s ease-in-out infinite' : 'none',
              }}
            >
              <VolumeX size={15} />
              {!isPhone && 'Enable sound'}
            </button>
          )}
          <button
            onClick={() => fetchOrders()}
            disabled={fetchState === 'loading'}
            aria-label="Refresh orders"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-pill)',
              padding: isPhone ? '0.375rem 0.75rem' : '0.375rem 0.875rem',
              cursor: fetchState === 'loading' ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
              minHeight: '36px', minWidth: isPhone ? '36px' : undefined,
            }}
          >
            {fetchState === 'loading'
              ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <RefreshCw size={15} />
            }
            {!isPhone && 'Refresh'}
          </button>

          <button
            onClick={() => {
              const next = !soundOn
              setSoundOn(next)
              if (next) { unlockAudio(); refreshAudioReady() }
            }}
            aria-label={soundOn ? 'Mute new-order sound' : 'Unmute new-order sound'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-pill)',
              padding: '0.375rem 0.75rem', cursor: 'pointer',
              minHeight: '36px', minWidth: '36px',
            }}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Email omitted on phone — it reserves up to 180px and forces overflow. */}
          {email && !isPhone && (
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </span>
          )}

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              background: 'transparent', color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 'var(--radius-pill)',
              padding: isPhone ? '0.375rem 0.75rem' : '0.375rem 0.875rem',
              cursor: signingOut ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
              minHeight: '36px', whiteSpace: 'nowrap',
            }}
          >
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* Connection-lost banner (Layer 2). Shows whenever the socket looks dead,
          even while the backup poll keeps the board fresh — polling is slower, so
          staff must know the live link is down. Loud by colour AND shape (red +
          warning glyph + bold), not colour alone. Auto-clears the moment a
          heartbeat 'ok' or a Realtime event stamps the socket alive again. */}
      {connectionStale && (
        <div role="alert" style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
          background: '#DC2626', color: '#fff',
          padding: '0.625rem 1rem',
          fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9375rem',
          borderBottom: '3px solid #7F1D1D', flexShrink: 0,
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: '12rem' }}>
            Live connection lost. New orders may arrive late or not at all until this clears.
          </span>
          <button
            onClick={() => fetchOrders()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: '#fff', color: '#7F1D1D',
              border: 'none', borderRadius: 'var(--radius-pill)',
              padding: '0.375rem 0.875rem', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.875rem',
              minHeight: '36px', flexShrink: 0,
            }}
          >
            <RefreshCw size={14} /> Refresh now
          </button>
        </div>
      )}

      {/* Body */}
      <main style={{ flex: 1, padding: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '2px solid rgba(255,255,255,0.1)',
          marginBottom: '1rem', flexShrink: 0,
        }}>
          {(['active', 'history', 'refunds'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'history' && historyFetchState === 'idle' && historyOrders.length === 0) {
                  fetchHistory()
                }
                // Refunds: fetch every time the tab opens (refetch-on-open, no Realtime).
                if (tab === 'refunds') {
                  // Acknowledge immediately so the badge stops pulsing on click,
                  // before fetchRefunds resolves. fetchRefunds re-acknowledges to
                  // the authoritative count once it lands.
                  setAcknowledgedRefundCount(refundOwedCount)
                  fetchRefunds()
                }
              }}
              style={{
                background: 'transparent',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.45)',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
                marginBottom: '-2px',
                padding: '0.5rem 1.25rem',
                fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9375rem',
                cursor: 'pointer', letterSpacing: '0.02em',
                textTransform: 'capitalize', whiteSpace: 'nowrap',
              }}
            >
              {tab === 'active' ? 'Active' : tab === 'history' ? 'History' : 'Refund Owed'}
              {tab === 'active' && activeOrders.length > 0 && (
                <span style={{
                  marginLeft: '0.4rem',
                  background: 'var(--color-accent)', color: '#fff',
                  borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                }}>{activeOrders.length}</span>
              )}
              {/* Refund-owed badge lives on the Refund Owed tab label but renders
                  regardless of which tab is active, so an unattended refund is
                  visible from Active and History too. Pulses while unattended
                  (count above what's been acknowledged), solid once acknowledged. */}
              {tab === 'refunds' && refundOwedCount > 0 && (
                <span style={{
                  marginLeft: '0.4rem',
                  display: 'inline-block',
                  background: '#DC2626', color: '#fff',
                  borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  animation: refundOwedCount > acknowledgedRefundCount
                    ? 'refundPulse 1s ease-in-out infinite'
                    : 'none',
                }}>{refundOwedCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        {activeTab === 'active' && (
          fetchState === 'loading' && orders.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading orders…</span>
            </div>
          ) : fetchState === 'error' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--color-text-muted)' }}>
              <p>Couldn't load orders — retry</p>
              <button
                onClick={() => fetchOrders()}
                style={{
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-pill)',
                  padding: '0.625rem 1.5rem', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 600,
                  fontSize: '0.9375rem', minHeight: '44px',
                }}
              >
                Retry
              </button>
            </div>
          ) : activeOrders.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>
              No active orders
            </div>
          ) : isWide ? (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', flex: 1, overflow: 'hidden' }}
              className="kitchen-kanban"
            >
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.key}
                  title={col.title}
                  headerColor={col.color}
                  orders={orders.filter(o => o.status === col.key)}
                  count={orders.filter(o => o.status === col.key).length}
                  onUpdateStatus={updateStatus}
                />
              ))}
            </div>
          ) : (
            // Flat card grid (tablet/phone): auto-fill → 1 col on phone, 2 on iPad
            // portrait, 3 on landscape. Cards advance in place, never moving offscreen.
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
                alignItems: 'start',
              }}>
                {[...activeOrders]
                  .sort((a, b) =>
                    STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
                    a.placed_at.localeCompare(b.placed_at))
                  .map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={updateStatus}
                      showStatus
                    />
                  ))}
              </div>
            </div>
          )
        )}

        {/* History tab content */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Search bar — always visible so staff can look past the default
                recent window even when the window itself is empty. */}
            <form
              onSubmit={submitHistorySearch}
              style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }}
            >
              <input
                type="text"
                value={historyInput}
                onChange={(e) => setHistoryInput(e.target.value)}
                placeholder="Search all history — order #, name, or phone"
                aria-label="Search order history"
                style={{
                  flex: 1, minWidth: '180px',
                  background: 'rgba(255,255,255,0.1)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.18)', borderRadius: 'var(--radius-pill)',
                  padding: '0.5rem 1rem', fontFamily: 'var(--font-sans)', fontSize: '0.9375rem',
                  minHeight: '40px',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--color-accent)', color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-pill)', padding: '0.5rem 1.25rem', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.9375rem', minHeight: '40px',
                }}
              >
                Search
              </button>
              {historyQuery && (
                <button
                  type="button"
                  onClick={clearHistorySearch}
                  style={{
                    background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-pill)', padding: '0.5rem 1rem', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.9375rem', minHeight: '40px',
                  }}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => fetchHistory()}
                aria-label="Refresh history"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-pill)', padding: '0.5rem 1rem', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem', minHeight: '40px',
                }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </form>

            {/* Content states below the (always-present) search bar. */}
            {historyFetchState === 'loading' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading history…</span>
              </div>
            ) : historyFetchState === 'error' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem', color: 'var(--color-text-muted)' }}>
                <p>Couldn't load history — retry</p>
                <button
                  onClick={() => fetchHistory()}
                  style={{
                    background: 'var(--color-accent)', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-pill)',
                    padding: '0.625rem 1.5rem', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 600,
                    fontSize: '0.9375rem', minHeight: '44px',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : historyOrders.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '0 1rem', color: 'var(--color-text-muted)' }}>
                {historyQuery
                  ? `No orders match "${historyQuery}"`
                  : `No completed or cancelled orders in the last ${HISTORY_WINDOW_DAYS} days. Search to look further back.`}
              </div>
            ) : (
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                {historyOrders.length === HISTORY_LIMIT && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0 0 0.75rem' }}>
                    Showing the first {HISTORY_LIMIT} orders. Narrow your search to see the rest.
                  </p>
                )}
                <div style={{ columns: 'auto 320px', gap: '1rem' }}>
                  {historyOrders.map(order => (
                    <div key={order.id} style={{ breakInside: 'avoid', marginBottom: '1rem', opacity: order.status === 'cancelled' ? 0.6 : 1 }}>
                      <OrderCard
                        order={order}
                        onUpdateStatus={async () => ({ ok: true })}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refund Owed tab content */}
        {activeTab === 'refunds' && (
          refundFetchState === 'loading' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading refunds…</span>
            </div>
          ) : refundFetchState === 'error' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--color-text-muted)' }}>
              <p>Couldn't load refunds — retry</p>
              <button
                onClick={fetchRefunds}
                style={{
                  background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-pill)',
                  padding: '0.625rem 1.5rem', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 600,
                  fontSize: '0.9375rem', minHeight: '44px',
                }}
              >
                Retry
              </button>
            </div>
          ) : refundOrders.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>
              No refunds owed
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0, maxWidth: '48ch' }}>
                  Money captured but not fulfillable. Process the refund in the Tap dashboard using the charge id, then mark it here to stop the hourly alert.
                </p>
                <button
                  onClick={fetchRefunds}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: 'rgba(255,255,255,0.12)', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-pill)',
                    padding: '0.375rem 0.875rem', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
                    minHeight: '36px', flexShrink: 0,
                  }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
              <div style={{ columns: 'auto 340px', gap: '1rem' }}>
                {refundOrders.map(order => (
                  <RefundCard key={order.id} order={order} onMarkRefunded={markRefunded} />
                ))}
              </div>
            </div>
          )
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scheduledPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes refundPulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); }
          70%  { box-shadow: 0 0 0 7px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  )
}
