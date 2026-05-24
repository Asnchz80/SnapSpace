import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  'Analyzing your space…',
  'Generating design concepts…',
  'Placing furniture & lighting…',
  'Finding matching products…',
  'Finishing touches…',
]

export default function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress]   = useState(0)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((p) => (p < STEPS.length - 1 ? p + 1 : p))
    }, 4000)
    const progressInterval = setInterval(() => {
      setProgress((p) => (p >= 95 ? 95 : p + Math.random() * 3.5))
    }, 800)
    return () => { clearInterval(stepInterval); clearInterval(progressInterval) }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-8 py-20"
    >
      {/* Spinner */}
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AED]"
        />
      </div>

      {/* Step text */}
      <div className="h-6 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-white"
          >
            {STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-56 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#7C3AED] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <p className="text-xs text-[#484860]">Usually 20–40 seconds</p>
    </motion.div>
  )
}
