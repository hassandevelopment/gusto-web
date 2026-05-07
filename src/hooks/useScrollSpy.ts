import { useEffect, useRef, useState } from 'react'

/**
 * Tracks which section is currently active based on scroll position.
 * Picks the last section whose top is at or above (scrollY + topOffset).
 * Scroll-event based — reliably handles long sections where IntersectionObserver
 * would stop firing after the section heading scrolls out of its trigger zone.
 */
export function useScrollSpy(ids: string[], topOffset = 120): string {
  const [activeId, setActiveId] = useState(ids[0] ?? '')

  useEffect(() => {
    if (ids.length === 0) return

    function onScroll() {
      const threshold = window.scrollY + topOffset + 8
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top + window.scrollY <= threshold) {
          current = id
        }
      }
      setActiveId(current)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
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
