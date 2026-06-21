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
  const reduce = shouldReduceEffects()

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
