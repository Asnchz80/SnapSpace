import { motion } from 'framer-motion'
import { PaintbrushIcon, RotateCcw, Ruler, Home, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import ComparisonSlider from './ComparisonSlider.jsx'
import ProductCard from './ProductCard.jsx'
import ChatBar from './ChatBar.jsx'

// ── Loading placeholder ─────────────────────────────────────────
function LoadingPanel({ style, emoji }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 px-5">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AED] animate-spin" style={{ animationDuration: '1.1s' }} />
        <span className="absolute inset-0 flex items-center justify-center text-xl">{emoji}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Generating {style}…</p>
        <p className="text-xs text-[#484860] mt-1.5 max-w-[18rem] mx-auto leading-relaxed">
          AI is redesigning your space in this style. Usually takes 20–40 s.
        </p>
      </div>
      {/* Shimmer bars */}
      <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
        <div className="h-[clamp(220px,52vw,360px)] rounded-xl bg-white/[0.04] animate-pulse" />
        <div className="h-3 w-3/4 rounded-full bg-white/[0.04] animate-pulse" />
        <div className="h-3 w-1/2 rounded-full bg-white/[0.04] animate-pulse" />
      </div>
    </div>
  )
}

// ── Error state ─────────────────────────────────────────────────
function ErrorPanel({ error }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 px-5">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl">
        !
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Couldn't generate this style</p>
        <p className="text-xs text-[#484860] mt-1.5 max-w-[22rem] mx-auto leading-relaxed">{error}</p>
      </div>
    </div>
  )
}

// ── Room specs pill row ──────────────────────────────────────────
function RoomSpecs({ roomType, estimatedSqFt, roomDimensions, ceilingHeight, floorPlanNotes }) {
  const items = [
    roomType          && { icon: Home,   label: roomType },
    estimatedSqFt     && { icon: Ruler,  label: `~${estimatedSqFt} sq ft` },
    roomDimensions    && { icon: null,   label: roomDimensions },
    ceilingHeight     && { icon: null,   label: `Ceiling: ${ceilingHeight}` },
  ].filter(Boolean)

  if (items.length === 0 && !floorPlanNotes) return null

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Info size={12} className="text-[#A78BFA]" />
        <span className="text-[10px] font-medium text-[#484860] uppercase tracking-widest">Room Analysis</span>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map(({ icon: Icon, label }, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/[0.04] border border-white/[0.07] text-[#8888A4]"
            >
              {Icon && <Icon size={10} className="text-[#7C3AED]" />}
              {label}
            </span>
          ))}
        </div>
      )}
      {floorPlanNotes && (
        <p className="text-xs text-[#484860] leading-relaxed">{floorPlanNotes}</p>
      )}
    </div>
  )
}

// ── Main card ───────────────────────────────────────────────────
export default function StyleResultCard({ styleResult, originalSrc, currentImageUrl, onRedoArea, onReset, onChat, onHistoryBack, onHistoryForward }) {
  const { id: style, emoji, status, result, error, chatHistory = [], chatLoading = false, imageHistory = [], historyIdx = -1 } = styleResult

  if (status === 'loading') return <LoadingPanel style={style} emoji={emoji} />
  if (status === 'error')   return <ErrorPanel error={error} />

  const displayedImage = currentImageUrl ?? result.redesignedImageUrl
  const canGoBack      = historyIdx > 0
  const canGoForward   = historyIdx < imageHistory.length - 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-7"
    >
      {/* Error banner if fallback data is showing */}
      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
          ⚠️ {error} — showing demo result.
        </div>
      )}

      {/* Comparison slider */}
      <ComparisonSlider
        originalSrc={originalSrc}
        redesignedSrc={displayedImage}
        alt={style}
      />

      {/* Image history navigation */}
      {imageHistory.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onHistoryBack}
            disabled={!canGoBack}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-[#0C0C16] border border-white/[0.08] text-[#8888A4] hover:border-white/[0.2] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={13} /> Back
          </button>
          <span className="text-xs text-[#484860] tabular-nums">
            Version {historyIdx + 1} <span className="text-[#2E2E48]">/</span> {imageHistory.length}
          </span>
          <button
            onClick={onHistoryForward}
            disabled={!canGoForward}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-[#0C0C16] border border-white/[0.08] text-[#8888A4] hover:border-white/[0.2] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Forward <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* AI chat bar — sits right below the image */}
      <ChatBar
        chatHistory={chatHistory}
        onSend={onChat}
        isLoading={chatLoading}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5 justify-center">
        <button
          onClick={onRedoArea}
          className="card card-hover flex items-center gap-2 px-5 py-2.5 text-sm text-[#8888A4] hover:text-white transition-colors cursor-pointer"
        >
          <PaintbrushIcon size={14} className="text-[#A78BFA]" />
          Redo a specific area
        </button>
        <button
          onClick={onReset}
          className="card card-hover flex items-center gap-2 px-5 py-2.5 text-sm text-[#8888A4] hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          New photo
        </button>
      </div>

      {/* Room specs */}
      {(result.roomType || result.estimatedSqFt || result.roomDimensions) && (
        <RoomSpecs
          roomType={result.roomType}
          estimatedSqFt={result.estimatedSqFt}
          roomDimensions={result.roomDimensions}
          ceilingHeight={result.ceilingHeight}
          floorPlanNotes={result.floorPlanNotes}
        />
      )}

      {/* Design notes */}
      {result.description && (
        <div className="card p-5">
          <p className="text-xs font-medium text-[#484860] uppercase tracking-widest mb-2.5">
            Design Notes
          </p>
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

      {/* bottom spacer */}
      <div className="pb-6" />
    </motion.div>
  )
}
