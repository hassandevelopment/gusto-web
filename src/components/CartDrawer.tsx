import { useEffect, useRef } from 'react'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { menuData } from '../data/menu'
import Button from './ui/Button'
import IconButton from './ui/IconButton'
import QuantityStepper from './ui/QuantityStepper'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, totalQty, totalPrice, setQty, clear } = useCart()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      el.showModal()
      setTimeout(() => closeRef.current?.focus(), 50)
    } else {
      el.close()
    }
  }, [open])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    function handleBackdrop(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      const clickedOutside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      if (clickedOutside) onClose()
    }
    el.addEventListener('click', handleBackdrop)
    return () => el.removeEventListener('click', handleBackdrop)
  }, [onClose])

  const cartEntries = Object.entries(items)
    .map(([id, entry]) => {
      const item = menuData.items.find((i) => i.id === id)
      return item ? { item, entry } : null
    })
    .filter(Boolean) as { item: (typeof menuData.items)[0]; entry: { qty: number; notes?: string } }[]

  const isEmpty = cartEntries.length === 0

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label="Your order"
      style={{
        position: 'fixed',
        inset: 'auto 0 0 0',
        maxWidth: '100%',
        width: '100%',
        maxHeight: '88dvh',
        margin: 0,
        padding: 0,
        border: 'none',
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
      }}
      className="bg-card slide-up"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-[rgba(104,90,90,0.18)]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(104,90,90,0.12)] flex-shrink-0">
        <h2 className="font-extrabold text-accent-dark text-lg">Your order</h2>
        <div className="flex gap-2">
          {!isEmpty && (
            <IconButton
              icon={<Trash2 size={16} />}
              label="Clear order"
              variant="ghost"
              size="sm"
              onClick={clear}
            />
          )}
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close cart"
            className="w-9 h-9 rounded-full bg-bg flex items-center justify-center
                       text-text-muted hover:text-text active:scale-[0.92]
                       transition-transform cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto overscroll-contain flex-1">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center mb-4">
              <ShoppingBag size={28} className="text-text-muted" />
            </div>
            <p className="font-semibold text-text-muted mb-1">Your order is empty</p>
            <p className="text-sm text-text-muted/70">Tap any item to add it</p>
          </div>
        ) : (
          <ul className="divide-y divide-[rgba(104,90,90,0.08)] px-5">
            {cartEntries.map(({ item, entry }) => (
              <li key={item.id} className="py-4 flex gap-3">
                <div className="w-16 h-16 rounded-[8px] overflow-hidden bg-bg flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-accent-dark text-sm line-clamp-1 mb-0.5">
                    {item.name}
                  </p>
                  {entry.notes && (
                    <p className="text-xs text-text-muted mb-1 line-clamp-1 italic">
                      {entry.notes}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <QuantityStepper
                      value={entry.qty}
                      onChange={(next) => setQty(item.id, next)}
                      min={0}
                      max={20}
                      itemName={item.name}
                    />
                    <p className="text-sm font-bold text-text tabular-nums">
                      {item.price !== null
                        ? `BHD ${(item.price * entry.qty).toFixed(2)}`
                        : '—'}
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
          className="px-5 pt-4 border-t border-[rgba(104,90,90,0.12)] bg-card flex-shrink-0"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-text">
              Total{' '}
              <span className="text-text-muted font-normal">
                ({totalQty} {totalQty === 1 ? 'item' : 'items'})
              </span>
            </span>
            <span className="font-extrabold text-accent-dark text-lg tabular-nums">
              BHD {totalPrice.toFixed(2)}
            </span>
          </div>
          <Button variant="primary" size="lg" className="w-full" onClick={onClose}>
            Show waiter
          </Button>
        </div>
      )}
    </dialog>
  )
}
