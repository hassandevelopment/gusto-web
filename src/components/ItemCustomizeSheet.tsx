import { useEffect, useRef, useState, memo } from 'react'
import { X, ChevronLeft, Minus, Plus } from 'lucide-react'
import type { MenuItem } from '../types'
import { useCart } from '../contexts/CartContext'
import { parseIngredients, CATEGORY_ADDONS, buildNotes } from '../utils/ingredients'
import GustoPlaceholder from './ui/GustoPlaceholder'
import Button from './ui/Button'

const ItemPhoto = memo(function ItemPhoto({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false)
  if (!src || err) return <GustoPlaceholder />
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading="eager"
      onError={() => setErr(true)}
    />
  )
})

const TAG_LABELS: Record<string, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
  spicy: 'Spicy',
  'contains-nuts': 'Contains nuts',
  seafood: 'Seafood',
}

const SPICE_OPTIONS: { value: 0 | 1 | 2 | 3; label: string; bars: number }[] = [
  { value: 0, label: 'None',   bars: 0 },
  { value: 1, label: 'Mild',   bars: 1 },
  { value: 2, label: 'Medium', bars: 2 },
  { value: 3, label: 'Hot',    bars: 3 },
]

function HeatBars({ count, active }: { count: number; active: boolean }) {
  return (
    <div className="flex gap-[3px] justify-center mt-1.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`rounded-sm transition-all duration-200 ${
            i <= count
              ? active ? 'bg-white' : 'bg-ink'
              : active ? 'bg-white/25' : 'bg-[rgba(104,90,90,0.18)]'
          }`}
          style={{ width: '8px', height: i <= count ? `${8 + i * 3}px` : '8px' }}
        />
      ))}
    </div>
  )
}

interface Props {
  item: MenuItem | null
  onClose: () => void
}

export default function ItemCustomizeSheet({ item, onClose }: Props) {
  const { add } = useCart()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // step 1 = details, step 2 = customise, step 3 = finishing touches (spice + notes)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [spice, setSpice] = useState<0 | 1 | 2 | 3>(0)
  const [notes, setNotes] = useState('')
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (item) {
      setStep(1)
      setRemoved(new Set())
      setAdded(new Set())
      setSpice(0)
      setNotes('')
      setQty(1)
    }
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
      const outside =
        e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top  || e.clientY > rect.bottom
      if (outside) onClose()
    }
    el.addEventListener('click', handleBackdrop)
    return () => el.removeEventListener('click', handleBackdrop)
  }, [onClose])

  const ingredients = item ? parseIngredients(item.description) : []
  const addons = item ? (CATEGORY_ADDONS[item.category] ?? []) : []
  const hasCustomize = ingredients.length > 0 || addons.length > 0

  function toggleRemove(ing: string) {
    setRemoved((prev) => {
      const next = new Set(prev)
      next.has(ing) ? next.delete(ing) : next.add(ing)
      return next
    })
  }

  function toggleAdd(addon: string) {
    setAdded((prev) => {
      const next = new Set(prev)
      next.has(addon) ? next.delete(addon) : next.add(addon)
      return next
    })
  }

  function handleCustomise() {
    setStep(hasCustomize ? 2 : 3)
  }

  function handleAddAsIs() {
    if (!item) return
    add(item.id, qty)
    onClose()
  }

  function handleAddToOrder() {
    if (!item) return
    const customNotes = buildNotes([...removed], [...added], spice)
    const allNotes = [customNotes, notes.trim()].filter(Boolean).join(' | ')
    add(item.id, qty, allNotes || undefined)
    onClose()
  }

  const unitPrice = item?.price ?? 0
  const totalPrice = unitPrice * qty

  const dialogStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 'auto 0 0 0',
    width: '100%',
    maxWidth: '100%',
    maxHeight: '92dvh',
    margin: 0,
    padding: 0,
    border: 'none',
    borderRadius: '20px 20px 0 0',
    overflow: 'hidden',
  }

  return (
    <dialog
      ref={dialogRef}
      style={dialogStyle}
      className="bg-card slide-up"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      aria-modal="true"
      aria-label={item?.name ?? 'Item details'}
    >
      {!item ? null : (
        <>
          {/* Step dots */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              {([1, 2, 3] as const).map((s) => (
                <div
                  key={s}
                  className={`rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-5 h-2 bg-ink'
                      : s < step
                      ? 'w-2 h-2 bg-ink/40'
                      : 'w-2 h-2 bg-[rgba(104,90,90,0.18)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ─── STEP 1: Item Details ─── */}
          {step === 1 && (
            <>
              <div className="absolute top-4 right-4 z-10">
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center
                             text-white active:scale-[0.92] transition-transform cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="w-full aspect-[4/3] overflow-hidden bg-[#f0ede8] flex-shrink-0">
                <ItemPhoto src={item.image} alt={item.name} />
              </div>

              <div className="overflow-y-auto overscroll-contain flex-1 px-5 pt-4 pb-2">
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold uppercase tracking-[0.07em] px-2.5 py-1 rounded-full
                                   bg-bg text-text-muted border border-[rgba(104,90,90,0.18)]"
                      >
                        {TAG_LABELS[tag] ?? tag}
                      </span>
                    ))}
                  </div>
                )}

                <h2
                  className="text-ink mb-2"
                  style={{
                    fontFamily: 'var(--font-italic)',
                    fontStyle: 'italic',
                    fontWeight: 500,
                    fontSize: 'clamp(1.3rem, 5.5vw, 1.6rem)',
                    lineHeight: 1.2,
                  }}
                >
                  {item.name}
                </h2>

                {item.description && (
                  <p className="text-text-muted text-sm leading-relaxed mb-4">
                    {item.description}
                  </p>
                )}

                <p
                  className="text-ink tabular-nums"
                  style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 700, fontSize: '1.1rem' }}
                >
                  {item.price !== null ? `BHD ${item.price.toFixed(2)}` : '—'}
                </p>
              </div>

              <div
                className="flex-shrink-0 px-5 pt-4 border-t border-[rgba(104,90,90,0.10)] bg-card"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-text-muted">Quantity</span>
                  <div className="inline-flex items-center gap-3">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 rounded-full bg-bg border border-[rgba(104,90,90,0.18)]
                                 flex items-center justify-center text-ink
                                 disabled:opacity-40 disabled:pointer-events-none
                                 active:scale-[0.92] transition-transform cursor-pointer"
                    >
                      <Minus size={14} strokeWidth={2} />
                    </button>
                    <span
                      className="min-w-[24px] text-center text-sm font-bold text-ink tabular-nums select-none"
                      aria-live="polite"
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((q) => Math.min(20, q + 1))}
                      disabled={qty >= 20}
                      aria-label="Increase quantity"
                      className="w-8 h-8 rounded-full bg-bg border border-[rgba(104,90,90,0.18)]
                                 flex items-center justify-center text-ink
                                 disabled:opacity-40 disabled:pointer-events-none
                                 active:scale-[0.92] transition-transform cursor-pointer"
                    >
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="md" className="flex-none px-4" onClick={handleAddAsIs}>
                    Add as-is
                  </Button>
                  <Button variant="primary" size="md" className="flex-1" onClick={handleCustomise}>
                    Customise →
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ─── STEP 2: Customise ─── */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(104,90,90,0.10)] flex-shrink-0">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-text-muted hover:text-ink transition-colors cursor-pointer select-none"
                >
                  <ChevronLeft size={18} strokeWidth={1.75} />
                  <span className="text-sm font-medium">Back</span>
                </button>
                <h2
                  className="text-ink"
                  style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '1.1rem' }}
                >
                  Customise
                </h2>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-bg flex items-center justify-center
                             text-text-muted hover:text-ink active:scale-[0.92] transition-transform cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable with enough bottom padding so CTA never overlaps */}
              <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-6" style={{ paddingBottom: '100px' }}>
                {ingredients.length > 0 && (
                  <div className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted mb-1">
                      Remove ingredients
                    </p>
                    <p className="text-xs text-text-muted/70 mb-3">Tap an ingredient to remove it</p>
                    <div className="flex flex-wrap gap-2">
                      {ingredients.map((ing) => {
                        const included = !removed.has(ing)
                        return (
                          <button
                            key={ing}
                            onClick={() => toggleRemove(ing)}
                            className={`px-4 py-2 rounded-full text-sm border transition-all duration-150 cursor-pointer select-none ${
                              included
                                ? 'bg-ink text-white border-ink font-medium'
                                : 'bg-bg text-text-muted/60 border-[rgba(104,90,90,0.18)] line-through'
                            }`}
                          >
                            {ing}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {addons.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted mb-1">
                      Add extras
                    </p>
                    <p className="text-xs text-text-muted/70 mb-3">Tap to add to your dish</p>
                    <div className="flex flex-wrap gap-2">
                      {addons.map((addon) => {
                        const active = added.has(addon)
                        return (
                          <button
                            key={addon}
                            onClick={() => toggleAdd(addon)}
                            className={`px-4 py-2 rounded-full text-sm border transition-all duration-150 cursor-pointer select-none ${
                              active
                                ? 'bg-ink text-white border-ink font-medium'
                                : 'bg-bg text-text-muted border-[rgba(104,90,90,0.18)]'
                            }`}
                          >
                            {active ? '✓ ' : '+ '}{addon}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="flex-shrink-0 px-5 pt-3 border-t border-[rgba(104,90,90,0.10)] bg-card"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
              >
                <Button variant="primary" size="lg" className="w-full" onClick={() => setStep(3)}>
                  Next →
                </Button>
              </div>
            </>
          )}

          {/* ─── STEP 3: Finishing touches (spice + notes) ─── */}
          {step === 3 && (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(104,90,90,0.10)] flex-shrink-0">
                <button
                  onClick={() => setStep(hasCustomize ? 2 : 1)}
                  className="flex items-center gap-1 text-text-muted hover:text-ink transition-colors cursor-pointer select-none"
                >
                  <ChevronLeft size={18} strokeWidth={1.75} />
                  <span className="text-sm font-medium">Back</span>
                </button>
                <h2
                  className="text-ink"
                  style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '1.1rem' }}
                >
                  Finishing touches
                </h2>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-bg flex items-center justify-center
                             text-text-muted hover:text-ink active:scale-[0.92] transition-transform cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-6" style={{ paddingBottom: '110px' }}>
                {/* Spice level */}
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted mb-1">
                    Spice level
                  </p>
                  <p className="text-xs text-text-muted/70 mb-4">How much heat would you like?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {SPICE_OPTIONS.map((opt) => {
                      const active = spice === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setSpice(opt.value)}
                          className={`rounded-xl py-3 px-2 flex flex-col items-center border-2 transition-all duration-200 cursor-pointer select-none ${
                            active
                              ? 'bg-ink text-white border-ink'
                              : 'bg-bg text-ink border-[rgba(104,90,90,0.15)] hover:border-[rgba(104,90,90,0.4)]'
                          }`}
                        >
                          <HeatBars count={opt.bars} active={active} />
                          <span
                            className={`mt-2 text-[11px] font-semibold leading-none ${active ? 'text-white' : 'text-text-muted'}`}
                            style={{ fontFamily: 'var(--font-wordmark)' }}
                          >
                            {opt.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted mb-1">
                    Add a note
                  </p>
                  <p className="text-xs text-text-muted/70 mb-3">Allergies, preferences, or anything else</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. extra crispy, no onion, allergy to nuts…"
                    rows={3}
                    maxLength={200}
                    className="w-full rounded-xl border border-[rgba(104,90,90,0.18)] bg-bg px-4 py-3
                               text-sm text-ink placeholder:text-text-muted/50 resize-none
                               focus:outline-none focus:border-ink/40 transition-colors"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  />
                </div>
              </div>

              <div
                className="flex-shrink-0 px-5 pt-3 border-t border-[rgba(104,90,90,0.10)] bg-card"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
              >
                <Button variant="primary" size="lg" className="w-full" onClick={handleAddToOrder}>
                  {item.price !== null
                    ? `Add to order · BHD ${totalPrice.toFixed(2)}`
                    : 'Add to order'}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </dialog>
  )
}
