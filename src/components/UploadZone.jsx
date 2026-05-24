import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, Camera, ImageIcon } from 'lucide-react'

export default function UploadZone({ onImageSelected }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    onImageSelected(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = (e) => processFile(e.target.files[0])
    input.click()
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: isDragging ? 'rgba(139,92,246,0.8)' : 'rgba(139,92,246,0.25)',
          backgroundColor: isDragging ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.02)',
        }}
        whileHover={{ borderColor: 'rgba(139,92,246,0.5)', backgroundColor: 'rgba(139,92,246,0.04)' }}
        transition={{ duration: 0.2 }}
        className="relative border-2 border-dashed rounded-2xl p-14 flex flex-col items-center gap-5 cursor-pointer"
        style={{ borderColor: 'rgba(139,92,246,0.25)' }}
      >
        {/* Glow orb */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isDragging ? 'dropping' : 'idle'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-16 h-16 rounded-2xl btn-brand flex items-center justify-center shadow-xl shadow-violet-500/30 animate-float"
          >
            {isDragging
              ? <ImageIcon size={28} className="text-white" />
              : <UploadCloud size={28} className="text-white" />
            }
          </motion.div>
        </AnimatePresence>

        <div className="text-center z-10">
          <p className="text-lg font-600 text-white mb-1">
            {isDragging ? 'Drop to redesign' : 'Upload your space'}
          </p>
          <p className="text-sm text-gray-400">
            Drag &amp; drop a photo, or <span className="text-violet-400 underline">browse files</span>
          </p>
          <p className="text-xs text-gray-600 mt-2">JPG, PNG, HEIC — up to 20 MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => processFile(e.target.files[0])}
        />
      </motion.div>

      {/* Camera button (mobile-friendly) */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={handleCapture}
        className="mt-4 w-full flex items-center justify-center gap-2 glass text-gray-300 hover:text-white py-3 rounded-xl text-sm font-500 transition-colors duration-200 hover:bg-white/5"
      >
        <Camera size={16} />
        Take a photo with your camera
      </motion.button>
    </div>
  )
}
