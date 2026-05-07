import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, MenuItem } from '../types'
import CategoryPill from './ui/CategoryPill'
import { useScrollSpy } from '../hooks/useScrollSpy'

interface Props {
  categories: Category[]
  items: MenuItem[]
  headerHidden: boolean
}

export default function CategoryNav({ categories, items, headerHidden }: Props) {
  const ids = categories.map((c) => c.id)
  const activeId = useScrollSpy(ids)
  const [clickedId, setClickedId] = useState<string | null>(null)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const navRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const displayActiveId = clickedId ?? activeId

  // Pick the first item with a real image from each category as its nav thumbnail
  const catImage = useMemo(() =>
    Object.fromEntries(
      categories.map((cat) => [
        cat.id,
        items.find((i) => i.category === cat.id && i.image)?.image ?? '',
      ])
    ),
  [categories, items])

  useEffect(() => {
    const pill = pillRefs.current.get(displayActiveId)
    if (pill && navRef.current) {
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [displayActiveId])

  function scrollToSection(id: string) {
    setClickedId(id)
    clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => setClickedId(null), 1200)

    const el = document.getElementById(id)
    if (!el) return
    const offset = headerHidden ? 64 : 120
    const top = el.getBoundingClientRect().top + window.scrollY - offset - 8
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div
      className={
        'sticky z-40 bg-bg/95 backdrop-blur-md border-b border-[rgba(104,90,90,0.12)] ' +
        'transition-[top] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
        (headerHidden ? 'top-0' : 'top-14')
      }
    >
      <div
        ref={navRef}
        className="flex gap-2 overflow-x-auto px-4 py-3"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        role="navigation"
        aria-label="Menu categories"
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => {
              if (el) pillRefs.current.set(cat.id, el)
              else pillRefs.current.delete(cat.id)
            }}
            className="flex-shrink-0"
          >
            <CategoryPill
              label={cat.name}
              image={catImage[cat.id]}
              active={displayActiveId === cat.id}
              onClick={() => scrollToSection(cat.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
