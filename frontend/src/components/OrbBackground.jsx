import { useEffect, useRef } from 'react'

/**
 * OrbBackground — extracted from Atlas V1 and rebuilt for V2.
 * Pure CSS + SVG: no canvas, no WebGL, GPU-accelerated transforms only.
 * Fully lightweight, 60fps, mobile-friendly.
 */
export default function OrbBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{ zIndex: 0 }}
    >
      {/* ── Layer 1: Deep ambient glow ─────────────────────────────── */}
      <div
        className="absolute top-1/2 left-1/2 rounded-full"
        style={{
          width: '85vw', height: '85vw',
          maxWidth: 900, maxHeight: 900,
          transform: 'translate(-50%, -48%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)',
          filter: 'blur(120px)',
          animation: 'ambientPulse 12s ease-in-out infinite',
          willChange: 'opacity, transform',
        }}
      />
      {/* Mid-radius soft glow */}
      <div
        className="absolute top-1/2 left-1/2 rounded-full"
        style={{
          width: '55vw', height: '55vw',
          maxWidth: 640, maxHeight: 640,
          transform: 'translate(-50%, -48%)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'ambientPulse 16s ease-in-out infinite reverse',
          willChange: 'opacity',
        }}
      />

      {/* ── Layer 2: Orbital ring SVG (V1 design) ─────────────────── */}
      <svg
        className="absolute top-1/2 left-1/2"
        style={{
          width: '75vw', height: '75vw',
          maxWidth: 800, maxHeight: 800,
          transform: 'translate(-50%, -48%)',
          opacity: 0.22,
        }}
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="orbit-g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%"  stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbit-g2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%"  stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Primary outer ellipse — dashed, static */}
        <ellipse cx="400" cy="400" rx="380" ry="175"
          stroke="url(#orbit-g1)" strokeWidth="1.2"
          strokeDasharray="5 7"
          transform="rotate(-22 400 400)" />
        {/* Outer ellipse — solid faint */}
        <ellipse cx="400" cy="400" rx="380" ry="175"
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"
          transform="rotate(-22 400 400)"
          style={{ animation: 'orbSpin 90s linear infinite', transformOrigin: '400px 400px' }} />
        {/* Inner circle ring */}
        <ellipse cx="400" cy="400" rx="330" ry="330"
          stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
        {/* Accent indigo ellipse — counter-rotating */}
        <ellipse cx="400" cy="400" rx="260" ry="110"
          stroke="url(#orbit-g2)" strokeWidth="1"
          strokeDasharray="3 9"
          transform="rotate(55 400 400)"
          style={{ animation: 'orbSpinReverse 70s linear infinite', transformOrigin: '400px 400px' }} />
      </svg>

      {/* ── Layer 3: Floating career nodes (V1 design, career-themed) */}


      {/* ── Layer 4: Star/particle dots ───────────────────────────── */}
      <div className="absolute" style={{ top: '18%', left: '20%',  width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', animation: 'ambientPulse 4s ease-in-out infinite' }} />
      <div className="absolute" style={{ top: '42%', right: '18%', width: 2, height: 2, borderRadius: '50%', background: 'rgba(139,92,246,0.6)', animation: 'ambientPulse 3s ease-in-out infinite 0.8s' }} />
      <div className="absolute" style={{ top: '70%', left: '55%',  width: 2, height: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', animation: 'ambientPulse 6s ease-in-out infinite 1.5s' }} />
      <div className="absolute" style={{ top: '15%', right: '35%', width: 2, height: 2, borderRadius: '50%', background: 'rgba(99,102,241,0.5)', animation: 'ambientPulse 5s ease-in-out infinite 2s' }} />
      <div className="absolute" style={{ bottom: '15%', left: '35%', width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', animation: 'ambientPulse 7s ease-in-out infinite 0.5s' }} />
    </div>
  )
}

function FloatingNode({ icon, label, sub, style, duration, delay }) {
  return (
    <div
      className="absolute flex items-center gap-3 px-4 py-2.5 rounded-xl"
      style={{
        background: 'rgba(8,8,12,0.88)',
        border: '1px solid rgba(255,255,255,0.09)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        animation: `nodeBob ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        ...style,
      }}
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-base shrink-0"
        style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
      >
        {icon}
      </div>
      <div>
        <div className="mono-label" style={{ color: '#475569' }}>{label}</div>
        <div className="text-xs font-semibold text-slate-300">{sub}</div>
      </div>
      {/* Ping dot */}
      <span
        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
        style={{ background: 'rgba(99,102,241,0.7)', animation: 'pulse-ring 2s ease-out infinite' }}
      />
    </div>
  )
}
