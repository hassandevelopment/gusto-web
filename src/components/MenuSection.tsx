import type { Category, MenuItem } from '../types'
import MenuItemCard from './MenuItemCard'

interface Props {
  category: Category
  items: MenuItem[]
  onAdd?: (item: MenuItem) => void
  onTap?: (item: MenuItem) => void
  firstSection?: boolean
}

export default function MenuSection({ category, items, onAdd, onTap, firstSection }: Props) {
  return (
    <section
      id={category.id}
      className="scroll-mt-[120px]"
      style={{ marginBottom: '5rem', paddingTop: firstSection ? 0 : '3rem' }}
    >
      {/* Thin rule + heading — makes every new section clearly distinct */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-[rgba(104,90,90,0.15)]" />
        <h2
          className="text-ink flex-shrink-0"
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
        <div className="h-px flex-1 bg-[rgba(104,90,90,0.15)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
