import type { KitchenOrder } from '../../types'
import OrderCard from './OrderCard'

interface KanbanColumnProps {
  title: string
  count: number
  headerColor: string
  orders: KitchenOrder[]
}

export default function KanbanColumn({ title, count, headerColor, orders }: KanbanColumnProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minWidth: '300px', flex: '1 1 0',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '8px', overflow: 'hidden',
    }}>
      <div style={{
        background: headerColor, color: '#fff',
        padding: '0.5rem 0.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'var(--font-sans)', fontWeight: 700,
        fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        <span>{title}</span>
        <span style={{
          background: 'rgba(255,255,255,0.25)',
          borderRadius: 'var(--radius-pill)',
          padding: '0.125rem 0.5rem',
          fontSize: '0.75rem', fontWeight: 700,
          minWidth: '1.5rem', textAlign: 'center',
        }}>{count}</span>
      </div>
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '0.75rem',
        maxHeight: 'calc(100dvh - 120px)',
      }}>
        {orders.length === 0
          ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>—</p>
          : orders.map(order => <OrderCard key={order.id} order={order} />)
        }
      </div>
    </div>
  )
}
