import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  Wand2, RotateCcw, PaintbrushIcon,
} from 'lucide-react'
import { auth } from './firebase.js'
import LoginScreen from './components/LoginScreen.jsx'

import Header from './components/Header.jsx'
import UploadZone from './components/UploadZone.jsx'
import StyleSelector from './components/StyleSelector.jsx'
import LoadingState from './components/LoadingState.jsx'
import ComparisonSlider from './components/ComparisonSlider.jsx'
import ProductCard from './components/ProductCard.jsx'
import AreaSelector from './components/AreaSelector.jsx'
import { redesignSpace, redesignArea } from './services/aiService.js'

// ── Step constants ────────────────────────────────────────────
const STEP = {
  UPLOAD:      'upload',
  STYLE:       'style',
  PROCESSING:  'processing',
  RESULT:      'result',
  AREA_SELECT: 'area_select',
}

// ── Fallback demo data (shown when the AI call fails or is not configured) ──
const DEMO_RESULT = {
  redesignedImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
  description: 'A clean modern redesign featuring warm oak tones, a statement sofa, and layered lighting to create depth and comfort.',
  products: [
    {
      name: 'SÖDERHAMN 3-Seat Sofa',
      category: 'Furniture',
      priceRange: '$799 – $1,299',
      store: 'IKEA',
      searchUrl: 'https://www.ikea.com/us/en/search/?q=soderhamn+sofa',
      reason: 'Modular low-profile sofa that anchors the seating area.',
    },
    {
      name: 'Arc Floor Lamp',
      category: 'Lighting',
      priceRange: '$150 – $280',
      store: 'Wayfair',
      searchUrl: 'https://www.wayfair.com/lighting/sb1/arc-floor-lamps-c1776474.html',
      reason: 'Provides warm ambient overhead light without ceiling fixtures.',
    },
    {
      name: 'Chunky Knit Throw',
      category: 'Textiles',
      priceRange: '$45 – $90',
      store: 'West Elm',
      searchUrl: 'https://www.westelm.com/search/results.html?words=chunky+knit+throw',
      reason: 'Adds texture and warmth to the sofa without overwhelming the palette.',
    },
    {
      name: 'Geometric Planter Set',
      category: 'Decor',
      priceRange: '$35 – $65',
      store: 'Amazon',
      searchUrl: 'https://www.amazon.com/s?k=geometric+planter+set+modern',
      reason: 'Introduces organic shapes and a touch of greenery to the space.',
    },
    {
      name: 'Floating Shelf Unit',
      category: 'Storage',
      priceRange: '$60 – $120',
      store: 'IKEA',
      searchUrl: 'https://www.ikea.com/us/en/search/?q=floating+wall+shelf',
      reason: 'Keeps the floor clear while providing display and storage space.',
    },
    {
      name: 'Woven Area Rug 8×10',
      category: 'Textiles',
      priceRange: '$180 – $420',
      store: 'Pottery Barn',
      searchUrl: 'https://www.potterybarn.com/shop/rugs/size-8x10-rugs/',
      reason: 'Defines the seating zone and adds warmth underfoot.',
    },
  ],
}

export default function App() {
  // ── Auth state ────────────────────────────────────────────
  const [user, setUser]             = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const handleSignOut = async () => {
    await signOut(auth)
    handleReset()
  }

  // ── Design session state ──────────────────────────────────
  const [step, setStep] = useState(STEP.UPLOAD)
  const [imageFile, setImageFile] = useState(null)
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('Modern')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // ── Handle image selection ─────────────────────────────────
  const handleImageSelected = useCallback((file) => {
    setImageFile(file)
    setOriginalPreviewUrl(URL.createObjectURL(file))
    setStep(STEP.STYLE)
  }, [])

  // ── Trigger AI redesign ────────────────────────────────────
  const handleRedesign = async () => {
    setError(null)
    setStep(STEP.PROCESSING)
    try {
      const data = await redesignSpace(imageFile, selectedStyle)
      setResult(data)
    } catch (err) {
      console.error('Redesign error:', err)
      // Fall back to demo data so the UI is still usable
      setResult(DEMO_RESULT)
      setError(`AI service unavailable — showing a demo result. Make sure VITE_GEMINI_API_KEY is set in .env.local and the Gemini API is enabled on your project. (${err.message})`)
    }
    setStep(STEP.RESULT)
  }

  // ── Trigger area re-do ─────────────────────────────────────
  const handleAreaSubmit = async (maskDataUrl, instruction) => {
    setStep(STEP.PROCESSING)
    try {
      const data = await redesignArea(imageFile, maskDataUrl, instruction, selectedStyle)
      setResult(data)
    } catch (err) {
      console.error('Area redesign error:', err)
      setResult(DEMO_RESULT)
      setError(`AI service unavailable — showing a demo result. (${err.message})`)
    }
    setStep(STEP.RESULT)
  }

  // ── Reset to start ─────────────────────────────────────────
  const handleReset = () => {
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl)
    setStep(STEP.UPLOAD)
    setImageFile(null)
    setOriginalPreviewUrl(null)
    setResult(null)
    setError(null)
    setSelectedStyle('Modern')
  }

  // ── Auth guards ───────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#07070D]">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AED] animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Subtle top radial glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-violet-950/15 to-transparent" />
      </div>

      <Header user={user} onSignOut={handleSignOut} />

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── UPLOAD step ──────────────────────────────── */}
          {step === STEP.UPLOAD && (
            <motion.section
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-10 pt-10 pb-20 max-w-2xl mx-auto w-full px-5"
            >
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl md:text-[3rem] font-bold text-white leading-[1.1] tracking-[-0.03em]">
                  Transform any room<br />with AI
                </h1>
                <p className="mt-4 text-[15px] text-[#8888A4] leading-relaxed max-w-sm mx-auto">
                  Upload a photo of your space. Get a photorealistic redesign with shoppable product links — in under a minute.
                </p>
              </div>

              <UploadZone onImageSelected={handleImageSelected} />
            </motion.section>
          )}

          {/* ── STYLE step ───────────────────────────────── */}
          {step === STEP.STYLE && (
            <motion.section
              key="style"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-7 pt-10 pb-20 max-w-2xl mx-auto w-full px-5"
            >
              {/* Photo preview */}
              <div className="w-full rounded-2xl overflow-hidden border border-white/[0.08]">
                <img
                  src={originalPreviewUrl}
                  alt="Your space"
                  className="w-full max-h-64 object-cover"
                />
              </div>

              <StyleSelector selected={selectedStyle} onSelect={setSelectedStyle} />

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleRedesign}
                className="btn-brand text-white font-semibold text-sm px-8 py-3 rounded-xl flex items-center gap-2 w-full max-w-xs justify-center"
              >
                <Wand2 size={16} />
                Redesign My Space
              </motion.button>

              <button
                onClick={handleReset}
                className="text-sm text-[#484860] hover:text-[#8888A4] transition-colors"
              >
                ← Different photo
              </button>
            </motion.section>
          )}

          {/* ── PROCESSING step ─────────────────────────────────────────── */}
          {step === STEP.PROCESSING && (
            <motion.section
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto w-full px-5"
            >
              <LoadingState />
            </motion.section>
          )}

          {/* ── RESULT step ───────────────────────────────── */}
          {step === STEP.RESULT && result && (
            <motion.section
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-8 pt-8 pb-20 max-w-4xl mx-auto w-full px-5"
            >
              {/* Error banner */}
              {error && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
                  ⚠️ {error}
                </div>
              )}

              {/* Comparison */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Your Redesign</h2>
                  <span className="text-xs font-medium text-[#A78BFA] bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-3 py-1 rounded-full">
                    {selectedStyle}
                  </span>
                </div>
                <ComparisonSlider
                  originalSrc={originalPreviewUrl}
                  redesignedSrc={result.redesignedImageUrl}
                />
              </div>

              {/* Design notes */}
              {result.description && (
                <div className="card p-5">
                  <p className="text-xs font-medium text-[#484860] uppercase tracking-widest mb-2.5">Design Notes</p>
                  <p className="text-sm text-[#8888A4] leading-relaxed">{result.description}</p>
                </div>
              )}

              {/* Products */}
              {result.products?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-white">Shop the Look</h3>
                    <span className="text-xs text-[#484860]">{result.products.length} items</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.products.map((product, i) => (
                      <ProductCard key={`${product.name}-${i}`} product={product} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2.5 justify-center pt-2 pb-8">
                <button
                  onClick={() => setStep(STEP.AREA_SELECT)}
                  className="card card-hover flex items-center gap-2 px-5 py-2.5 text-sm text-[#8888A4] hover:text-white transition-colors cursor-pointer"
                >
                  <PaintbrushIcon size={14} className="text-[#A78BFA]" />
                  Redo a specific area
                </button>
                <button
                  onClick={handleReset}
                  className="card card-hover flex items-center gap-2 px-5 py-2.5 text-sm text-[#8888A4] hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Try a different space
                </button>
              </div>
            </motion.section>
          )}

          {/* ── AREA SELECT step ─────────────────────────── */}
          {step === STEP.AREA_SELECT && imageFile && (
            <motion.section
              key="area_select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto w-full pt-8 pb-20 px-5"
            >
              <AreaSelector
                imageFile={imageFile}
                onSubmit={handleAreaSubmit}
                onCancel={() => setStep(STEP.RESULT)}
              />
            </motion.section>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
