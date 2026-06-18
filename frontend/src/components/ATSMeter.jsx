import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Arc({ score, size = 140, stroke = 11 }) {
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const pct    = Math.max(0, Math.min(100, score || 0))
  const offset = circ - (pct / 100) * circ
  const color  = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const glow   = pct >= 75 ? 'rgba(16,185,129,0.45)' : pct >= 50 ? 'rgba(245,158,11,0.45)' : 'rgba(239,68,68,0.45)'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
      <defs>
        <filter id="arc-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      {/* Progress */}
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        filter="url(#arc-glow)"
        style={{
          transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease',
        }}
      />
    </svg>
  )
}

function AnimatedNumber({ value, duration = 1.2 }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const from  = 0
    const tick  = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(from + (value - from) * ease))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])
  return <>{display}</>
}

export default function ATSMeter({ originalScore, tailoredScore, loading }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (tailoredScore != null) setDisplayed(tailoredScore)
    else if (originalScore != null) setDisplayed(originalScore)
  }, [originalScore, tailoredScore])

  const delta      = tailoredScore != null && originalScore != null ? tailoredScore - originalScore : null
  const scoreColor = displayed >= 75 ? '#10b981' : displayed >= 50 ? '#f59e0b' : '#ef4444'
  const label      = displayed >= 75 ? 'Strong' : displayed >= 50 ? 'Average' : 'Weak'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative">
        <Arc score={loading ? 0 : displayed} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <span className="text-slate-600 text-sm animate-pulse">—</span>
          ) : (
            <motion.div
              key={displayed}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center"
            >
              <span className="text-3xl font-bold text-white leading-none">
                <AnimatedNumber value={displayed} />
              </span>
              <span className="mono-label mt-0.5">ATS Score</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Status label */}
      <AnimatePresence>
        {!loading && displayed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: `${scoreColor}15`,
                color: scoreColor,
                border: `1px solid ${scoreColor}30`,
              }}
            >
              {label} Match
            </span>

            {/* Before/After */}
            {delta != null && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">
                  Before: <b className="text-slate-300">{originalScore}</b>
                </span>
                <span
                  className="font-bold"
                  style={{ color: delta >= 0 ? '#10b981' : '#ef4444' }}
                >
                  {delta >= 0 ? `+${delta}` : delta} pts
                </span>
                <span className="text-slate-500">
                  After: <b className="text-emerald-400">{tailoredScore}</b>
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
