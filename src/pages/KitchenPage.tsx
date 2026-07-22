import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Loader2, Volume2, VolumeX } from 'lucide-react'
import { playChime, unlockAudio } from '../lib/chime'
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
function isKitchenVisible(o: { payment_method: string; payment_status: string }): boolean {
  return o.payment_method !== 'online' || o.payment_status === 'paid'
}

// Returns the start of today (midnight) in Asia/Bahrain as a UTC ISO string.
function bahrainTodayStart(): string {
  const bahrainDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bahrain' }).format(new Date())
  return new Date(`${bahrainDate}T00:00:00+03:00`).toISOString()
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

  const fetchOrders = useCallback(async (opts?: { alertOnPlaced?: boolean }) => {
    setFetchState('loading')

    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*, addons:order_item_addons(*), variants:order_item_variants(*))')
      .not('status', 'in', '(completed,cancelled)')
      // Authoritative kitchen visibility filter (see isKitchenVisible). ANDed
      // with the status filter: hide unpaid/pending online orders from staff.
      .or('payment_method.neq.online,payment_status.eq.paid')
      .order('placed_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch orders:', error)
      setFetchState('error')
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

    if (pErr) {
      console.error('Failed to fetch profiles:', pErr)
      setFetchState('error')
      return
    }

    const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string; phone: string }) => [p.id, p]))
    const merged: KitchenOrder[] = (rawOrders ?? []).map((o: KitchenOrder) => ({
      ...o,
      customer: o.user_id ? (profileMap.get(o.user_id) ?? null) : null,
    }))

    setOrders(merged)
    setFetchState('idle')

    // On page load / manual Refresh: alert staff if unacknowledged 'placed' orders exist.
    if (opts?.alertOnPlaced && soundOnRef.current && merged.some(o => o.status === 'placed')) {
      playChime()
    }
  }, [])

  useEffect(() => { fetchOrders({ alertOnPlaced: true }) }, [fetchOrders])

  const fetchHistory = useCallback(async () => {
    setHistoryFetchState('loading')
    const todayStart = bahrainTodayStart()

    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*, addons:order_item_addons(*), variants:order_item_variants(*))')
      .in('status', ['completed', 'cancelled'])
      .gte('placed_at', todayStart)
      // Same visibility filter: an abandoned/unpaid online order that was
      // cancelled was never a real kitchen order, so keep it out of History too.
      .or('payment_method.neq.online,payment_status.eq.paid')
      .order('placed_at', { ascending: false })

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
      .or('refund_owed.eq.true,and(payment_status.eq.paid,status.eq.cancelled)')

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
      // refund_owed OR (paid AND cancelled) — the paid+cancelled arm is a backstop;
      // amendment 1 guarantees every kitchen-cancelled paid order also carries
      // refund_owed, so in practice both arms coincide.
      .or('refund_owed.eq.true,and(payment_status.eq.paid,status.eq.cancelled)')
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
    async function addOrderFromEvent(row: { id: string; user_id: string | null }) {
      const fullOrder = await fetchOrderDetails(row.id, row.user_id)
      if (!fullOrder) return
      if (!isKitchenVisible(fullOrder)) return // authoritative re-check on the full row
      if (ordersRef.current.some((o) => o.id === fullOrder.id)) return // idempotent
      ordersRef.current = [...ordersRef.current, fullOrder].sort((a, b) =>
        a.placed_at.localeCompare(b.placed_at),
      )
      setOrders(ordersRef.current)
      if (soundOnRef.current) playChime()
    }

    const channel = supabase
      .channel(topicName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const row = payload.new as { id: string; user_id: string | null }
          addOrderFromEvent(row)
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
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
            addOrderFromEvent({ id: updated.id, user_id: updated.user_id ?? null })
          }
          // else: unknown row that is terminal or still not visible, so ignore.
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
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
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchOrders])

  // ── Unlock AudioContext on first staff gesture (autoplay policy) ──────────
  useEffect(() => {
    const unlock = () => { unlockAudio(); window.removeEventListener('pointerdown', unlock) }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

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
      setOrders((prev) =>
        prev
          .map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
          .filter((o) => o.status !== 'completed' && o.status !== 'cancelled'),
      )
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
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Kitchen</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: isPhone ? '0.5rem' : '0.75rem' }}>
          <button
            onClick={() => fetchOrders({ alertOnPlaced: true })}
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
              if (next) unlockAudio()
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
                onClick={() => fetchOrders({ alertOnPlaced: true })}
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
          historyFetchState === 'loading' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading history…</span>
            </div>
          ) : historyFetchState === 'error' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--color-text-muted)' }}>
              <p>Couldn't load history — retry</p>
              <button
                onClick={fetchHistory}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>
              No completed or cancelled orders today
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                <button
                  onClick={fetchHistory}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: 'rgba(255,255,255,0.12)', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-pill)',
                    padding: '0.375rem 0.875rem', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
                    minHeight: '36px',
                  }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
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
          )
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
