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
    <img src={src} alt={alt} className="w-full h-full object-cover" loading="eager" onError={() => setErr(true)} />
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

// step 1 = details, 2 = customise (skipped if no options), 3 = spice, 4 = notes
type Step = 1 | 2 | 3 | 4

interface Props {
  item: MenuItem | null
  onClose: () => void
}

export default function ItemCustomizeSheet({ item, onClose }: Props) {
  const { add } = useCart()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const [step, setStep] = useState<Step>(1)
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

  // Total visible steps: 1 (details) + optional 2 (customise) + 3 (spice) + 4 (notes)
  const totalSteps = hasCustomize ? 4 : 3

  // Map step number → visual dot index (1-based)
  function dotIndex(s: Step): number {
    if (!hasCustomize) {
      if (s === 1) return 1
      if (s === 3) return 2
      return 3 // step 4
    }
    return s
  }
  const currentDot = dotIndex(step)

  function toggleRemove(ing: string) {
    setRemoved((prev) => { const n = new Set(prev); n.has(ing) ? n.delete(ing) : n.add(ing); return n })
  }
  function toggleAdd(addon: string) {
    setAdded((prev) => { const n = new Set(prev); n.has(addon) ? n.delete(addon) : n.add(addon); return n })
  }

  function handleAddAsIs() {
    if (!item) return
    add(item.id, qty)
    onClose()
  }

  function handleFinalAdd() {
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

  /* ── Shared header bar ── */
  function SheetHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(104,90,90,0.10)] flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-text-muted hover:text-ink transition-colors cursor-pointer select-none"
        >
          <ChevronLeft size={18} strokeWidth={1.75} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h2 className="text-ink" style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontSize: '1.1rem' }}>
          {title}
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
    )
  }

  /* ── Shared sticky footer ── */
  function SheetFooter({ children }: { children: React.ReactNode }) {
    return (
      <div
        className="flex-shrink-0 px-5 pt-3 border-t border-[rgba(104,90,90,0.10)] bg-card"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        {children}
      </div>
    )
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
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((dot) => (
                <div
                  key={dot}
                  className={`rounded-full transition-all duration-300 ${
                    dot === currentDot
                      ? 'w-5 h-2 bg-ink'
                      : dot < currentDot
                      ? 'w-2 h-2 bg-ink/40'
                      : 'w-2 h-2 bg-[rgba(104,90,90,0.18)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ══ STEP 1 — Item details ══ */}
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
                  style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(1.3rem, 5.5vw, 1.6rem)', lineHeight: 1.2 }}
                >
                  {item.name}
                </h2>
                {item.description && (
                  <p className="text-text-muted text-sm leading-relaxed mb-4">{item.description}</p>
                )}
                <p className="text-ink tabular-nums" style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {item.price !== null ? `BHD ${item.price.toFixed(2)}` : '—'}
                </p>
              </div>

              <SheetFooter>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-text-muted">Quantity</span>
                  <div className="inline-flex items-center gap-3">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                      className="w-8 h-8 rounded-full bg-bg border border-[rgba(104,90,90,0.18)] flex items-center justify-center
                                 text-ink disabled:opacity-40 disabled:pointer-events-none active:scale-[0.92] transition-transform cursor-pointer"
                    >
                      <Minus size={14} strokeWidth={2} />
                    </button>
                    <span className="min-w-[24px] text-center text-sm font-bold text-ink tabular-nums select-none" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((q) => Math.min(20, q + 1))}
                      disabled={qty >= 20}
                      aria-label="Increase quantity"
                      className="w-8 h-8 rounded-full bg-bg border border-[rgba(104,90,90,0.18)] flex items-center justify-center
                                 text-ink disabled:opacity-40 disabled:pointer-events-none active:scale-[0.92] transition-transform cursor-pointer"
                    >
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-none px-4 min-h-[38px]" onClick={handleAddAsIs}>
                    Add as-is
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1 min-h-[38px]" onClick={() => setStep(hasCustomize ? 2 : 3)}>
                    Customise →
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}

          {/* ══ STEP 2 — Customise ══ */}
          {step === 2 && (
            <>
              <SheetHeader title="Customise" onBack={() => setStep(1)} />

              <div className="overflow-y-auto overscroll-contain flex-1 pb-28">

                {/* Remove section — full-width rows with checkmark toggle */}
                {ingredients.length > 0 && (
                  <div>
                    <div className="px-5 pt-5 pb-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
                        Included ingredients
                      </p>
                      <p className="text-[11px] text-text-muted/60 mt-0.5">Tap to remove</p>
                    </div>
                    <ul className="mt-1">
                      {ingredients.map((ing) => {
                        const included = !removed.has(ing)
                        return (
                          <li key={ing}>
                            <button
                              onClick={() => toggleRemove(ing)}
                              className="w-full flex items-center justify-between px-5 py-3.5 text-left
                                transition-colors duration-100 cursor-pointer select-none
                                hover:bg-[rgba(104,90,90,0.03)] active:bg-[rgba(104,90,90,0.06)]"
                            >
                              <span className={`text-sm transition-all duration-150 ${included ? 'text-ink' : 'text-text-muted/50 line-through'}`}>
                                {ing}
                              </span>
                              <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
                                included ? 'bg-ink' : 'border border-[rgba(104,90,90,0.25)]'
                              }`}>
                                {included && (
                                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 3.5l2 2L8 1" />
                                  </svg>
                                )}
                              </span>
                            </button>
                            <div className="h-px mx-5 bg-[rgba(104,90,90,0.06)]" />
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {/* Add extras section — same clean row style */}
                {addons.length > 0 && (
                  <div className={ingredients.length > 0 ? 'mt-5' : ''}>
                    <div className="px-5 pt-4 pb-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
                        Add extras
                      </p>
                      <p className="text-[11px] text-text-muted/60 mt-0.5">Tap to add</p>
                    </div>
                    <ul className="mt-1">
                      {addons.map((addon) => {
                        const active = added.has(addon)
                        return (
                          <li key={addon}>
                            <button
                              onClick={() => toggleAdd(addon)}
                              className="w-full flex items-center justify-between px-5 py-3.5 text-left
                                transition-colors duration-100 cursor-pointer select-none
                                hover:bg-[rgba(104,90,90,0.03)] active:bg-[rgba(104,90,90,0.06)]"
                            >
                              <span className={`text-sm transition-colors duration-150 ${active ? 'text-ink font-medium' : 'text-text-muted'}`}>
                                {addon}
                              </span>
                              <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
                                active ? 'bg-ink' : 'border border-[rgba(104,90,90,0.25)]'
                              }`}>
                                {active ? (
                                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 3.5l2 2L8 1" />
                                  </svg>
                                ) : (
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-[rgba(104,90,90,0.4)]">
                                    <path d="M4 1v6M1 4h6" />
                                  </svg>
                                )}
                              </span>
                            </button>
                            <div className="h-px mx-5 bg-[rgba(104,90,90,0.06)]" />
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>

              <SheetFooter>
                <Button variant="primary" size="lg" className="w-full" onClick={() => setStep(3)}>
                  Next →
                </Button>
              </SheetFooter>
            </>
          )}

          {/* ══ STEP 3 — Spice level ══ */}
          {step === 3 && (
            <>
              <SheetHeader title="Spice level" onBack={() => setStep(hasCustomize ? 2 : 1)} />

              <div className="overflow-y-auto overscroll-contain flex-1 px-5 pb-28">
                <p className="text-text-muted text-sm mt-5 mb-8">How much heat would you like?</p>

                {/* Clean 2×2 card grid — text only, no icons */}
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { value: 0 as const, label: 'No spice',  sub: 'Plain, as it comes' },
                      { value: 1 as const, label: 'Mild',      sub: 'A gentle warmth'     },
                      { value: 2 as const, label: 'Medium',    sub: 'Noticeably spicy'     },
                      { value: 3 as const, label: 'Hot',       sub: 'Bold & fiery'         },
                    ] as const
                  ).map((opt) => {
                    const active = spice === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSpice(opt.value)}
                        className={`rounded-2xl p-4 text-left border-2 transition-all duration-200 cursor-pointer select-none
                          active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/40 ${
                          active
                            ? 'bg-ink text-white border-ink shadow-card'
                            : 'bg-bg text-ink border-[rgba(104,90,90,0.15)] hover:border-[rgba(104,90,90,0.4)] hover:bg-[#f7f4f1]'
                        }`}
                      >
                        <p
                          className="font-semibold text-sm leading-tight mb-1"
                          style={{ fontFamily: 'var(--font-wordmark)' }}
                        >
                          {opt.label}
                        </p>
                        <p className={`text-xs leading-snug ${active ? 'text-white/60' : 'text-text-muted'}`}>
                          {opt.sub}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <SheetFooter>
                <Button variant="primary" size="lg" className="w-full" onClick={() => setStep(4)}>
                  Next →
                </Button>
              </SheetFooter>
            </>
          )}

          {/* ══ STEP 4 — Add a note ══ */}
          {step === 4 && (
            <>
              <SheetHeader title="Add a note" onBack={() => setStep(3)} />

              <div className="overflow-y-auto overscroll-contain flex-1 px-5 pb-28">
                <p className="text-text-muted text-sm mt-5 mb-6">
                  Any special requests, allergies, or preferences?
                </p>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. extra crispy, no onion, allergy to nuts…"
                  rows={5}
                  maxLength={200}
                  autoFocus
                  className="w-full rounded-2xl border border-[rgba(104,90,90,0.18)] bg-bg px-4 py-3.5
                             text-sm text-ink placeholder:text-text-muted/50 resize-none leading-relaxed
                             focus:outline-none focus:border-ink/50 focus:shadow-[0_0_0_3px_rgba(45,40,40,0.07)]
                             transition-[border-color,box-shadow] duration-150"
                  style={{ fontFamily: 'var(--font-sans)' }}
                />
                <p className="text-right text-xs text-text-muted/50 mt-1.5 tabular-nums">
                  {notes.length}/200
                </p>
              </div>

              <SheetFooter>
                <Button variant="primary" size="lg" className="w-full" onClick={handleFinalAdd}>
                  {item.price !== null
                    ? `Add to order · BHD ${totalPrice.toFixed(2)}`
                    : 'Add to order'}
                </Button>
              </SheetFooter>
            </>
          )}
        </>
      )}
    </dialog>
  )
}
