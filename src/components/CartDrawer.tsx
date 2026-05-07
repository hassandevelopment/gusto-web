import { useEffect, useRef, useState, memo } from 'react'
import { X, Trash2, ChevronLeft } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { menuData } from '../data/menu'
import Button from './ui/Button'
import IconButton from './ui/IconButton'
import QuantityStepper from './ui/QuantityStepper'
import GustoPlaceholder from './ui/GustoPlaceholder'

const CartThumbnail = memo(function CartThumbnail({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false)
  if (!src || err) return <GustoPlaceholder />
  return <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" onError={() => setErr(true)} />
})

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, totalQty, totalPrice, setQty, clear } = useCart()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [waiterMode, setWaiterMode] = useState(false)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      el.showModal()
      setTimeout(() => closeRef.current?.focus(), 50)
    } else {
      el.close()
      setWaiterMode(false)
    }
  }, [open])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    function handleBackdrop(e: MouseEvent) {
      if (waiterMode) return
      const rect = el!.getBoundingClientRect()
      const outside =
        e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top  || e.clientY > rect.bottom
      if (outside) onClose()
    }
    el.addEventListener('click', handleBackdrop)
    return () => el.removeEventListener('click', handleBackdrop)
  }, [onClose, waiterMode])

  const cartEntries = Object.entries(items)
    .map(([id, entry]) => {
      const item = menuData.items.find((i) => i.id === id)
      return item ? { item, entry } : null
    })
    .filter(Boolean) as { item: (typeof menuData.items)[0]; entry: { qty: number; notes?: string } }[]

  const isEmpty = cartEntries.length === 0

  /* ─── shared dialog style — switches between bottom-sheet and full-screen ─── */
  const dialogStyle: React.CSSProperties = waiterMode
    ? {
        position: 'fixed',
        inset: 0,
        width: '100%',
        maxWidth: '100%',
        height: '100dvh',
        margin: 0,
        padding: 0,
        border: 'none',
        borderRadius: 0,
        overflow: 'hidden',
      }
    : {
        position: 'fixed',
        inset: 'auto 10px 0 10px',
        width: 'calc(100% - 20px)',
        maxWidth: '480px',
        maxHeight: '88dvh',
        margin: '0 auto',
        padding: 0,
        border: 'none',
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
      }

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={waiterMode ? 'Show waiter' : 'Your order'}
      style={dialogStyle}
      className={`bg-card ${!waiterMode ? 'slide-up' : ''}`}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >

      {/* ══════════════ WAITER MODE ══════════════ */}
      {waiterMode ? (
        <>
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-6 bg-card flex-shrink-0"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px', borderBottom: '1px solid rgba(104,90,90,0.10)' }}
          >
            <button
              onClick={() => setWaiterMode(false)}
              className="flex items-center gap-1 text-text-muted hover:text-ink transition-colors cursor-pointer select-none"
            >
              <ChevronLeft size={18} strokeWidth={1.75} />
              <span className="text-sm font-medium">Back</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full flex items-center justify-center
                         text-text-muted hover:text-ink active:scale-[0.92] transition-transform cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body — flex-1 works because dialog has explicit height: 100dvh */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-8 py-7">

            {/* Brand */}
            <div className="text-center mb-6">
              <p
                className="text-ink tracking-[0.15em] text-xs uppercase mb-1"
                style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 400 }}
              >
                GUSTO
              </p>
              <p
                className="text-text-muted"
                style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '0.9rem' }}
              >
                pizzeria ristorante
              </p>

              {/* ornamental flourish */}
              <div className="flex justify-center mt-3 mb-4 text-ink/40">
                <svg width="80" height="12" viewBox="0 0 80 12" aria-hidden="true"
                     fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round">
                  <path d="M2 6 L26 6" />
                  <path d="M54 6 L78 6" />
                  <path d="M30 6 C 32 4, 34 4, 36 6 C 38 8, 40 8, 40 6" />
                  <path d="M50 6 C 48 4, 46 4, 44 6 C 42 8, 40 8, 40 6" />
                  <circle cx="40" cy="6" r="0.9" fill="currentColor" />
                </svg>
              </div>

              <h2
                className="text-ink"
                style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: 'clamp(1.6rem, 6vw, 2rem)' }}
              >
                Your Order
              </h2>
            </div>

            {/* Items */}
            <ul className="space-y-5 mb-8">
              {cartEntries.map(({ item, entry }) => (
                <li key={item.id} className="flex items-start gap-4">
                  {/* qty badge — explicit square so rounded-full is always a circle */}
                  <span
                    className="rounded-full bg-ink text-white font-semibold
                               flex items-center justify-center flex-none"
                    style={{
                      width: '28px',
                      height: '28px',
                      minWidth: '28px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-wordmark)',
                      marginTop: '2px',
                    }}
                  >
                    {entry.qty}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-ink leading-snug"
                      style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '1.05rem' }}
                    >
                      {item.name}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-text-muted mt-0.5 italic leading-snug">{entry.notes}</p>
                    )}
                  </div>
                  <p
                    className="flex-none tabular-nums text-ink"
                    style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 500, fontSize: '0.9rem', paddingTop: '3px' }}
                  >
                    {item.price !== null ? `BHD ${(item.price * entry.qty).toFixed(2)}` : '—'}
                  </p>
                </li>
              ))}
            </ul>

            {/* Total + instruction */}
            <div className="border-t border-[rgba(104,90,90,0.18)] pt-5 text-center">
              <p className="text-text-muted text-xs tracking-[0.12em] uppercase mb-2">
                {totalQty} {totalQty === 1 ? 'item' : 'items'} · VAT incl.
              </p>
              <p
                className="text-ink tabular-nums"
                style={{
                  fontFamily: 'var(--font-italic)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(1.8rem, 7vw, 2.2rem)',
                  letterSpacing: '-0.01em',
                }}
              >
                BHD {totalPrice.toFixed(2)}
              </p>
            </div>

            {/* Instruction band */}
            <div className="mt-6 rounded-xl border border-[rgba(104,90,90,0.14)] px-4 py-3 text-center bg-bg">
              <p
                className="text-text-muted"
                style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '0.95rem' }}
              >
                Show this screen to your waiter
              </p>
            </div>
          </div>

          {/* Done button — flex-shrink-0 keeps it pinned at bottom */}
          <div
            className="flex-shrink-0 px-6 pt-3 bg-card border-t border-[rgba(104,90,90,0.10)] flex flex-col items-center"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            <Button variant="primary" size="lg" className="w-full max-w-[320px]" onClick={onClose}>
              Done
            </Button>
          </div>
        </>
      ) : (

      /* ══════════════ CART MODE ══════════════ */
        <>
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-[rgba(104,90,90,0.18)]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(104,90,90,0.12)] flex-shrink-0">
            <h2
              className="text-ink"
              style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '1.25rem' }}
            >
              Your order
            </h2>
            <div className="flex gap-2">
              {!isEmpty && (
                <IconButton icon={<Trash2 size={16} />} label="Clear order" variant="ghost" size="sm" onClick={clear} />
              )}
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close cart"
                className="w-9 h-9 rounded-full bg-bg flex items-center justify-center
                           text-text-muted hover:text-ink active:scale-[0.92] transition-transform cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body — explicit maxHeight so items scroll without needing flex-1 on a height-less parent */}
          <div
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: 'calc(88dvh - 60px - 64px - 108px)' }}
          >
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
                <p className="font-semibold text-text-muted mb-1">Your order is empty</p>
                <p className="text-sm text-text-muted/70">Tap any item to add it</p>
              </div>
            ) : (
              <ul className="divide-y divide-[rgba(104,90,90,0.08)] px-5">
                {cartEntries.map(({ item, entry }) => (
                  <li key={item.id} className="py-4 flex gap-3">
                    <div className="w-14 h-14 rounded-[8px] overflow-hidden bg-bg flex-shrink-0">
                      <CartThumbnail src={item.image} alt={item.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-ink text-sm leading-tight line-clamp-1 mb-1"
                        style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontWeight: 500 }}
                      >
                        {item.name}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-text-muted mb-1 line-clamp-1 italic">{entry.notes}</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <QuantityStepper
                          value={entry.qty}
                          onChange={(next) => setQty(item.id, next)}
                          min={0}
                          max={20}
                          itemName={item.name}
                          compact
                        />
                        <p className="text-sm font-bold text-text tabular-nums">
                          {item.price !== null ? `BHD ${(item.price * entry.qty).toFixed(2)}` : '—'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {!isEmpty && (
            <div
              className="px-6 pt-4 border-t border-[rgba(104,90,90,0.12)] bg-card flex-shrink-0 flex flex-col items-center"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
            >
              <div className="w-full flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text">
                  Total{' '}
                  <span className="text-text-muted font-normal">
                    ({totalQty} {totalQty === 1 ? 'item' : 'items'})
                  </span>
                </span>
                <span className="font-bold text-ink text-lg tabular-nums">
                  BHD {totalPrice.toFixed(2)}
                </span>
              </div>
              <Button variant="primary" size="lg" className="w-full max-w-[320px]" onClick={() => setWaiterMode(true)}>
                Show waiter
              </Button>
            </div>
          )}
        </>
      )}
    </dialog>
  )
}
