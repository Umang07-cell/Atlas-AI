let cachedIsMobile = null;
export function isMobileDevice() {
  if (typeof window === 'undefined') return false
  if (cachedIsMobile !== null) return cachedIsMobile;
  cachedIsMobile = (
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  )
  return cachedIsMobile
}

let cachedPrefersReduced = null;
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  if (cachedPrefersReduced !== null) return cachedPrefersReduced;
  cachedPrefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return cachedPrefersReduced
}

/** Use simplified UI / fewer animations on mobile or when user prefers reduced motion. */
export function shouldReduceEffects() {
  return isMobileDevice() || prefersReducedMotion()
}
