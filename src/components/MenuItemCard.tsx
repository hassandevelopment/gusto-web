import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { MenuItem } from '../types'
import Button from './ui/Button'

interface Props {
  item: MenuItem
  onAdd?: (item: MenuItem) => void
  onTap?: (item: MenuItem) => void
  eager?: boolean
}

const TAG_LABELS: Record<string, string> = {
  vegetarian: 'Veg',
  vegan: 'Vegan',
  seafood: 'Seafood',
  spicy: 'Spicy',
  'gluten-free': 'GF',
  'contains-nuts': 'Nuts',
}

function ItemImage({ src, alt, eager }: { src: string; alt: string; eager?: boolean }) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div className="w-full h-full skeleton" aria-hidden="true" />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding={eager ? 'sync' : 'async'}
      width={600}
      height={338}
      className="w-full h-full object-cover"
      onError={() => setErrored(true)}
    />
  )
}

export default function MenuItemCard({ item, onAdd, onTap, eager }: Props) {
  const price = item.price !== null ? `BHD ${item.price.toFixed(2)}` : 'Price TBD'
  const altText = `${item.name} — ${item.description ?? 'menu item'}`

  return (
    <article
      className="flex flex-col bg-card rounded-[12px] border border-[rgba(104,90,90,0.12)]
                 shadow-card overflow-hidden cursor-pointer
                 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                 hover:-translate-y-px hover:shadow-card-hover active:scale-[0.99]"
      onClick={() => onTap?.(item)}
    >
      {/* Full-width photo */}
      <div className="w-full aspect-[2/1] bg-bg flex-shrink-0">
        <ItemImage src={item.image} alt={altText} eager={eager} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3">
        <p
          className="text-ink leading-tight line-clamp-1"
          style={{
            fontFamily: 'var(--font-italic)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: '1.05rem',
            letterSpacing: '0.005em',
          }}
        >
          {item.name}
        </p>

        {item.description && (
          <p className="text-sm text-text-muted leading-snug line-clamp-2">
            {item.description}
          </p>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                           bg-success/10 text-success"
              >
                {TAG_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <p className="text-base font-bold text-text tabular-nums">{price}</p>
          <Button
            variant="add"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onAdd?.(item)
            }}
            aria-label={`Add ${item.name} to order`}
          >
            <Plus size={11} strokeWidth={2.5} />
            Add
          </Button>
        </div>
      </div>
    </article>
  )
}
