import { useEffect, useRef } from 'react'
import { isMobileDevice } from '../utils/device'

/**
 * VortexCanvas — draws a detailed galaxy vortex once on mount.
 * Center is positioned above the canvas top so only the bottom arc is visible.
 *
 * FIX (mobile freeze only): on mobile, skip the 3840+ arc draw entirely and
 * render a lightweight gradient version instead. Desktop draw is completely
 * unchanged — same code, same order, same synchronous execution as original.
 */
export default function VortexCanvas({ style = {} }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const parent = canvas.parentElement
    const W = canvas.width  = parent.clientWidth  || window.innerWidth
    const H = canvas.height = parent.clientHeight || window.innerHeight
    const ctx = canvas.getContext('2d')

    const cx = W * 0.5
    const cy = -H * 0.05
    const RA = Math.min(W * 0.55, H * 0.95)
    const RB = RA * 0.28
    const rng = (s) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x) }

    // ── MOBILE: lightweight version — no arm arcs, no heavy loops ──
    if (isMobileDevice()) {
      ctx.fillStyle = '#000008'
      ctx.fillRect(0, 0, W, H)

      for (let i = 0; i < 80; i++) {
        const sx = rng(i * 3.13) * W
        const sy = rng(i * 7.37) * H
        const sr = Math.pow(rng(i * 2.71), 2.5) * 1.0 + 0.1
        const sa = rng(i * 5.17) * 0.5 + 0.08
        ctx.fillStyle = `rgba(180,215,255,${sa})`
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
      }

      const atmo = ctx.createRadialGradient(cx, cy, RA * 0.3, cx, cy, RA * 2.0)
      atmo.addColorStop(0, 'transparent')
      atmo.addColorStop(0.3, 'rgba(30,70,160,0.18)')
      atmo.addColorStop(1, 'transparent')
      ctx.fillStyle = atmo; ctx.fillRect(0, 0, W, H)

      const r = RA * 1.0, rb = r * (RB / RA)
      ctx.strokeStyle = 'rgba(95,180,255,0.22)'; ctx.lineWidth = 5
      ctx.beginPath(); ctx.ellipse(cx, cy, r, rb, 0, 0, Math.PI * 2); ctx.stroke()

      ctx.strokeStyle = 'rgba(205,240,255,0.5)'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.ellipse(cx, cy, RA * 0.987, RA * 0.987 * (RB / RA), 0, 0, Math.PI * 2); ctx.stroke()

      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, RA * 0.56)
      bloom.addColorStop(0,    'rgba(235,250,255,0.9)')
      bloom.addColorStop(0.06, 'rgba(185,232,255,0.6)')
      bloom.addColorStop(0.20, 'rgba(72,152,242,0.1)')
      bloom.addColorStop(1,    'transparent')
      ctx.fillStyle = bloom; ctx.fillRect(0, 0, W, H)

      const void1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, RA * 0.49)
      void1.addColorStop(0,   'rgba(0,0,0,1)')
      void1.addColorStop(0.5, 'rgba(0,0,4,0.97)')
      void1.addColorStop(1,   'transparent')
      ctx.fillStyle = void1
      ctx.beginPath(); ctx.ellipse(cx, cy, RA * 0.53, RA * 0.53 * (RB / RA) * 1.1, 0, 0, Math.PI * 2); ctx.fill()

      return
    }

    // ── DESKTOP: original draw — untouched ──
    ctx.fillStyle = '#000005'
    ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < 300; i++) {
      const sx = rng(i * 3.13) * W
      const sy = rng(i * 7.37) * H
      const sr = Math.pow(rng(i * 2.71), 2.5) * 1.2 + 0.12
      const sa = rng(i * 5.17) * 0.55 + 0.08
      const cold = rng(i * 1.91) > 0.62
      ctx.fillStyle = cold ? `rgba(170,210,255,${sa})` : `rgba(230,235,255,${sa})`
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
    }

    const atmo = ctx.createRadialGradient(cx, cy, RA * 0.5, cx, cy, RA * 2.8)
    atmo.addColorStop(0, 'transparent')
    atmo.addColorStop(0.25, 'rgba(30,70,160,0.13)')
    atmo.addColorStop(0.55, 'rgba(20,50,130,0.07)')
    atmo.addColorStop(1, 'transparent')
    ctx.fillStyle = atmo; ctx.fillRect(0, 0, W, H)

    function armLayer(rScale, count, hue, baseAlpha, lineW, spread) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const r = RA * rScale + (rng(i * 11.3 + rScale * 100) - 0.5) * RA * spread
        const rb = r * (RB / RA)
        const len = 0.025 + rng(i * 4.1) * 0.055
        const depth = Math.sin(angle) * 0.5 + 0.5
        const bright = rng(i * 3.3)
        const alpha = baseAlpha * (0.15 + depth * 0.85) * (0.3 + bright * 0.7)
        const lt = 30 + bright * 45 + depth * 15
        ctx.strokeStyle = `hsla(${hue + bright * 30},${40 + bright * 40}%,${lt}%,${alpha})`
        ctx.lineWidth = lineW * (0.4 + depth * 0.6)
        ctx.beginPath(); ctx.ellipse(cx, cy, r, rb, 0, angle, angle + len); ctx.stroke()
      }
    }

    armLayer(1.28, 900, 210, 0.55, 1.8, 0.18)
    armLayer(1.12, 750, 215, 0.50, 1.5, 0.13)
    armLayer(0.96, 650, 205, 0.48, 1.3, 0.10)
    armLayer(0.83, 550, 200, 0.60, 1.1, 0.08)
    armLayer(0.73, 430, 195, 0.52, 0.9, 0.07)
    armLayer(0.62, 320, 190, 0.68, 0.8, 0.06)
    armLayer(0.52, 240, 185, 0.58, 0.5, 0.04)

    for (let i = 0; i < 130; i++) {
      const angle = Math.PI * 0.7 + (rng(i * 6.1) - 0.5) * Math.PI * 1.5
      const r = RA * (0.55 + rng(i * 3.7) * 0.68)
      const rb = r * (RB / RA)
      const len = 0.014 + rng(i * 2.2) * 0.045
      const bright = rng(i * 8.1)
      if (bright < 0.32) continue
      ctx.strokeStyle = `rgba(185,228,255,${bright * 0.38})`
      ctx.lineWidth = 0.35 + bright * 0.7
      ctx.beginPath(); ctx.ellipse(cx, cy, r, rb, 0, angle, angle + len); ctx.stroke()
    }

    const rings = [
      [1.04, 0.18, 8,   'rgba(75,155,255,'],
      [0.99, 0.22, 5,   'rgba(95,180,255,'],
      [0.94, 0.17, 3.5, 'rgba(115,198,255,'],
      [0.88, 0.20, 3,   'rgba(135,213,255,'],
      [0.79, 0.19, 2,   'rgba(158,223,255,'],
      [0.69, 0.23, 2,   'rgba(178,233,255,'],
      [0.59, 0.29, 1.5, 'rgba(198,241,255,'],
    ]
    rings.forEach(([rs, a, w, col]) => {
      const r = RA * rs, rb = r * (RB / RA)
      ctx.strokeStyle = col + a + ')'; ctx.lineWidth = w
      ctx.beginPath(); ctx.ellipse(cx, cy, r, rb, 0, 0, Math.PI * 2); ctx.stroke()
    })

    ctx.strokeStyle = 'rgba(205,240,255,0.72)'; ctx.lineWidth = 0.9
    ctx.beginPath(); ctx.ellipse(cx, cy, RA * 0.987, RA * 0.987 * (RB / RA), 0, 0, Math.PI * 2); ctx.stroke()

    ctx.strokeStyle = 'rgba(222,246,255,0.42)'; ctx.lineWidth = 0.45
    ctx.beginPath(); ctx.ellipse(cx, cy, RA * 0.73, RA * 0.73 * (RB / RA), 0, 0, Math.PI * 2); ctx.stroke()

    ctx.strokeStyle = 'rgba(255,80,160,0.055)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.ellipse(cx - 1.5, cy + 1, RA * 0.99, RA * 0.99 * (RB / RA), 0, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(60,255,200,0.055)'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.ellipse(cx + 1.5, cy - 1, RA * 0.977, RA * 0.977 * (RB / RA), 0, 0, Math.PI * 2); ctx.stroke()

    const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, RA * 0.56)
    bloom.addColorStop(0,    'rgba(235,250,255,0.95)')
    bloom.addColorStop(0.04, 'rgba(185,232,255,0.72)')
    bloom.addColorStop(0.12, 'rgba(125,202,255,0.36)')
    bloom.addColorStop(0.30, 'rgba(72,152,242,0.13)')
    bloom.addColorStop(0.60, 'rgba(42,92,202,0.05)')
    bloom.addColorStop(1,    'transparent')
    ctx.fillStyle = bloom; ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2
      const len = RA * (0.38 + rng(i * 9.1) * 0.42)
      const x2 = cx + Math.cos(angle) * len * 1.45
      const y2 = cy + Math.sin(angle) * len * 0.36
      const g = ctx.createLinearGradient(cx, cy, x2, y2)
      g.addColorStop(0, 'rgba(205,240,255,0.14)'); g.addColorStop(0.4, 'rgba(145,212,255,0.05)'); g.addColorStop(1, 'transparent')
      ctx.strokeStyle = g; ctx.lineWidth = 0.8 + rng(i * 4.3) * 2.2
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x2, y2); ctx.stroke()
    }

    const void1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, RA * 0.49)
    void1.addColorStop(0,   'rgba(0,0,0,1)')
    void1.addColorStop(0.5, 'rgba(0,0,4,0.98)')
    void1.addColorStop(0.8, 'rgba(0,2,10,0.76)')
    void1.addColorStop(1,   'transparent')
    ctx.fillStyle = void1
    ctx.beginPath(); ctx.ellipse(cx, cy, RA * 0.53, RA * 0.53 * (RB / RA) * 1.1, 0, 0, Math.PI * 2); ctx.fill()

    for (let i = 0; i < 70; i++) {
      const angle = rng(i * 13.7) * Math.PI * 2
      const r = RA * (1.1 + rng(i * 5.3) * 0.45)
      const rb = r * (RB / RA) * 0.88
      const len = 0.028 + rng(i * 2.9) * 0.08
      ctx.strokeStyle = `rgba(75,135,215,${rng(i * 7.1) * 0.09})`; ctx.lineWidth = 0.35
      ctx.beginPath(); ctx.ellipse(cx, cy, r, rb, 0, angle, angle + len); ctx.stroke()
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block',
        ...style,
      }}
    />
  )
}