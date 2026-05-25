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
    processFile(e.dataTransfer.files[0])
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
    <div
      className="w-full bg-white rounded-2xl border border-black/[0.10] overflow-hidden"
      style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.08), 0 24px 56px rgba(0,0,0,0.05)' }}
    >
      {/* ── Drop zone ───────────────────────────────── */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        animate={{
          backgroundColor: isDragging ? 'rgba(124,58,237,0.06)' : 'rgba(248,246,255,1)',
        }}
        transition={{ duration: 0.15 }}
        className="relative cursor-pointer flex flex-col items-center gap-5 p-10 sm:p-14 m-3 rounded-xl overflow-hidden"
        style={{
          border: `2px dashed ${isDragging ? 'rgba(124,58,237,0.55)' : 'rgba(124,58,237,0.22)'}`,
          transition: 'border-color 0.15s',
        }}
      >
        {/* Decorative corner dots */}
        <span className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-[#7C3AED]/20" />
        <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-[#7C3AED]/20" />
        <span className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-[#7C3AED]/20" />
        <span className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-[#7C3AED]/20" />

        {/* Icon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isDragging ? 'drop' : 'idle'}
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.82, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: isDragging
                ? 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)'
                : 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
              boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
            }}
          >
            {isDragging
              ? <ImageIcon size={28} className="text-white" />
              : <UploadCloud size={28} className="text-white" />
            }
          </motion.div>
        </AnimatePresence>

        {/* Copy */}
        <div className="text-center">
          <p className="text-lg font-bold text-[#0D0D1A]">
            {isDragging ? 'Drop your photo here' : 'Upload a photo of your space'}
          </p>
          <p className="text-sm text-[#6B6B8A] mt-1.5">
            Drag &amp; drop, or{' '}
            <span className="text-[#7C3AED] font-semibold">click to browse</span>
          </p>
          <span className="inline-block mt-3 text-xs text-[#9B9BB8] bg-[#F0F0F8] border border-black/[0.07] px-3 py-1 rounded-full">
            JPG · PNG · HEIC — up to 20 MB
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => processFile(e.target.files[0])}
        />
      </motion.div>

      {/* ── Divider ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pb-1">
        <div className="flex-1 h-px bg-black/[0.07]" />
        <span className="text-xs font-semibold text-[#9B9BB8] uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-black/[0.07]" />
      </div>

      {/* ── Camera button ────────────────────────────── */}
      <button
        onClick={handleCapture}
        className="w-full flex items-center justify-center gap-2.5 h-14 px-5 mb-3 mx-0 text-sm font-semibold text-[#0D0D1A] hover:text-[#7C3AED] hover:bg-violet-50 transition-colors rounded-b-xl"
      >
        <div className="w-7 h-7 rounded-lg bg-[#F0F0F8] flex items-center justify-center">
          <Camera size={14} className="text-[#7C3AED]" />
        </div>
        Take a photo with camera
      </button>
    </div>
  )
}

