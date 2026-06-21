/**
 * PageTransition — wraps page content with a fade+slide animation.
 *
 * FIX (mobile freeze): same issue as OrbBackground — shouldReduceEffects()
 * was called outside a hook at render time, returning false on mobile first
 * render → Framer Motion AnimatePresence fired → layout thrash → freeze.
 *
 * Fix: useState lazy initialiser reads device type at mount. useEffect
 * confirms after first paint. Desktop path completely unchanged.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { shouldReduceEffects } from '../utils/device'

const variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.18, ease: 'easeIn' } },
}

export default function PageTransition({ children }) {
  const location = useLocation()
  const [reduce, setReduce] = useState(() => shouldReduceEffects())

  useEffect(() => {
    setReduce(shouldReduceEffects())
  }, [])

  if (reduce) {
    return (
      <div key={location.pathname} className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {children}
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 flex flex-col min-h-0 overflow-y-auto"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}