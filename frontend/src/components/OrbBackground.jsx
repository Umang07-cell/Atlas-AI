/**
 * OrbBackground — premium ambient background for app interior pages.
 * Lightweight CSS/SVG only. No canvas, no WebGL.
 * Matches the vortex color palette (deep blue/cyan/indigo).
 */
export default function OrbBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 0 }}
    >
      {/* ── Layer 1: Deep ambient glows ───────────────────────────── */}
      {/* Top-center — cold blue bloom (echoes the vortex) */}
      <div style={{
        position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', height: '50vw', maxWidth: 700, maxHeight: 500,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(80,160,255,0.07) 0%, rgba(50,100,220,0.04) 45%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'ambientPulse 14s ease-in-out infinite',
      }} />

      {/* Bottom-left — deep indigo */}
      <div style={{
        position: 'absolute', bottom: '10%', left: '-10%',
        width: '55vw', height: '55vw', maxWidth: 580, maxHeight: 580,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 65%)',
        filter: 'blur(90px)',
        animation: 'ambientPulse 18s ease-in-out infinite reverse',
      }} />

      {/* Top-right — purple accent */}
      <div style={{
        position: 'absolute', top: '20%', right: '-8%',
        width: '40vw', height: '40vw', maxWidth: 440, maxHeight: 440,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.045) 0%, transparent 65%)',
        filter: 'blur(70px)',
        animation: 'ambientPulse 22s ease-in-out infinite 3s',
      }} />

      {/* ── Layer 2: Orbital ring SVG ──────────────────────────────── */}
      <svg
        className="absolute top-1/2 left-1/2"
        style={{
          width: '80vw', height: '80vw',
          maxWidth: 820, maxHeight: 820,
          transform: 'translate(-50%, -52%)',
          opacity: 0.18,
        }}
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="orbit-g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#7eb8ff" stopOpacity="0" />
            <stop offset="40%"  stopColor="#7eb8ff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7eb8ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbit-g2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%"  stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbit-g3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%"  stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer ellipse — dashed gradient, slow spin */}
        <ellipse cx="400" cy="400" rx="375" ry="172"
          stroke="url(#orbit-g1)" strokeWidth="1"
          strokeDasharray="6 8"
          transform="rotate(-20 400 400)"
          style={{ animation: 'orbSpin 100s linear infinite', transformOrigin: '400px 400px' }} />

        {/* Outer solid faint ring */}
        <ellipse cx="400" cy="400" rx="375" ry="172"
          stroke="rgba(120,190,255,0.04)" strokeWidth="0.8"
          transform="rotate(-20 400 400)" />

        {/* Inner circle */}
        <ellipse cx="400" cy="400" rx="320" ry="320"
          stroke="rgba(255,255,255,0.022)" strokeWidth="1" />

        {/* Accent indigo ellipse — counter-rotating */}
        <ellipse cx="400" cy="400" rx="255" ry="108"
          stroke="url(#orbit-g2)" strokeWidth="0.9"
          strokeDasharray="4 10"
          transform="rotate(52 400 400)"
          style={{ animation: 'orbSpinReverse 75s linear infinite', transformOrigin: '400px 400px' }} />

        {/* Small inner ring — purple */}
        <ellipse cx="400" cy="400" rx="180" ry="75"
          stroke="url(#orbit-g3)" strokeWidth="0.7"
          strokeDasharray="3 12"
          transform="rotate(15 400 400)"
          style={{ animation: 'orbSpin 55s linear infinite', transformOrigin: '400px 400px' }} />
      </svg>

      {/* ── Layer 3: Fine particle dots ───────────────────────────── */}
      <div style={{ position: 'absolute', top: '14%', left: '18%',  width: 2.5, height: 2.5, borderRadius: '50%', background: 'rgba(140,200,255,0.35)', animation: 'ambientPulse 4s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '38%', right: '16%', width: 2,   height: 2,   borderRadius: '50%', background: 'rgba(139,92,246,0.55)',  animation: 'ambientPulse 3.2s ease-in-out infinite 0.8s' }} />
      <div style={{ position: 'absolute', top: '66%', left: '52%',  width: 2,   height: 2,   borderRadius: '50%', background: 'rgba(120,190,255,0.28)', animation: 'ambientPulse 6s ease-in-out infinite 1.5s' }} />
      <div style={{ position: 'absolute', top: '12%', right: '32%', width: 1.5, height: 1.5, borderRadius: '50%', background: 'rgba(99,102,241,0.5)',   animation: 'ambientPulse 5s ease-in-out infinite 2s' }} />
      <div style={{ position: 'absolute', bottom: '18%', left: '32%', width: 3, height: 3,  borderRadius: '50%', background: 'rgba(255,255,255,0.12)', animation: 'ambientPulse 7.5s ease-in-out infinite 0.5s' }} />
      <div style={{ position: 'absolute', top: '55%', left: '8%',   width: 1.5, height: 1.5, borderRadius: '50%', background: 'rgba(100,180,255,0.3)',  animation: 'ambientPulse 4.5s ease-in-out infinite 1s' }} />
      <div style={{ position: 'absolute', top: '78%', right: '22%', width: 2,   height: 2,   borderRadius: '50%', background: 'rgba(139,92,246,0.3)',   animation: 'ambientPulse 8s ease-in-out infinite 2.5s' }} />
    </div>
  )
}
