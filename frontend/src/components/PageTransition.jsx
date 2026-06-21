/**
 * PageTransition
 *
 * Mobile: plain div, no animation — avoids GPU thrash / freeze.
 * Desktop: AnimatePresence mode="popLayout" with fast opacity+y transition.
 *
 * KEY FIX: changed from mode="wait" to mode="popLayout".
 * mode="wait" blocks the incoming page until the exit animation fully
 * completes. If the exit stalls (common with heavy pages + React Router
 * Outlet), the browser freezes. mode="popLayout" lets both pages coexist
 * briefly, so the new page mounts immediately and the old one fades out
 * in the background — no freeze.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { shouldReduceEffects } from '../utils/device'

const variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.18, ease: 'easeIn' } },
}

// Evaluated once — synchronous, correct on first render
const reduce = shouldReduceEffects()

export default function PageTransition({ children }) {
  const location = useLocation()

  // Mobile: skip all animation to avoid GPU freeze
  if (reduce) {
    return (
      <div key={location.pathname} className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {children}
      </div>
    )
  }

  // Desktop: popLayout lets the new page mount immediately
  return (
    <AnimatePresence mode="popLayout" initial={false}>
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