/**
 * OrbBackground — ambient background for app interior pages.
 *
 * FIX (mobile freeze + logo blur):
 * The previous fix used useState + useEffect to detect mobile, but this caused
 * a second render AFTER mount. That second render (from useEffect calling setReduce)
 * re-rendered the Layout including the logo SVG mid-animation — causing the logo
 * to appear blurred/scaled at whatever frame ambientPulse was on.
 *
 * Root cause of freeze: ambientPulse uses transform:scale() which forces GPU
 * composite layers. 20+ StarIcons + 3 orb divs firing simultaneously on first
 * paint = GPU overload on mobile. The mobile path strips all of this — but only
 * if isMobileDevice() returns correctly on the VERY FIRST render (not after useEffect).
 *
 * Real fix: read device type synchronously from the URL/userAgent which is available
 * immediately at module eval time, not from matchMedia which can be stale.
 * This means the correct (mobile/desktop) branch renders on the very first paint,
 * no re-render needed, no logo flicker.
 */

// Read UA synchronously — available before DOM is ready, never stale
function isMobileSafe() {
  if (typeof navigator === 'undefined') return false
  // pointer:coarse via matchMedia is ideal but can be stale at module eval time.
  // UA sniffing is reliable synchronously and only used for this initial render.
  const ua = navigator.userAgent || ''
  return /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)
}

const IS_MOBILE = isMobileSafe()

const StarIcon = ({ style, color, size }) => (
  <svg style={{ ...style, width: size, height: size }} viewBox="0 0 512 512" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M256 0C256 0 256 220 512 256C256 292 256 512 256 512C256 512 256 292 0 256C256 220 256 0 256 0Z" />
  </svg>
)

export default function OrbBackground() {
  // No useState, no useEffect — renders correctly on first paint, no re-render
  if (IS_MOBILE) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 overflow-hidden pointer-events-none select-none"
        style={{ zIndex: 0, background: 'var(--bg)' }}
      >
        {/* Two static gradients — no animation, no GPU composite layers */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '90vw', height: '40vh', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(80,160,255,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', left: '-5%',
          width: '60vw', height: '30vh', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)',
        }} />
      </div>
    )
  }

  // Desktop — completely unchanged from original
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 0 }}
    >
      <div style={{
        position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vw', maxWidth: 700, maxHeight: 500,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(80,160,255,0.3) 0%, rgba(50,100,220,0.2) 45%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'ambientPulse 14s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '-10%',
        width: '55vw', height: '55vw', maxWidth: 580, maxHeight: 580,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 65%)',
        filter: 'blur(90px)',
        animation: 'ambientPulse 18s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: '-8%',
        width: '40vw', height: '40vw', maxWidth: 440, maxHeight: 440,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%)',
        filter: 'blur(70px)',
        animation: 'ambientPulse 22s ease-in-out infinite 3s',
      }} />
      <StarIcon size={14} color="rgba(140,200,255,0.8)" style={{ position: 'absolute', top: '10%', left: '15%', animation: 'ambientPulse 4s ease-in-out infinite' }} />
      <StarIcon size={8}  color="rgba(139,92,246,0.9)" style={{ position: 'absolute', top: '25%', right: '20%', animation: 'ambientPulse 3.2s ease-in-out infinite 0.8s' }} />
      <StarIcon size={12} color="rgba(120,190,255,0.7)" style={{ position: 'absolute', top: '60%', left: '45%', animation: 'ambientPulse 6s ease-in-out infinite 1.5s' }} />
      <StarIcon size={6}  color="rgba(99,102,241,0.9)" style={{ position: 'absolute', top: '15%', right: '35%', animation: 'ambientPulse 5s ease-in-out infinite 2s' }} />
      <StarIcon size={16} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', bottom: '20%', left: '25%', animation: 'ambientPulse 7.5s ease-in-out infinite 0.5s' }} />
      <StarIcon size={7}  color="rgba(100,180,255,0.8)" style={{ position: 'absolute', top: '50%', left: '12%', animation: 'ambientPulse 4.5s ease-in-out infinite 1s' }} />
      <StarIcon size={10} color="rgba(139,92,246,0.8)" style={{ position: 'absolute', top: '80%', right: '15%', animation: 'ambientPulse 8s ease-in-out infinite 2.5s' }} />
      <StarIcon size={5}  color="rgba(200,220,255,0.6)" style={{ position: 'absolute', top: '5%', left: '40%', animation: 'ambientPulse 5.5s ease-in-out infinite 1.2s' }} />
      <StarIcon size={9}  color="rgba(255,255,255,0.7)" style={{ position: 'absolute', bottom: '10%', right: '40%', animation: 'ambientPulse 3.8s ease-in-out infinite 0.3s' }} />
      <StarIcon size={11} color="rgba(180,200,255,0.8)" style={{ position: 'absolute', top: '35%', left: '5%', animation: 'ambientPulse 6.2s ease-in-out infinite 2.1s' }} />
      <StarIcon size={6}  color="rgba(160,180,255,0.9)" style={{ position: 'absolute', top: '70%', right: '5%', animation: 'ambientPulse 4.1s ease-in-out infinite 0.7s' }} />
      <StarIcon size={13} color="rgba(220,230,255,0.5)" style={{ position: 'absolute', top: '45%', right: '45%', animation: 'ambientPulse 7.1s ease-in-out infinite 1.8s' }} />
      <StarIcon size={8}  color="rgba(150,150,255,0.7)" style={{ position: 'absolute', bottom: '30%', left: '60%', animation: 'ambientPulse 5.9s ease-in-out infinite 0.9s' }} />
      <StarIcon size={15} color="rgba(139,92,246,0.6)" style={{ position: 'absolute', top: '85%', left: '35%', animation: 'ambientPulse 8.5s ease-in-out infinite 3.0s' }} />
      <StarIcon size={7}  color="rgba(255,255,255,0.8)" style={{ position: 'absolute', top: '22%', left: '75%', animation: 'ambientPulse 3.5s ease-in-out infinite 1.1s' }} />
      <StarIcon size={10} color="rgba(120,190,255,0.9)" style={{ position: 'absolute', bottom: '40%', right: '28%', animation: 'ambientPulse 4.8s ease-in-out infinite 2.4s' }} />
      <StarIcon size={12} color="rgba(140,200,255,0.6)" style={{ position: 'absolute', top: '55%', left: '80%', animation: 'ambientPulse 6.5s ease-in-out infinite 0.6s' }} />
      <StarIcon size={9}  color="rgba(99,102,241,0.8)" style={{ position: 'absolute', bottom: '5%', left: '85%', animation: 'ambientPulse 5.2s ease-in-out infinite 1.7s' }} />
      <StarIcon size={6}  color="rgba(200,220,255,0.7)" style={{ position: 'absolute', top: '18%', left: '55%', animation: 'ambientPulse 4.3s ease-in-out infinite 2.2s' }} />
      <StarIcon size={14} color="rgba(139,92,246,0.5)" style={{ position: 'absolute', bottom: '25%', left: '10%', animation: 'ambientPulse 7.8s ease-in-out infinite 0.4s' }} />
    </div>
  )
}