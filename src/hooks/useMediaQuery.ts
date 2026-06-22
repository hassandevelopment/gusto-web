import { useEffect, useState } from 'react'

// Subscribe to a CSS media query and re-render on match changes. Used by the
// kitchen board to pick its active-orders layout (Kanban vs flat card grid)
// — the two are structurally different DOM, so a JS switch beats rendering both.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange() // sync in case the query changed between render and effect
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
