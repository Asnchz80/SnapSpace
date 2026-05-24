import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase.js'
import LoginScreen from './components/LoginScreen.jsx'
import Header from './components/Header.jsx'
import UploadZone from './components/UploadZone.jsx'
import StyleResultCard from './components/StyleResultCard.jsx'
import AreaSelector from './components/AreaSelector.jsx'
import { redesignSpace, redesignArea, chatRedesign } from './services/aiService.js'

// ── Step constants ────────────────────────────────────────────
const STEP = {
  UPLOAD:      'upload',
  PREVIEW:     'preview',
  RESULT:      'result',
  AREA_SELECT: 'area_select',
}

// ── The 5 design styles generated in parallel ─────────────────
const REDESIGN_STYLES = [
  { id: 'Modern',       emoji: '🏙️' },
  { id: 'Scandinavian', emoji: '🌿' },
  { id: 'Mid-Century',  emoji: '🛋️' },
  { id: 'Industrial',   emoji: '⚙️' },
  { id: 'Japandi',      emoji: '🍵' },
]

// ── Fallback demo data ────────────────────────────────────────
const DEMO_RESULT = {
  redesignedImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
  description: 'A clean modern redesign featuring warm oak tones, a statement sofa, and layered lighting to create depth and comfort.',
  products: [
    { name: 'SÖDERHAMN 3-Seat Sofa', category: 'Furniture', priceRange: '$799 – $1,299', store: 'IKEA', searchUrl: 'https://www.ikea.com/us/en/search/?q=soderhamn+sofa', reason: 'Modular low-profile sofa that anchors the seating area.' },
    { name: 'Arc Floor Lamp', category: 'Lighting', priceRange: '$150 – $280', store: 'Wayfair', searchUrl: 'https://www.wayfair.com/lighting/sb1/arc-floor-lamps-c1776474.html', reason: 'Provides warm ambient overhead light without ceiling fixtures.' },
    { name: 'Chunky Knit Throw', category: 'Textiles', priceRange: '$45 – $90', store: 'West Elm', searchUrl: 'https://www.westelm.com/search/results.html?words=chunky+knit+throw', reason: 'Adds texture and warmth to the sofa.' },
    { name: 'Geometric Planter Set', category: 'Decor', priceRange: '$35 – $65', store: 'Amazon', searchUrl: 'https://www.amazon.com/s?k=geometric+planter+set+modern', reason: 'Introduces organic shapes and greenery.' },
    { name: 'Floating Shelf Unit', category: 'Storage', priceRange: '$60 – $120', store: 'IKEA', searchUrl: 'https://www.ikea.com/us/en/search/?q=floating+wall+shelf', reason: 'Keeps the floor clear while providing display space.' },
    { name: 'Woven Area Rug 8×10', category: 'Textiles', priceRange: '$180 – $420', store: 'Pottery Barn', searchUrl: 'https://www.potterybarn.com/shop/rugs/size-8x10-rugs/', reason: 'Defines the seating zone and adds warmth underfoot.' },
  ],
}

export default function App() {
  // ── Auth state ────────────────────────────────────────────
  const [user, setUser]               = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const handleSignOut = async () => {
    await signOut(auth)
    handleReset()
  }

  // ── Design session state ──────────────────────────────────
  const [step, setStep]                       = useState(STEP.UPLOAD)
  const [imageFile, setImageFile]             = useState(null)
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null)
  const [userDescription, setUserDescription] = useState('')
  const [pendingDescription, setPendingDescription] = useState('')

  // styleResults: array of { id, emoji, status: 'loading'|'done'|'error', result, error }
  const [styleResults, setStyleResults] = useState([])
  const [activeIdx, setActiveIdx]       = useState(0)

  // Carousel scroll ref
  const swipeRef                = useRef(null)
  const isProgrammatic          = useRef(false)

  // ── Scroll carousel when activeIdx changes (pill click) ───
  useEffect(() => {
    if (!swipeRef.current) return
    const c = swipeRef.current
    isProgrammatic.current = true
    c.scrollTo({ left: activeIdx * c.clientWidth, behavior: 'smooth' })
    const t = setTimeout(() => { isProgrammatic.current = false }, 700)
    return () => clearTimeout(t)
  }, [activeIdx])

  // ── Auto-advance to first completed result ─────────────────
  useEffect(() => {
    if (step !== STEP.RESULT || styleResults.length === 0) return
    if (styleResults[activeIdx]?.status !== 'loading') return
    const first = styleResults.findIndex(r => r.status !== 'loading')
    if (first !== -1) setActiveIdx(first)
  }, [styleResults, step]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swipe scroll → update active pill ─────────────────────
  const handleSwipeScroll = useCallback(() => {
    if (isProgrammatic.current || !swipeRef.current) return
    const c = swipeRef.current
    const idx = Math.round(c.scrollLeft / c.clientWidth)
    if (idx !== activeIdx) setActiveIdx(idx)
  }, [activeIdx])

  // ── Handle image upload — go to preview to collect optional description ─
  const handleImageSelected = useCallback((file) => {
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setOriginalPreviewUrl(url)
    setPendingDescription('')
    setStep(STEP.PREVIEW)
  }, [])

  // ── Kick off all 5 redesigns from the preview screen ─────────────
  const handleStartRedesign = useCallback((description) => {
    setUserDescription(description)

    const initial = REDESIGN_STYLES.map(s => ({
      ...s,
      status: 'loading',
      result: null,
      error: null,
      chatHistory: [],
      chatLoading: false,
      imageHistory: [],
      historyIdx: -1,
    }))
    setStyleResults(initial)
    setActiveIdx(0)
    setStep(STEP.RESULT)

    // Fire all 5 requests in parallel — results appear as they finish
    REDESIGN_STYLES.forEach((style, i) => {
      redesignSpace(imageFile, style.id, description)
        .then(data => {
          setStyleResults(prev => {
            const next = [...prev]
            const newHistory = [...(next[i].imageHistory ?? []), data.redesignedImageUrl]
            next[i] = { ...next[i], status: 'done', result: data, imageHistory: newHistory, historyIdx: newHistory.length - 1 }
            return next
          })
        })
        .catch(err => {
          console.error(`[SnapSpace] ${style.id} redesign failed:`, err)
          setStyleResults(prev => {
            const next = [...prev]
            const newHistory = [...(next[i].imageHistory ?? []), DEMO_RESULT.redesignedImageUrl]
            next[i] = { ...next[i], status: 'error', result: DEMO_RESULT, error: err.message, imageHistory: newHistory, historyIdx: newHistory.length - 1 }
            return next
          })
        })
    })
  }, [imageFile])

  // ── Chat modification — update one style slot ─────────────
  const handleChat = useCallback(async (styleIdx, message, currentChatHistory) => {
    const styleName = styleResults[styleIdx]?.id ?? 'Modern'

    // Append user message + set loading
    setStyleResults(prev => {
      const next = [...prev]
      next[styleIdx] = {
        ...next[styleIdx],
        chatLoading: true,
        chatHistory: [...currentChatHistory, { role: 'user', content: message }],
      }
      return next
    })

    // Build plain-string history the AI service expects
    const userMessages = currentChatHistory
      .filter(m => m.role === 'user')
      .map(m => m.content)

    try {
      const data = await chatRedesign(imageFile, styleName, userMessages, message)
      setStyleResults(prev => {
        const next = [...prev]
        const slot = next[styleIdx]
        const newHistory = [...(slot.imageHistory ?? []), data.redesignedImageUrl]
        next[styleIdx] = {
          ...slot,
          chatLoading: false,
          status: 'done',
          result: {
            ...slot.result,
            redesignedImageUrl: data.redesignedImageUrl,
            description: data.description,
            products: data.products,
          },
          imageHistory: newHistory,
          historyIdx: newHistory.length - 1,
          chatHistory: [
            ...slot.chatHistory,
            { role: 'assistant', content: data.description },
          ],
        }
        return next
      })
    } catch (err) {
      console.error('Chat redesign error:', err)
      setStyleResults(prev => {
        const next = [...prev]
        next[styleIdx] = {
          ...next[styleIdx],
          chatLoading: false,
          chatHistory: [
            ...next[styleIdx].chatHistory,
            { role: 'assistant', content: `Couldn't apply that change: ${err.message}` },
          ],
        }
        return next
      })
    }
  }, [imageFile, styleResults])

  // ── Area redo — builds on the currently displayed generated image ──
  const handleAreaSubmit = async (maskDataUrl, instruction) => {
    const slot = styleResults[activeIdx]
    const currentStyle = slot?.id ?? 'Modern'
    // Use the currently displayed generated image as the source (not the raw upload)
    const sourceImage =
      (slot?.imageHistory?.length > 0 && slot.historyIdx >= 0)
        ? slot.imageHistory[slot.historyIdx]
        : imageFile

    // Show loading in the active slot and go back to results view
    setStyleResults(prev => {
      const next = [...prev]
      next[activeIdx] = { ...next[activeIdx], status: 'loading', result: null, error: null }
      return next
    })
    setStep(STEP.RESULT)

    try {
      const data = await redesignArea(sourceImage, maskDataUrl, instruction, currentStyle)
      setStyleResults(prev => {
        const next = [...prev]
        const s = next[activeIdx]
        const newHistory = [...(s.imageHistory ?? []), data.redesignedImageUrl]
        next[activeIdx] = { ...s, status: 'done', result: data, imageHistory: newHistory, historyIdx: newHistory.length - 1 }
        return next
      })
    } catch (err) {
      console.error('Area redesign error:', err)
      setStyleResults(prev => {
        const next = [...prev]
        const s = next[activeIdx]
        const newHistory = [...(s.imageHistory ?? []), DEMO_RESULT.redesignedImageUrl]
        next[activeIdx] = { ...s, status: 'error', result: DEMO_RESULT, error: err.message, imageHistory: newHistory, historyIdx: newHistory.length - 1 }
        return next
      })
    }
  }

  // ── History navigation ─────────────────────────────────────
  const handleHistoryNav = useCallback((styleIdx, direction) => {
    setStyleResults(prev => {
      const next = [...prev]
      const s = next[styleIdx]
      const newIdx = Math.max(0, Math.min(s.imageHistory.length - 1, s.historyIdx + direction))
      next[styleIdx] = { ...s, historyIdx: newIdx }
      return next
    })
  }, [])

  // ── Reset to start ─────────────────────────────────────────
  const handleReset = () => {
    if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl)
    setStep(STEP.UPLOAD)
    setImageFile(null)
    setOriginalPreviewUrl(null)
    setStyleResults([])
    setActiveIdx(0)
    setUserDescription('')
    setPendingDescription('')
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

          {/* ── UPLOAD ─────────────────────────────────────── */}
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
                  Upload a photo and instantly see your space redesigned in 5 different styles — with shoppable product links.
                </p>
              </div>
              <UploadZone onImageSelected={handleImageSelected} />
            </motion.section>
          )}

          {/* ── PREVIEW — thumbnail + optional description ── */}
          {step === STEP.PREVIEW && imageFile && (
            <motion.section
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6 pt-10 pb-20 max-w-xl mx-auto w-full px-5"
            >
              {/* Photo thumbnail */}
              <div className="w-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl">
                <img
                  src={originalPreviewUrl}
                  alt="Your space"
                  className="w-full object-cover max-h-72"
                />
              </div>

              {/* Description input */}
              <div className="w-full flex flex-col gap-2">
                <label className="text-xs font-medium text-[#484860] uppercase tracking-widest">
                  Describe what you want&nbsp;<span className="normal-case text-[#2E2E48]">— optional</span>
                </label>
                <textarea
                  value={pendingDescription}
                  onChange={(e) => setPendingDescription(e.target.value)}
                  placeholder={'e.g. "keep the exposed brick wall, add a reading nook by the window, brighter lighting"'}
                  rows={3}
                  className="w-full rounded-xl bg-[#0C0C16] border border-white/[0.08] px-4 py-3 text-sm text-white placeholder-[#484860] resize-none focus:outline-none focus:border-[#7C3AED]/60 transition-colors"
                />
                <p className="text-xs text-[#484860]">
                  The AI will honor your notes across all 5 styles.
                </p>
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-2.5">
                <button
                  onClick={() => handleStartRedesign(pendingDescription)}
                  className="w-full h-12 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Redesign my space →
                </button>
                <button
                  onClick={() => { setStep(STEP.UPLOAD); setImageFile(null); if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl); setOriginalPreviewUrl(null) }}
                  className="w-full h-10 rounded-xl border border-white/[0.08] text-sm text-[#8888A4] hover:text-white hover:border-white/[0.16] transition-colors"
                >
                  ← Change photo
                </button>
              </div>
            </motion.section>
          )}

          {/* ── RESULT — swipeable 5-style carousel ────────── */}
          {step === STEP.RESULT && styleResults.length > 0 && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1"
              style={{ minHeight: 0 }}
            >
              {/* ── Sticky style pills ─────────────────────── */}
              <div className="sticky top-14 z-20 bg-[#07070D]/90 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {styleResults.map((sr, i) => (
                    <button
                      key={sr.id}
                      onClick={() => setActiveIdx(i)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-150 ${
                        i === activeIdx
                          ? 'bg-[#7C3AED] text-white'
                          : 'bg-[#0C0C16] border border-white/[0.08] text-[#8888A4] hover:border-white/[0.18] hover:text-white'
                      }`}
                    >
                      {sr.status === 'loading' && (
                        <span className="w-2.5 h-2.5 border border-current/50 border-t-current rounded-full animate-spin flex-shrink-0" />
                      )}
                      {sr.status === 'done' && (
                        <span className="text-emerald-400 flex-shrink-0 leading-none">✓</span>
                      )}
                      {sr.status === 'error' && (
                        <span className="text-amber-400 flex-shrink-0 leading-none">!</span>
                      )}
                      <span className="text-sm leading-none">{sr.emoji}</span>
                      {sr.id}
                    </button>
                  ))}

                  {/* New photo shortcut */}
                  <button
                    onClick={handleReset}
                    className="ml-auto flex-shrink-0 text-xs text-[#484860] hover:text-[#8888A4] transition-colors pl-2 border-l border-white/[0.08] whitespace-nowrap"
                  >
                    ← New photo
                  </button>
                </div>
              </div>

              {/* ── Swipeable panels ───────────────────────── */}
              <div
                ref={swipeRef}
                onScroll={handleSwipeScroll}
                className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar"
                style={{ minHeight: 0 }}
              >
                {styleResults.map((sr, i) => (
                  <div
                    key={sr.id}
                    className="snap-start flex-shrink-0 w-full h-full overflow-y-auto"
                  >
                    <div className="max-w-4xl mx-auto px-5 pt-8">
                      <StyleResultCard
                        styleResult={sr}
                        originalSrc={originalPreviewUrl}
                        currentImageUrl={sr.imageHistory?.[sr.historyIdx] ?? sr.result?.redesignedImageUrl}
                        onRedoArea={() => { setActiveIdx(i); setStep(STEP.AREA_SELECT) }}
                        onReset={handleReset}
                        onChat={(msg) => handleChat(i, msg, sr.chatHistory ?? [])}
                        onHistoryBack={() => handleHistoryNav(i, -1)}
                        onHistoryForward={() => handleHistoryNav(i, 1)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── AREA SELECT ────────────────────────────────── */}
          {step === STEP.AREA_SELECT && imageFile && (
            <motion.section
              key="area_select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto w-full pt-8 pb-20 px-5"
            >
              <AreaSelector
                imageSrc={styleResults[activeIdx]?.imageHistory?.[styleResults[activeIdx]?.historyIdx]}
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


