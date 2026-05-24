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
    <div className="w-full">
      <motion.div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: isDragging ? 'rgba(124,58,237,0.55)' : 'rgba(255,255,255,0.1)',
          backgroundColor: isDragging ? 'rgba(124,58,237,0.05)' : 'transparent',
        }}
        className="group relative border-2 border-dashed rounded-2xl p-8 sm:p-14 cursor-pointer flex flex-col items-center gap-5"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isDragging ? 'drop' : 'idle'}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-14 h-14 rounded-xl card flex items-center justify-center group-hover:border-[#7C3AED]/40 transition-colors"
          >
            {isDragging
              ? <ImageIcon size={22} className="text-[#A78BFA]" />
              : <UploadCloud size={22} className="text-[#8888A4] group-hover:text-[#A78BFA] transition-colors" />
            }
          </motion.div>
        </AnimatePresence>

        <div className="text-center">
          <p className="text-base font-medium text-[#0D0D1A]">
            {isDragging ? 'Drop to upload' : 'Upload a photo of your space'}
          </p>
          <p className="text-sm text-[#6B6B8A] mt-1">
            Drag &amp; drop, or{' '}
            <span className="text-[#7C3AED] group-hover:text-violet-600 transition-colors">
              click to browse
            </span>
          </p>
          <p className="text-xs text-[#9B9BB8] mt-3">JPG · PNG · HEIC — up to 20 MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => processFile(e.target.files[0])}
        />
      </motion.div>

      <button
        onClick={handleCapture}
        className="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-black/[0.08] text-sm text-[#6B6B8A] hover:text-[#0D0D1A] hover:border-black/[0.14] transition-colors"
      >
        <Camera size={14} />
        Use camera
      </button>
    </div>
  )
}
