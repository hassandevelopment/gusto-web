import { useState } from 'react'
import type { KitchenOrder } from '../../types'

// Why a manual refund is owed, derived from the COLUMNS the row carries, not from
// ADR-046 prose. Each of the five directions leaves a distinct (payment_status,
// status) quadrant on an online order (refund_owed gates entry for three of them;
// the paid+cancelled quadrant enters via either arm of the display predicate):
//
//   paid    + cancelled  → dir 3: staff cancelled an order after it was paid
//   pending + cancelled  → dir 1: webhook captured an order already cancelled
//   pending + placed     → dir 4: captured at the wrong amount, never marked paid
//   paid    + live        → dir 5: a second capture landed on an already-paid order
function refundReason(o: KitchenOrder): string {
  const paid = o.payment_status === 'paid'
  const cancelled = o.status === 'cancelled'
  if (paid && cancelled) return 'Cancelled after payment was captured'
  if (!paid && cancelled) return 'Payment captured on an order the customer had already cancelled'
  if (!paid && !cancelled) return 'Money captured at the wrong amount, order never marked paid'
  return 'Charged twice, a second capture landed on an already-paid order'
}

// The clear action has two shapes, gated on payment_status (ADR-046 amendment 3):
//   * paid rows (dirs 3, 5): clear the flag only, NEVER touch status. A dir-5 order
//     is still live on the cook board and must keep cooking; a dir-3 order stays
//     cancelled. Clearing status here would either yank a live order off the board
//     or rewrite a terminal one.
//   * not-paid + still-live (dir 4): clearing the flag alone would leave it online +
//     placed + unpaid + refund_owed=false, which is exactly the digest STUCK query,
//     so the alert would move bucket instead of closing and the order would stay
//     invisible to the kitchen. Void it in the SAME update. (Dir 4 is not on the cook
//     board anyway: unpaid online rows are hidden.)
//   * not-paid + already cancelled (dir 1): clear the flag only; it is terminal and
//     not a STUCK candidate (STUCK needs status='placed'). Do not rewrite cancelled_by.
function willVoid(o: KitchenOrder): boolean {
  return o.payment_status !== 'paid' && o.status !== 'cancelled'
}

interface RefundCardProps {
  order: KitchenOrder
  onMarkRefunded: (order: KitchenOrder) => Promise<{ ok: boolean; error?: string }>
}

export default function RefundCard({ order, onMarkRefunded }: RefundCardProps) {
  const [pending, setPending] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const totalBhd = (order.total_fils / 1000).toFixed(3)
  const voids = willVoid(order)
  const actionLabel = voids ? 'Void order and mark refunded' : 'Mark refunded'

  // Who to phone once the Tap refund is processed. Guests carry contact inline;
  // anonymized deleted-user orders have no reachable contact; everyone else
  // resolves from the joined profile (same rules as the active board's OrderCard).
  const customerName = order.is_guest_order
    ? `${order.guest_name ?? 'Guest'} (guest)`
    : order.was_deleted_user
      ? '(Deleted account)'
      : (order.customer?.full_name ?? '(Unknown)')
  const customerPhone = order.is_guest_order ? order.guest_phone : (order.customer?.phone ?? null)

  async function handleConfirm() {
    setPending(true)
    setError(null)
    const result = await onMarkRefunded(order)
    if (!result.ok) {
      setPending(false)
      setError(result.error ?? 'Could not mark refunded')
    }
    // On ok: the parent drops this card from the refund list.
  }

  async function copyChargeId() {
    if (!order.tap_charge_id) return
    try {
      await navigator.clipboard.writeText(order.tap_charge_id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked (insecure context / permissions) — the id is selectable text anyway.
    }
  }

  return (
    <div style={{
      background: 'var(--color-card)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      borderLeft: '4px solid #DC2626',
      padding: '0.75rem',
      marginBottom: '1rem',
      breakInside: 'avoid',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Order number + amount */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1 }}>
          GST-{order.order_number}
        </span>
        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-ink)', whiteSpace: 'nowrap' }}>
          BHD {totalBhd}
        </span>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.125rem 0 0' }}>
        order total
      </p>

      {/* Who to call. The refund is only closed once the customer is told, so the
          phone is a tap-to-call link right on the card. */}
      <p style={{ fontSize: '0.9375rem', color: 'var(--color-ink)', fontWeight: 600, margin: '0.5rem 0 0' }}>
        {customerName}
      </p>
      {customerPhone && (
        <p style={{ fontSize: '0.875rem', margin: '0.0625rem 0 0' }}>
          <a href={`tel:${customerPhone}`} style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
            {customerPhone}
          </a>
        </p>
      )}

      {/* Why it is owed */}
      <div style={{
        background: '#FEE2E2', color: '#991B1B',
        padding: '0.5rem 0.625rem', borderRadius: '6px',
        fontSize: '0.875rem', fontWeight: 600, marginTop: '0.625rem',
      }}>
        {refundReason(order)}
      </div>

      {/* Tap charge id — the key Hassan uses to find the charge in the Tap dashboard. */}
      <div style={{ marginTop: '0.625rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Tap charge id
        </p>
        {order.tap_charge_id ? (
          <button
            onClick={copyChargeId}
            title="Copy charge id"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              background: 'rgba(104,90,90,0.06)', border: '1px solid rgba(104,90,90,0.15)',
              borderRadius: '6px', padding: '0.25rem 0.5rem', marginTop: '0.25rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.8125rem', color: 'var(--color-ink)',
              cursor: 'pointer', maxWidth: '100%', overflowX: 'auto',
            }}
          >
            {order.tap_charge_id}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {copied ? 'copied' : 'copy'}
            </span>
          </button>
        ) : (
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: '0.25rem 0 0' }}>
            no charge id on file
          </p>
        )}
      </div>

      {/* Action */}
      <div style={{ borderTop: '1px solid rgba(104,90,90,0.08)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
        {confirm ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleConfirm}
              disabled={pending}
              style={{
                flex: 1, background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-pill)',
                padding: '0.625rem 1rem', minHeight: '44px',
                fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9375rem',
                cursor: pending ? 'default' : 'pointer', opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? '…' : voids ? 'Confirm void and refund' : 'Confirm refunded'}
            </button>
            <button
              onClick={() => setConfirm(false)}
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
          <button
            onClick={() => setConfirm(true)}
            style={{
              width: '100%', background: 'var(--color-ink)', color: '#fff',
              border: 'none', borderRadius: 'var(--radius-pill)',
              padding: '0.625rem 1rem', minHeight: '44px',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9375rem',
              cursor: 'pointer',
            }}
          >
            {actionLabel}
          </button>
        )}
        {voids && !confirm && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 0' }}>
            This order was never marked paid. Marking it refunded also cancels it so it stops re-alerting.
          </p>
        )}
        {error && (
          <p style={{ fontSize: '0.8125rem', color: '#DC2626', margin: '0.5rem 0 0' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
