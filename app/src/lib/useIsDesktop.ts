import { useEffect, useState } from 'react'

// Matches the `lg` breakpoint (1024px) used throughout docs/14 for the
// desktop layout pass. CSS handles almost all of the mobile/desktop split
// via `lg:` variants, but a couple of Framer Motion variant objects (which
// animate transform/opacity in JS, not CSS) need to know which side of the
// breakpoint they're on — e.g. MomentCapture slides up from the bottom on
// mobile but scale-fades in from center on desktop. This hook exists only
// for those cases.
const QUERY = '(min-width: 1024px)'

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isDesktop
}
