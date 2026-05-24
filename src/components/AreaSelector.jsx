import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Brush, Eraser, RotateCcw, Wand2 } from 'lucide-react'

export default function AreaSelector({ imageFile, onSubmit, onCancel }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [tool, setTool] = useState('brush')   // 'brush' | 'eraser'
  const [brushSize, setBrushSize] = useState(40)
  const [instruction, setInstruction] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 })

  // Load image and size the canvas
  useEffect(() => {
    const img = new Image()
    img.src = URL.createObjectURL(imageFile)
    img.onload = () => {
      imgRef.current = img
      const maxW = Math.min(img.naturalWidth, 800)
      const scale = maxW / img.naturalWidth
      const w = maxW
      const h = img.naturalHeight * scale
      setImgDims({ w, h })
    }
    return () => URL.revokeObjectURL(img.src)
  }, [imageFile])

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
      className="flex flex-col gap-6"
    >
      <div className="text-center">
        <h3 className="text-lg font-700 text-white">Select the area to redesign</h3>
        <p className="text-sm text-gray-400 mt-1">
          Paint over the area you want changed. The rest stays the same.
        </p>
      </div>

      {/* Canvas layer */}
      <div
        className="relative mx-auto rounded-2xl overflow-hidden ring-1 ring-white/10 cursor-crosshair"
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
      <div className="flex flex-wrap items-center justify-between gap-4 glass rounded-xl p-4">
        {/* Tool toggle */}
        <div className="flex items-center gap-2">
          {[
            { id: 'brush', icon: <Brush size={15} />, label: 'Paint' },
            { id: 'eraser', icon: <Eraser size={15} />, label: 'Erase' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-500 transition-all duration-200 ${
                tool === t.id ? 'btn-brand text-white shadow-lg shadow-violet-500/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-500 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <RotateCcw size={15} />
            Clear
          </button>
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-500">Size</span>
          <input
            type="range"
            min={12}
            max={80}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-violet-500"
          />
          <span className="text-xs text-gray-400 w-8">{brushSize}px</span>
        </div>
      </div>

      {/* Instruction input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-500 text-gray-300">
          What should change in that area? <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g. "Replace with a cozy reading nook with warm lighting"'
          className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-violet-500/50 transition-colors duration-200 w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="flex-1 glass py-3 rounded-xl text-sm font-600 text-gray-300 hover:text-white transition-colors duration-200"
        >
          Cancel
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          className="flex-1 btn-brand text-white py-3 rounded-xl text-sm font-700 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30"
        >
          <Wand2 size={16} />
          Redesign This Area
        </motion.button>
      </div>
    </motion.div>
  )
}
