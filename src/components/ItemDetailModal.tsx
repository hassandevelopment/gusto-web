import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { MenuItem } from '../types'
import { useCart } from '../contexts/CartContext'
import Button from './ui/Button'
import QuantityStepper from './ui/QuantityStepper'

const TAG_LABELS: Record<string, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  seafood: 'Seafood',
  spicy: 'Spicy',
  'gluten-free': 'Gluten-free',
  'contains-nuts': 'Contains nuts',
}

interface Props {
  item: MenuItem | null
  onClose: () => void
}

export default function ItemDetailModal({ item, onClose }: Props) {
  const { items: cartItems, add, setQty, setNotes } = useCart()
  const [localQty, setLocalQty] = useState(1)
  const [localNotes, setLocalNotes] = useState('')
  const [imgErrored, setImgErrored] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!item) return
    const entry = cartItems[item.id]
    setLocalQty(entry?.qty ?? 1)
    setLocalNotes(entry?.notes ?? '')
    setImgErrored(false)
  }, [item?.id])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (item) {
      el.showModal()
      setTimeout(() => closeRef.current?.focus(), 50)
    } else {
      el.close()
    }
  }, [item])

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

  function handleAdd() {
    if (!item) return
    const inCart = !!cartItems[item.id]
    if (inCart) {
      setQty(item.id, localQty)
      if (localNotes !== (cartItems[item.id]?.notes ?? '')) {
        setNotes(item.id, localNotes)
      }
    } else {
      add(item.id, localQty, localNotes || undefined)
    }
    onClose()
  }

  const price = item?.price !== null && item?.price !== undefined
    ? `BHD ${item.price.toFixed(2)}`
    : 'Price TBD'
  const inCart = item ? !!cartItems[item.id] : false

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={item?.name ?? 'Item details'}
      style={{
        position: 'fixed',
        inset: 'auto 0 0 0',
        maxWidth: '100%',
        width: '100%',
        maxHeight: '92dvh',
        margin: 0,
        padding: 0,
        border: 'none',
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
      }}
      className="bg-card slide-up"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      {item && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '92dvh' }}>
          {/* Image */}
          <div className="relative w-full flex-shrink-0 bg-bg overflow-hidden" style={{ height: '38dvh' }}>
            {imgErrored ? (
              <div className="absolute inset-0 skeleton" />
            ) : (
              <img
                src={item.image}
                alt={`${item.name} — ${item.description ?? 'menu item'}`}
                loading="eager"
                decoding="async"
                width={600}
                height={600}
                className="w-full h-full object-cover"
                onError={() => setImgErrored(true)}
              />
            )}
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 text-white
                         flex items-center justify-center backdrop-blur-sm
                         active:scale-[0.92] transition-transform cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto overscroll-contain flex-1 p-5"
               style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
            {/* Name + price */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="font-extrabold text-accent-dark leading-tight flex-1"
                  style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)' }}>
                {item.name}
              </h2>
              <p className="font-bold text-text text-lg tabular-nums shrink-0">{price}</p>
            </div>

            {item.description && (
              <p className="text-sm text-text-muted leading-relaxed mb-3">{item.description}</p>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {item.tags.map((tag) => (
                  <span key={tag}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success">
                    {TAG_LABELS[tag] ?? tag}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-[rgba(104,90,90,0.12)] my-4" />

            {/* Quantity */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-text">Quantity</span>
              <QuantityStepper
                value={localQty}
                onChange={setLocalQty}
                min={1}
                max={20}
                itemName={item.name}
              />
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label htmlFor="item-notes"
                     className="block text-sm font-semibold text-text mb-1.5">
                Special requests{' '}
                <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="item-notes"
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="e.g. extra spicy, no onions…"
                rows={2}
                maxLength={200}
                className="w-full text-sm text-text bg-bg rounded-[10px]
                           border border-[rgba(104,90,90,0.18)]
                           px-3 py-2.5 resize-none placeholder:text-text-muted/60
                           focus:outline-2 focus:outline-accent-dark focus:outline-offset-0"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleAdd}
            >
              {inCart ? 'Update order' : `Add to order · ${price}`}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
