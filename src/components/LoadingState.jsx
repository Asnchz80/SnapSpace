import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const STEPS = [
  'Analyzing your space…',
  'Generating design concepts…',
  'Placing furniture & lighting…',
  'Finding matching products…',
  'Finishing touches…',
]

export default function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 4000)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95
        return prev + Math.random() * 4
      })
    }, 800)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center gap-8 py-16"
    >
      {/* Animated icon */}
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24 rounded-full border-2 border-transparent"
          style={{
            background:
              'linear-gradient(#07070C, #07070C) padding-box, linear-gradient(135deg, #8B5CF6, #3B82F6) border-box',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={32} className="text-violet-400" />
          </motion.div>
        </div>
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl -z-10" />
      </div>

      {/* Step text */}
      <div className="text-center h-7">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-lg font-500 text-white"
          >
            {STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-72 h-1.5 bg-surface-600 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <p className="text-sm text-gray-500">This usually takes 20–40 seconds</p>
    </motion.div>
  )
}
