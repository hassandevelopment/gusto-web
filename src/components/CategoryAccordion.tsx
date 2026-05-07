import { useState, memo } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Category, MenuItem } from '../types'
import GustoPlaceholder from './ui/GustoPlaceholder'

const ItemPhoto = memo(function ItemPhoto({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false)
  if (!src || err) return <GustoPlaceholder />
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setErr(true)}
    />
  )
})

interface Props {
  category: Category
  items: MenuItem[]
  onTap: (item: MenuItem) => void
  defaultOpen?: boolean
}

export default function CategoryAccordion({ category, items, onTap, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const thumbSrc = items.find((i) => i.image)?.image ?? ''

  return (
    <div className="rounded-2xl overflow-hidden bg-card shadow-card">
      {/* Row header */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-4 transition-colors duration-200 cursor-pointer select-none ${open ? 'bg-ink text-white' : 'bg-card text-ink'}`}
        style={{ minHeight: '68px' }}
      >
        {/* Thumbnail */}
        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-bg">
          <ItemPhoto src={thumbSrc} alt={category.name} />
        </div>

        {/* Name */}
        <span
          className="flex-1 text-left leading-snug"
          style={{
            fontFamily: 'var(--font-italic)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(1.05rem, 4vw, 1.15rem)',
          }}
        >
          {category.name}
        </span>

        {/* Item count */}
        <span
          className={`text-xs font-semibold tabular-nums flex-shrink-0 ${open ? 'text-white/60' : 'text-text-muted'}`}
          style={{ fontFamily: 'var(--font-wordmark)' }}
        >
          {items.length}
        </span>

        {/* Chevron */}
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-white/70' : 'text-text-muted'}`}
        />
      </button>

      {/* Expandable grid */}
      {open && (
        <div className="px-3 pt-3 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => onTap(item)}
                className="stagger-in text-left bg-bg rounded-xl overflow-hidden shadow-card
                           active:scale-[0.97] transition-transform duration-150 cursor-pointer"
                style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
              >
                {/* Photo */}
                <div className="w-full aspect-[4/3] overflow-hidden bg-[#f0ede8]">
                  <ItemPhoto src={item.image} alt={item.name} />
                </div>

                {/* Info */}
                <div className="px-2.5 py-2">
                  <p
                    className="text-ink leading-snug line-clamp-2 mb-1"
                    style={{
                      fontFamily: 'var(--font-italic)',
                      fontStyle: 'italic',
                      fontWeight: 500,
                      fontSize: '13px',
                    }}
                  >
                    {item.name}
                  </p>
                  <p
                    className="text-text-muted tabular-nums"
                    style={{ fontFamily: 'var(--font-wordmark)', fontWeight: 600, fontSize: '12px' }}
                  >
                    {item.price !== null ? `BHD ${item.price.toFixed(2)}` : '—'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
