/**
 * device.js
 *
 * FIX: matchMedia('pointer:coarse') can return stale/false on mobile when called
 * at module evaluation time (before DOM is interactive). This caused shouldReduceEffects()
 * to return false on first render → full desktop GPU-heavy rendering → freeze.
 *
 * Solution: use UA sniffing for the synchronous initial value (available before DOM),
 * then confirm with matchMedia after the document is ready. UA sniffing is only used
 * for this one-time initial detection — it's reliable for mobile/desktop distinction.
 */

function detectMobile() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // UA is always available synchronously, never stale
  if (/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)) return true
  // Fallback: matchMedia (reliable once DOM is ready)
  if (typeof window !== 'undefined') {
    return window.matchMedia('(pointer: coarse)').matches ||
           window.matchMedia('(max-width: 768px)').matches
  }
  return false
}

// Evaluated once at module load — synchronous, no stale results
export const IS_MOBILE = detectMobile()

export function isMobileDevice() {
  return IS_MOBILE
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function shouldReduceEffects() {
  return IS_MOBILE || prefersReducedMotion()
}