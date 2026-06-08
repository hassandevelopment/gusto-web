import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { KitchenOrder } from '../types'
import KanbanColumn from '../components/kitchen/KanbanColumn'

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
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null)
    })
  }, [])

  const fetchOrders = useCallback(async () => {
    setFetchState('loading')

    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*, addons:order_item_addons(*))')
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
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

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
            onClick={fetchOrders}
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
      <main style={{ flex: 1, padding: '1rem', overflow: 'hidden' }}>
        {fetchState === 'loading' && orders.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading orders…</span>
          </div>
        ) : fetchState === 'error' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--color-text-muted)' }}>
            <p>Couldn't load orders — retry</p>
            <button
              onClick={fetchOrders}
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            height: '100%',
          }}
          className="kitchen-kanban"
          >
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.key}
                title={col.title}
                headerColor={col.color}
                orders={orders.filter(o => o.status === col.key)}
                count={orders.filter(o => o.status === col.key).length}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
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
