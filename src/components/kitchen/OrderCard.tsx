import { useEffect, useState } from 'react'
import type { AddressSnapshot, KitchenOrder, KitchenOrderItemVariant, OrderStatus } from '../../types'

// Cooking-relevant phrasing for a variant choice. Returns null to hide a row.
// Mirrors the customer cart label rules for consistency: defaults are silent,
// the 'spicy' parent toggle is implicit in the spice-level row beneath it.
function variantDisplay(v: KitchenOrderItemVariant): string | null {
  switch (v.group_slug_snapshot) {
    case 'crust':
      // 'regular' = standard (hidden); 'thin' → "Thin Crust"
      return v.option_slug_snapshot === 'regular' ? null : `${v.option_label_snapshot} Crust`
    case 'diavola_spicy':
      // 'not_spicy' default + 'spicy' parent both hidden (spice-level row conveys it)
      return null
    case 'diavola_spice_level':
      // "Mild Spice" / "Regular Spice" / "Extra Spice"
      return `${v.option_label_snapshot} Spice`
    default:
      // Future variant groups Robel hasn't seen — degrade gracefully.
      return `${v.group_label_snapshot}: ${v.option_label_snapshot}`
  }
}

function formatAge(placedAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`
}

// Scheduled fulfillment time for the PREPARE BY banner (ADR-012). Always Asia/Bahrain —
// never the kitchen device's timezone. Appends the date only when the scheduled Bahrain
// day differs from today's (e.g. viewing an older order): "11:15 PM · Jun 12".
const BAHRAIN_TZ = 'Asia/Bahrain'
const BAHRAIN_TIME_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: BAHRAIN_TZ,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})
const BAHRAIN_DAY_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: BAHRAIN_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}) // en-CA → "YYYY-MM-DD", safe to string-compare
const BAHRAIN_DATE_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: BAHRAIN_TZ,
  month: 'short',
  day: 'numeric',
})

function formatPrepareBy(scheduledFor: string): string {
  const when = new Date(scheduledFor)
  const time = BAHRAIN_TIME_FMT.format(when)
  const sameDay = BAHRAIN_DAY_FMT.format(when) === BAHRAIN_DAY_FMT.format(new Date())
  return sameDay ? time : `${time} · ${BAHRAIN_DATE_FMT.format(when)}`
}

function formatAddress(snap: AddressSnapshot): string {
  const parts: string[] = []
  if (snap.label) parts.push(snap.label)
  if (snap.area) parts.push(snap.area)
  if (snap.block) parts.push(`Block ${snap.block}`)
  if (snap.road) parts.push(`Road ${snap.road}`)
  if (snap.building) parts.push(`Bldg ${snap.building}`)
  if (snap.apartment) parts.push(`Apt ${snap.apartment}`)
  return parts.join(', ')
}

// Status chip meta for the flat card grid (tablet/phone), where there are no
// column headers to convey state. Colors mirror the Kanban COLUMNS in KitchenPage.
const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  placed:           { label: 'NEW',              color: 'var(--color-accent)' },
  preparing:        { label: 'PREPARING',        color: '#D97706' },
  ready:            { label: 'READY',            color: 'var(--color-success)' },
  out_for_delivery: { label: 'OUT FOR DELIVERY', color: '#2563EB' },
  completed:        { label: 'COMPLETED',        color: '#6B7280' },
  cancelled:        { label: 'CANCELLED',        color: '#DC2626' },
}

function nextAction(
  status: OrderStatus,
  orderType: 'delivery' | 'pickup',
): { label: string; next: OrderStatus } | null {
  switch (status) {
    case 'placed':           return { label: 'Start preparing',  next: 'preparing' }
    case 'preparing':        return { label: 'Mark ready',       next: 'ready' }
    case 'ready':
      return orderType === 'delivery'
        ? { label: 'Out for delivery', next: 'out_for_delivery' }
        : { label: 'Mark picked up',   next: 'completed' }
    case 'out_for_delivery': return { label: 'Mark delivered',   next: 'completed' }
    default:                 return null
  }
}

interface OrderCardProps {
  order: KitchenOrder
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<{ ok: boolean; error?: string }>
  readOnly?: boolean
  // Flat card grid (tablet/phone) has no Kanban column headers — show a status
  // chip on the card so staff can read the stage at a glance. Off in Kanban mode.
  showStatus?: boolean
}

export default function OrderCard({ order, onUpdateStatus, readOnly = false, showStatus = false }: OrderCardProps) {
  const { order_number, order_type, status, placed_at, customer,
    order_note, items, address_snapshot, total_fils, scheduled_for, cancelled_by,
    is_guest_order, was_deleted_user, guest_name, guest_phone } = order

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  // Reset button state whenever the order moves to a new status
  useEffect(() => {
    setPending(false)
    setCancelConfirm(false)
    setError(null)
  }, [status])

  const isDelivery = order_type === 'delivery'
  // Guest orders carry contact inline; anonymized deleted-user orders show a
  // placeholder; everyone else resolves from the joined profile.
  const customerName = is_guest_order
    ? `${guest_name ?? 'Guest'} (guest)`
    : was_deleted_user
      ? '(Deleted account)'
      : (customer?.full_name ?? '(Unknown)')
  const customerPhone = is_guest_order ? guest_phone : (customer?.phone ?? null)
  const totalBhd = (total_fils / 1000).toFixed(3)
  const action = nextAction(status, order_type)

  async function handleAdvance() {
    if (!action || pending) return
    setPending(true)
    setError(null)
    const result = await onUpdateStatus(order.id, action.next)
    if (!result.ok) {
      setPending(false)
      setError(result.error ?? 'Update failed')
    }
    // On ok: card moves/clears via optimistic update; pending stays true until status effect resets
  }

  async function handleCancelConfirm() {
    setPending(true)
    setError(null)
    const result = await onUpdateStatus(order.id, 'cancelled')
    if (!result.ok) {
      setPending(false)
      setError(result.error ?? 'Cancel failed')
    }
  }

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
          GST-{order_number}
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

      {/* Status chip — flat card grid only (tablet/phone). Own full-width row, large
          and bold so the stage reads from a few feet away at the kitchen screen. */}
      {showStatus && (
        <div style={{
          display: 'inline-block',
          background: STATUS_META[status].color, color: '#fff',
          borderRadius: 'var(--radius-pill)',
          padding: '0.35rem 0.85rem',
          marginTop: '0.5rem',
          fontSize: '0.9375rem', fontWeight: 800,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {STATUS_META[status].label}
        </div>
      )}

      {/* Customer-cancelled marker (History tab) — amber, matching the REWARD marker.
          Staff-cancelled orders show nothing extra (staff knows they did it). */}
      {status === 'cancelled' && cancelled_by === 'customer' && (
        <p style={{ color: '#FBBF24', fontWeight: 700, fontSize: '0.875rem', margin: '0.375rem 0 0' }}>
          Cancelled by customer
        </p>
      )}

      {/* PREPARE BY / READY BY banner (ADR-012) — scheduled orders only. The loudest line on the
          card: full-width ink strip, large bold amber text, so staff can't miss it.
          Delivery says "READY BY" (food must be ready for driver pickup by this time).
          Pickup says "PREPARE BY" (customer arrives at this time).
          Pulses at 1.5s to grab attention without being seizure-inducing. */}
      {scheduled_for && (
        <div style={{
          background: 'var(--color-ink)',
          color: '#FBBF24',
          borderRadius: 'var(--radius-card)',
          padding: '0.5rem 0.75rem',
          margin: '0.5rem 0 0',
          fontSize: '1.25rem',
          fontWeight: 800,
          letterSpacing: '0.02em',
          textAlign: 'center',
          lineHeight: 1.15,
          animation: 'scheduledPulse 1.5s ease-in-out infinite',
        }}>
          {order_type === 'delivery' ? 'READY BY' : 'PREPARE BY'} {formatPrepareBy(scheduled_for)}
        </div>
      )}

      {/* Row 2: time */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.25rem 0' }}>
        {formatAge(placed_at)}
      </p>

      {/* Row 3: customer. For guests the phone sits on its own line below the name. */}
      <p style={{ fontSize: '0.9375rem', color: 'var(--color-ink)', fontWeight: 600, marginBottom: '0.125rem' }}>
        {customerName}
        {customerPhone && !is_guest_order && (
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
      {customerPhone && is_guest_order && (
        <p style={{ fontSize: '0.875rem', margin: '0 0 0.125rem' }}>
          <a
            href={`tel:${customerPhone}`}
            style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
          >
            {customerPhone}
          </a>
        </p>
      )}

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
        {items.map(item => {
          // Redeemed loyalty rewards (ADR-013) — comped, price 0. Flag for staff.
          const isReward = item.line_note === 'REWARD'
          return (
          <div key={item.id} style={{ marginBottom: '0.375rem' }}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-ink)', margin: 0 }}>
              {isReward ? (
                <>
                  <span style={{ color: '#FBBF24', fontWeight: 700 }}>REWARD</span>
                  {' · '}
                  {item.name_snapshot}
                </>
              ) : (
                <>{item.quantity} × {item.name_snapshot}</>
              )}
            </p>
            {item.variants
              .map(v => ({ id: v.id, label: variantDisplay(v) }))
              .filter((v): v is { id: string; label: string } => v.label !== null)
              .map(v => (
                <p key={v.id} style={{
                  fontSize: '0.875rem', color: 'var(--color-ink)',
                  fontWeight: 600, paddingLeft: '1rem', margin: 0,
                }}>
                  {v.label}
                </p>
              ))}
            {item.addons.map(addon => (
              <p key={addon.id} style={{
                fontSize: '0.875rem', color: 'var(--color-text-muted)',
                paddingLeft: '1rem', margin: 0,
              }}>
                + {addon.name_snapshot}
              </p>
            ))}
            {item.line_note && !isReward && (
              <p style={{
                fontSize: '0.875rem', color: 'var(--color-text-muted)',
                fontStyle: 'italic', paddingLeft: '1rem', margin: 0,
              }}>
                {item.line_note}
              </p>
            )}
          </div>
          )
        })}
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
                {address_snapshot.additional_notes && (
                  <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                    (note: {address_snapshot.additional_notes})
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

      {/* Action row — hidden on read-only history cards */}
      {!readOnly && <div style={{
        borderTop: '1px solid rgba(104,90,90,0.08)',
        marginTop: '0.75rem', paddingTop: '0.75rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
      }}>
        {cancelConfirm ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleCancelConfirm}
              disabled={pending}
              style={{
                flex: 1, background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-pill)',
                padding: '0.625rem 1rem', minHeight: '44px',
                fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9375rem',
                cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1,
              }}
            >
              Confirm cancel
            </button>
            <button
              onClick={() => setCancelConfirm(false)}
              disabled={pending}
              style={{
                background: 'transparent', color: 'var(--color-text-muted)',
                border: '1px solid rgba(104,90,90,0.2)', borderRadius: 'var(--radius-pill)',
                padding: '0.5rem 1rem', minHeight: '44px',
                fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
                cursor: pending ? 'default' : 'pointer',
              }}
            >
              Back
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {action && (
              <button
                onClick={handleAdvance}
                disabled={pending}
                style={{
                  flex: 1, background: 'var(--color-accent)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-pill)',
                  padding: '0.625rem 1rem', minHeight: '44px',
                  fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.9375rem',
                  cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? '…' : action.label}
              </button>
            )}
            <button
              onClick={() => setCancelConfirm(true)}
              disabled={pending}
              style={{
                background: 'transparent', color: 'var(--color-text-muted)',
                border: 'none', padding: '0.5rem',
                fontFamily: 'var(--font-sans)', fontSize: '0.875rem',
                cursor: pending ? 'default' : 'pointer',
              }}
            >
              Cancel ×
            </button>
          </div>
        )}

        {error && (
          <p style={{ fontSize: '0.8125rem', color: '#DC2626', margin: 0 }}>{error}</p>
        )}
      </div>}
    </div>
  )
}
