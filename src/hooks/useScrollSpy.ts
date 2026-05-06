import { useEffect, useRef, useState } from 'react'

/**
 * Tracks which section ID is currently in view.
 * Uses IntersectionObserver with a top-biased rootMargin so the topmost
 * visible section wins — matches how category navs feel in food apps.
 */
export function useScrollSpy(ids: string[], topOffset = 112): string {
  const [activeId, setActiveId] = useState(ids[0] ?? '')
  const observer = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (ids.length === 0) return

    observer.current?.disconnect()

    observer.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        // Top region = header (56px) + category nav (56px) = 112px
        rootMargin: `-${topOffset}px 0px -55% 0px`,
        threshold: 0,
      },
    )

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.current?.observe(el)
    })

    return () => observer.current?.disconnect()
  }, [ids, topOffset])

  return activeId
}

/**
 * Returns { scrolledDown: boolean } — true while user is scrolling down
 * past a threshold. Used to hide/show the header.
 */
export function useScrollDirection(threshold = 80) {
  const [scrolledDown, setScrolledDown] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      if (y < threshold) {
        setScrolledDown(false)
      } else {
        setScrolledDown(y > lastY.current)
      }
      lastY.current = y
    }

    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [threshold])

  return scrolledDown
}
