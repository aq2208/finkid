// finkid-fe/src/components/PageTransition.jsx
import { motion } from 'framer-motion'

const variants = {
  enter: (direction) => ({
    x: direction * 30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction * -30,
    opacity: 0,
  }),
}

/**
 * Wraps a page in a directional slide transition.
 * direction:  1 = slide from right (navigating forward)
 * direction: -1 = slide from left (navigating back)
 * direction:  0 = fade only (auth pages, same tab)
 */
export default function PageTransition({ children, direction = 0 }) {
  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {children}
    </motion.div>
  )
}
