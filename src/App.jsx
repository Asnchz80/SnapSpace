import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  Wand2, RotateCcw, Sparkles, PaintbrushIcon, ChevronRight, ArrowRight,
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
      <div className="min-h-dvh flex items-center justify-center bg-[#07070C]">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <div className="min-h-dvh flex flex-col relative overflow-x-hidden">
      {/* Background glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px]" />
      </div>

      <Header user={user} onSignOut={handleSignOut} />

      <main className="flex-1 flex flex-col px-4 pb-16">
        <AnimatePresence mode="wait">

          {/* ── UPLOAD step ──────────────────────────────── */}
          {step === STEP.UPLOAD && (
            <motion.section
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-10 pt-10 max-w-3xl mx-auto w-full"
            >
              {/* Hero text */}
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                  className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-600 text-violet-300 mb-6"
                >
                  <Sparkles size={12} />
                  AI-powered interior redesign
                </motion.div>

                <h1 className="text-5xl sm:text-6xl font-800 text-white leading-tight tracking-tight">
                  Transform Your<br />
                  <span className="text-gradient">Space Instantly</span>
                </h1>
                <p className="mt-5 text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                  Upload a photo of your room or kitchen. AI redesigns it realistically and finds
                  every product used — so you can actually buy what you see.
                </p>
              </div>

              <UploadZone onImageSelected={handleImageSelected} />

              {/* Social proof */}
              <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm text-gray-500">
                {['Signed in as ' + (user.displayName?.split(' ')[0] ?? 'you'), '20–40 s redesign', 'Real product links'].map((s) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-violet-500" />
                    {s}
                  </span>
                ))}
              </div>
            </motion.section>
          )}

          {/* ── STYLE step ───────────────────────────────── */}
          {step === STEP.STYLE && (
            <motion.section
              key="style"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8 pt-10 max-w-2xl mx-auto w-full"
            >
              {/* Preview thumbnail */}
              <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/40 w-full max-h-60 flex items-center justify-center bg-surface-800">
                <img
                  src={originalPreviewUrl}
                  alt="Your space"
                  className="w-full h-60 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 text-sm font-600 text-white/70">Your space</div>
              </div>

              <StyleSelector selected={selectedStyle} onSelect={setSelectedStyle} />

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRedesign}
                className="btn-brand text-white font-700 text-base px-10 py-4 rounded-2xl flex items-center gap-3 shadow-2xl shadow-violet-500/30 w-full max-w-xs justify-center"
              >
                <Wand2 size={20} />
                Redesign My Space
                <ArrowRight size={18} className="ml-auto opacity-70" />
              </motion.button>

              <button
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors duration-200"
              >
                ← Use a different photo
              </button>
            </motion.section>
          )}

          {/* ── PROCESSING step ───────────────────────────── */}
          {step === STEP.PROCESSING && (
            <motion.section
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-lg mx-auto w-full pt-6"
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
              className="flex flex-col gap-10 pt-8 max-w-4xl mx-auto w-full"
            >
              {/* Error banner */}
              {error && (
                <div className="glass border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-300">
                  ⚠️ {error}
                </div>
              )}

              {/* Comparison slider */}
              <div>
                <h2 className="text-2xl font-700 text-white mb-6">
                  Your Redesign
                  <span className="ml-3 text-sm font-500 text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full">
                    {selectedStyle}
                  </span>
                </h2>
                <ComparisonSlider
                  originalSrc={originalPreviewUrl}
                  redesignedSrc={result.redesignedImageUrl}
                />
              </div>

              {/* Design description */}
              {result.description && (
                <div className="glass rounded-2xl p-5">
                  <p className="text-sm font-600 text-violet-400 uppercase tracking-widest mb-2">Design Notes</p>
                  <p className="text-gray-300 leading-relaxed text-sm">{result.description}</p>
                </div>
              )}

              {/* Product grid */}
              {result.products?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-700 text-white">Shop the Look</h3>
                    <span className="text-sm text-gray-500">{result.products.length} items found</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.products.map((product, i) => (
                      <ProductCard key={`${product.name}-${i}`} product={product} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(STEP.AREA_SELECT)}
                  className="glass hover:bg-white/5 text-white font-600 px-6 py-3 rounded-xl flex items-center gap-2 text-sm transition-all duration-200"
                >
                  <PaintbrushIcon size={16} className="text-violet-400" />
                  Redo a specific area
                  <ChevronRight size={14} className="text-gray-500" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="glass hover:bg-white/5 text-gray-300 hover:text-white font-600 px-6 py-3 rounded-xl flex items-center gap-2 text-sm transition-all duration-200"
                >
                  <RotateCcw size={15} />
                  Try a different space
                </motion.button>
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
              className="max-w-3xl mx-auto w-full pt-8"
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
