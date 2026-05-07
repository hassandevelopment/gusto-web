import type { Category, MenuItem } from '../types'
import MenuItemCard from './MenuItemCard'

interface Props {
  category: Category
  items: MenuItem[]
  onAdd?: (item: MenuItem) => void
  onTap?: (item: MenuItem) => void
  firstSection?: boolean
  index?: number
}

export default function MenuSection({ category, items, onAdd, onTap, firstSection, index }: Props) {
  return (
    <section id={category.id} className="mb-10 scroll-mt-[112px]">
      {/* Section heading */}
      <div className="flex items-baseline gap-3 mb-4">
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          {/* Index number + accent rule */}
          {index !== undefined && (
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-accent tabular-nums"
                style={{
                  fontFamily: 'var(--font-italic)',
                  fontStyle: 'italic',
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  lineHeight: 1,
                }}
              >
                {String(index).padStart(2, '0')}
              </span>
              <div className="h-px flex-1 bg-accent/20" />
            </div>
          )}
          <h2
            className="text-ink"
            style={{
              fontFamily: 'var(--font-italic)',
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 'clamp(1.5rem, 5.5vw, 1.875rem)',
              letterSpacing: '0.005em',
              lineHeight: 1.1,
            }}
          >
            {category.name}
          </h2>
        </div>
        <span className="text-xs font-semibold text-text-muted tabular-nums flex-shrink-0">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="stagger-in"
            style={{ '--i': Math.min(i, 6) } as React.CSSProperties}
          >
            <MenuItemCard item={item} onAdd={onAdd} onTap={onTap} eager={firstSection && i < 4} />
          </div>
        ))}
      </div>
    </section>
  )
}
