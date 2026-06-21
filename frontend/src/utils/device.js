let cachedIsMobile = null;
export function isMobileDevice() {
  if (typeof window === 'undefined') return false
  // FIX: only cache once the document is interactive/complete.
  // If called during early module evaluation (before DOMContentLoaded), 
  // matchMedia may return stale viewport dimensions on some mobile browsers,
  // causing shouldReduceEffects() to return false on mobile.
  if (cachedIsMobile !== null && document.readyState !== 'loading') return cachedIsMobile;
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