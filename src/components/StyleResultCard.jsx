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
        <div className="absolute inset-0 rounded-full border-2 border-black/[0.06]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7C3AED] animate-spin" style={{ animationDuration: '1.1s' }} />
        <span className="absolute inset-0 flex items-center justify-center text-xl">{emoji}</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#0D0D1A]">Generating {style}…</p>
        <p className="text-xs text-[#9B9BB8] mt-1.5 max-w-[18rem] mx-auto leading-relaxed">
          AI is redesigning your space in this style. Usually takes 20–40 s.
        </p>
      </div>
      {/* Shimmer bars */}
      <div className="w-full max-w-sm flex flex-col gap-3 mt-4">
        <div className="h-[clamp(220px,52vw,360px)] rounded-xl bg-black/[0.04] animate-pulse" />
        <div className="h-3 w-3/4 rounded-full bg-black/[0.04] animate-pulse" />
        <div className="h-3 w-1/2 rounded-full bg-black/[0.04] animate-pulse" />
      </div>
    </div>
  )
}

// ── Error state ─────────────────────────────────────────────────
function ErrorPanel({ error }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 px-5">
      <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 text-xl">
        !
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#0D0D1A]">Couldn't generate this style</p>
        <p className="text-xs text-[#9B9BB8] mt-1.5 max-w-[22rem] mx-auto leading-relaxed">{error}</p>
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
        <Info size={12} className="text-[#7C3AED]" />
        <span className="text-[10px] font-medium text-[#9B9BB8] uppercase tracking-widest">Room Analysis</span>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map(({ icon: Icon, label }, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#F0F0F8] border border-black/[0.07] text-[#6B6B8A]"
            >
              {Icon && <Icon size={10} className="text-[#7C3AED]" />}
              {label}
            </span>
          ))}
        </div>
      )}
      {floorPlanNotes && (
        <p className="text-xs text-[#9B9BB8] leading-relaxed">{floorPlanNotes}</p>
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-600">
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-white border border-black/[0.08] text-[#6B6B8A] hover:border-black/[0.16] hover:text-[#0D0D1A] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft size={13} /> Back
          </button>
          <span className="text-xs text-[#9B9BB8] tabular-nums">
            Version {historyIdx + 1} <span className="text-[#BEBEDE]">/</span> {imageHistory.length}
          </span>
          <button
            onClick={onHistoryForward}
            disabled={!canGoForward}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-white border border-black/[0.08] text-[#6B6B8A] hover:border-black/[0.16] hover:text-[#0D0D1A] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
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
          className="card card-hover flex items-center gap-2 px-5 py-2.5 text-sm text-[#6B6B8A] hover:text-[#0D0D1A] transition-colors cursor-pointer"
        >
          <PaintbrushIcon size={14} className="text-[#7C3AED]" />
          Redo a specific area
        </button>
        <button
          onClick={onReset}
          className="card card-hover flex items-center gap-2 px-5 py-2.5 text-sm text-[#6B6B8A] hover:text-[#0D0D1A] transition-colors cursor-pointer"
        >
          <RotateCcw size={14} className="text-[#9B9BB8]" />
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
          <p className="text-xs font-medium text-[#9B9BB8] uppercase tracking-widest mb-2.5">
            Design Notes
          </p>
          <p className="text-sm text-[#6B6B8A] leading-relaxed">{result.description}</p>
        </div>
      )}

      {/* Products */}
      {result.products?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#0D0D1A]">Shop the Look</h3>
            <span className="text-xs text-[#9B9BB8]">{result.products.length} items</span>
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
