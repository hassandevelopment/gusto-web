import type { AddressSnapshot, KitchenOrder } from '../../types'

function formatAge(placedAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`
}

function formatAddress(snap: AddressSnapshot): string {
  const parts: string[] = []
  if (snap.label) parts.push(snap.label + ':')
  if (snap.block) parts.push(`Block ${snap.block}`)
  if (snap.road) parts.push(`Road ${snap.road}`)
  if (snap.building) parts.push(`Bldg ${snap.building}`)
  if (snap.apartment) parts.push(`Apt ${snap.apartment}`)
  if (snap.area) parts.push(snap.area)
  return parts.join(', ')
}

interface OrderCardProps {
  order: KitchenOrder
}

export default function OrderCard({ order }: OrderCardProps) {
  const { order_number, order_type, status: _status, placed_at, customer,
    order_note, items, address_snapshot, total_fils } = order

  const isDelivery = order_type === 'delivery'
  const customerName = customer?.full_name ?? '(Unknown)'
  const customerPhone = customer?.phone ?? null

  const totalBhd = (total_fils / 1000).toFixed(3)

  return (
    <div style={{
      background: 'var(--color-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '0.75rem',
      marginBottom: '0.75rem',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Row 1: order number + type badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1 }}>
          #{order_number}
        </span>
        <span style={{
          background: isDelivery ? 'var(--color-accent)' : 'var(--color-success)',
          color: '#fff',
          borderRadius: 'var(--radius-pill)',
          padding: '0.2rem 0.6rem',
          fontSize: '0.75rem', fontWeight: 700,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {isDelivery ? 'DELIVERY' : 'PICKUP'}
        </span>
      </div>

      {/* Row 2: time */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.25rem 0' }}>
        {formatAge(placed_at)}
      </p>

      {/* Row 3: customer */}
      <p style={{ fontSize: '0.9375rem', color: 'var(--color-ink)', fontWeight: 600, marginBottom: '0.125rem' }}>
        {customerName}
        {customerPhone && (
          <>
            {' · '}
            <a
              href={`tel:${customerPhone}`}
              style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 400 }}
            >
              {customerPhone}
            </a>
          </>
        )}
      </p>

      {/* Order note warning strip */}
      {order_note && (
        <div style={{
          background: '#FEF3C7', color: '#92400E',
          padding: '0.5rem', borderRadius: '6px',
          fontSize: '0.875rem', marginTop: '0.5rem',
          borderTop: '1px solid rgba(104,90,90,0.08)',
          paddingTop: '0.5rem',
        }}>
          {order_note}
        </div>
      )}

      {/* Items list */}
      <div style={{ borderTop: '1px solid rgba(104,90,90,0.08)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
        {items.map(item => (
          <div key={item.id} style={{ marginBottom: '0.375rem' }}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-ink)', margin: 0 }}>
              {item.quantity} × {item.name_snapshot}
            </p>
            {item.addons.map(addon => (
              <p key={addon.id} style={{
                fontSize: '0.875rem', color: 'var(--color-text-muted)',
                paddingLeft: '1rem', margin: 0,
              }}>
                + {addon.name_snapshot}
              </p>
            ))}
            {item.line_note && (
              <p style={{
                fontSize: '0.875rem', color: 'var(--color-text-muted)',
                fontStyle: 'italic', paddingLeft: '1rem', margin: 0,
              }}>
                {item.line_note}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Address (delivery only) */}
      {isDelivery && (
        <div style={{
          borderTop: '1px solid rgba(104,90,90,0.08)',
          marginTop: '0.5rem', paddingTop: '0.5rem',
          fontSize: '0.875rem', color: 'var(--color-text)',
        }}>
          {address_snapshot
            ? (
              <>
                <p style={{ margin: 0 }}>{formatAddress(address_snapshot)}</p>
                {address_snapshot.notes && (
                  <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                    (note: {address_snapshot.notes})
                  </p>
                )}
              </>
            )
            : <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>(no delivery address on file)</p>
          }
        </div>
      )}

      {/* Total */}
      <p style={{
        textAlign: 'right', fontSize: '0.875rem',
        color: 'var(--color-text-muted)', fontWeight: 600,
        marginTop: '0.5rem', marginBottom: 0,
      }}>
        BHD {totalBhd}
      </p>
    </div>
  )
}
