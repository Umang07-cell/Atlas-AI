/**
 * device.js — mobile detection and reduced-effects helpers.
 *
 * FIX: isMobileDevice() was being called at module evaluation time
 * (component top-level, outside useEffect) — before the browser had
 * finished rendering. On mobile, matchMedia can return stale results
 * this early, so shouldReduceEffects() returned false → full desktop
 * rendering fired → page froze on every first load.
 *
 * Fix: never cache on the first call if document is still loading.
 * Re-evaluate until readyState is interactive/complete, then lock in.
 */

let cachedIsMobile = null
export function isMobileDevice() {
  if (typeof window === 'undefined') return false
  // Only lock in the cache once the DOM is fully ready
  if (cachedIsMobile !== null && document.readyState !== 'loading') {
    return cachedIsMobile
  }
  cachedIsMobile = (
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  )
  return cachedIsMobile
}

let cachedPrefersReduced = null
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  if (cachedPrefersReduced !== null) return cachedPrefersReduced
  cachedPrefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return cachedPrefersReduced
}

/** Use simplified UI / fewer animations on mobile or when user prefers reduced motion. */
export function shouldReduceEffects() {
  return isMobileDevice() || prefersReducedMotion()
}