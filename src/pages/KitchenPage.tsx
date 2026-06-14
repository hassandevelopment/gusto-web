import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Loader2, Volume2, VolumeX } from 'lucide-react'
import { playChime, unlockAudio } from '../lib/chime'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { KitchenOrder, OrderStatus } from '../types'
import KanbanColumn from '../components/kitchen/KanbanColumn'
import OrderCard from '../components/kitchen/OrderCard'

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
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [historyOrders, setHistoryOrders] = useState<KitchenOrder[]>([])
  const [historyFetchState, setHistoryFetchState] = useState<FetchState>('idle')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [soundOn, setSoundOn] = useState(true)
  const soundOnRef = useRef(true)
  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])
  const navigate = useNavigate()

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
      .order('placed_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch orders:', error)
      setFetchState('error')
      return
    }

    const userIds = [...new Set((rawOrders ?? []).map((o: { user_id: string }) => o.user_id))]
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
      customer: profileMap.get(o.user_id) ?? null,
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
      .order('placed_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch history:', error)
      setHistoryFetchState('error')
      return
    }

    const userIds = [...new Set((rawOrders ?? []).map((o: { user_id: string }) => o.user_id))]
    const { data: profiles, error: pErr } = userIds.length
      ? await supabase.from('profiles').select('id, full_name, phone').in('id', userIds)
      : { data: [], error: null }

    if (pErr) console.error('Failed to fetch history profiles:', pErr)

    const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string; phone: string }) => [p.id, p]))
    const merged: KitchenOrder[] = (rawOrders ?? []).map((o: KitchenOrder) => ({
      ...o,
      customer: profileMap.get(o.user_id) ?? null,
    }))

    setHistoryOrders(merged)
    setHistoryFetchState('idle')
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
    async function fetchOrderDetails(orderId: string, userId: string): Promise<KitchenOrder | null> {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*, addons:order_item_addons(*), variants:order_item_variants(*))')
        .eq('id', orderId)
        .maybeSingle()
      if (error || !order) {
        console.error('Realtime: failed to fetch order details', error)
        return null
      }
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('id', userId)
        .maybeSingle()
      if (pErr) console.error('Realtime: failed to fetch customer profile', pErr)
      return { ...(order as KitchenOrder), customer: profile ?? null }
    }

    const channel = supabase
      .channel(topicName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const row = payload.new as { id: string; user_id: string }
          const fullOrder = await fetchOrderDetails(row.id, row.user_id)
          if (!fullOrder) return
          if (soundOnRef.current) playChime()
          setOrders((prev) => {
            // Idempotent by id: a concurrent manual Refresh may have added it already
            if (prev.some((o) => o.id === fullOrder.id)) return prev
            return [...prev, fullOrder].sort((a, b) => a.placed_at.localeCompare(b.placed_at))
          })
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as Partial<KitchenOrder> & { id: string }
          // Spread preserves existing items/customer (not present on the raw row);
          // only orders-table columns (e.g. status) change. Drop terminal statuses.
          setOrders((prev) =>
            prev
              .map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
              .filter((o) => o.status !== 'completed' && o.status !== 'cancelled'),
          )
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id
          if (!deletedId) return
          setOrders((prev) => prev.filter((o) => o.id !== deletedId))
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
    const patch =
      newStatus === 'completed'
        ? { status: newStatus, completed_at: new Date().toISOString() }
        : { status: newStatus }
    try {
      const { error } = await supabase.from('orders').update(patch).eq('id', orderId)
      if (error) return { ok: false, error: error.message }
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
        padding: '0 1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Kitchen</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => fetchOrders({ alertOnPlaced: true })}
            disabled={fetchState === 'loading'}
            aria-label="Refresh orders"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-pill)',
              padding: '0.375rem 0.875rem', cursor: fetchState === 'loading' ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
              minHeight: '36px',
            }}
          >
            {fetchState === 'loading'
              ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <RefreshCw size={15} />
            }
            Refresh
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

          {email && (
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
              padding: '0.375rem 0.875rem', cursor: signingOut ? 'default' : 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
              minHeight: '36px',
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
          {(['active', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'history' && historyFetchState === 'idle' && historyOrders.length === 0) {
                  fetchHistory()
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
                textTransform: 'capitalize',
              }}
            >
              {tab === 'active' ? 'Active' : 'History'}
              {tab === 'active' && activeOrders.length > 0 && (
                <span style={{
                  marginLeft: '0.4rem',
                  background: 'var(--color-accent)', color: '#fff',
                  borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                }}>{activeOrders.length}</span>
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
          ) : (
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
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scheduledPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 1199px) {
          .kitchen-kanban {
            display: flex !important;
            overflow-x: auto;
            padding-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
