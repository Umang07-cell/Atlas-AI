/** Detect touch-first / narrow viewports where heavy effects cause jank. */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  )
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Use simplified UI / fewer animations on mobile or when user prefers reduced motion. */
export function shouldReduceEffects() {
  return isMobileDevice() || prefersReducedMotion()
}
