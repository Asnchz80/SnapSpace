import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Brush, Eraser, RotateCcw, Wand2 } from 'lucide-react'

export default function AreaSelector({ imageSrc, imageFile, onSubmit, onCancel }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [tool, setTool] = useState('brush')   // 'brush' | 'eraser'
  const [brushSize, setBrushSize] = useState(40)
  const [instruction, setInstruction] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 })

  // Load image — prefer the generated imageSrc URL, fall back to the raw upload
  useEffect(() => {
    let blobUrl = null
    const src = imageSrc ?? (() => { blobUrl = URL.createObjectURL(imageFile); return blobUrl })()

    const img = new Image()
    img.src = src
    img.onload = () => {
      imgRef.current = img
      const maxW = Math.min(img.naturalWidth, 800)
      const scale = maxW / img.naturalWidth
      const w = maxW
      const h = img.naturalHeight * scale
      setImgDims({ w, h })
    }
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [imageSrc, imageFile])

  useEffect(() => {
    if (!imgDims.w || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = imgDims.w
    canvas.height = imgDims.h
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [imgDims])

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const draw = useCallback((e) => {
    if (!isDrawing || !canvasRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(139,92,246,0.55)'
    ctx.fill()
  }, [isDrawing, tool, brushSize])

  const clearCanvas = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  const handleSubmit = () => {
    if (!canvasRef.current) return
    const maskDataUrl = canvasRef.current.toDataURL('image/png')
    onSubmit(maskDataUrl, instruction)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-5"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#0D0D1A]">Select the area to redesign</h3>
        <p className="text-sm text-[#6B6B8A] mt-1">
          Paint over the area you want changed. The rest stays the same.
        </p>
      </div>

      {/* Canvas layer */}
      <div
        className="relative mx-auto rounded-xl overflow-hidden border border-white/[0.08] cursor-crosshair"
        style={{ width: '100%', maxWidth: imgDims.w || 800 }}
      >
        {/* Original image */}
        {imgDims.w > 0 && imgRef.current && (
          <img
            src={imgRef.current.src}
            alt="Original space"
            style={{ width: '100%', display: 'block' }}
          />
        )}

        {/* Paint canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={(e) => { setIsDrawing(true); draw(e) }}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onTouchStart={(e) => { setIsDrawing(true); draw(e) }}
          onTouchMove={draw}
          onTouchEnd={() => setIsDrawing(false)}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Toolbar */}
      <div className="card rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        {/* Tool toggle + clear */}
        <div className="flex items-center gap-2">
          {[
            { id: 'brush', icon: <Brush size={14} />, label: 'Paint' },
            { id: 'eraser', icon: <Eraser size={14} />, label: 'Erase' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tool === t.id
                  ? 'btn-brand text-white'
                  : 'text-[#8888A4] hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#6B6B8A] hover:text-[#0D0D1A] hover:bg-black/[0.05] transition-colors"
          >
            <RotateCcw size={14} />
            Clear
          </button>
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9B9BB8]">Size</span>
          <input
            type="range"
            min={12}
            max={80}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-28 accent-violet-500"
          />
          <span className="text-xs text-[#6B6B8A] w-8">{brushSize}px</span>
        </div>
      </div>

      {/* Instruction input */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#6B6B8A]">
          What should change in that area? <span className="text-[#9B9BB8]">(optional)</span>
        </label>
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g. "Replace with a cozy reading nook with warm lighting"'
          className="card rounded-xl px-4 py-3 text-sm text-[#0D0D1A] placeholder:text-[#9B9BB8] outline-none border border-black/[0.08] focus:border-[#7C3AED]/50 transition-colors w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 card card-hover py-3 rounded-xl text-sm font-medium text-[#6B6B8A] hover:text-[#0D0D1A] transition-colors"
        >
          Cancel
        </button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="flex-1 btn-brand text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Wand2 size={16} />
          Redesign This Area
        </motion.button>
      </div>
    </motion.div>
  )
}
