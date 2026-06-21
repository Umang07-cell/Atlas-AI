/**
 * PageTransition
 *
 * FIX: shouldReduceEffects() now returns the correct value synchronously
 * (via UA detection in device.js), so no useState/useEffect needed here.
 * Mobile gets a plain div on the very first render — no Framer Motion
 * AnimatePresence, no layout thrash, no freeze.
 *
 * Desktop: completely unchanged.
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