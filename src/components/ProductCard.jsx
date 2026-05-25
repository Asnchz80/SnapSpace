import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ExternalLink, ShoppingBag, ShoppingCart, Search } from 'lucide-react'

const CATEGORY_COLORS = {
  Furniture:  { bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-400' },
  Lighting:   { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-400'  },
  Textiles:   { bg: 'bg-rose-50',    text: 'text-rose-600',    dot: 'bg-rose-400'   },
  Decor:      { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400'},
  Storage:    { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-400'   },
  Appliances: { bg: 'bg-cyan-50',    text: 'text-cyan-600',    dot: 'bg-cyan-400'   },
}

export default function ProductCard({ product, index }) {
  const cat = CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.Decor
  const [imgFailed, setImgFailed] = useState(false)
  const [menu, setMenu]           = useState(null)   // { x, y } in viewport coords
  const [pressing, setPressing]   = useState(false)
  const timerRef  = useRef(null)
  const cardRef   = useRef(null)

  const searchQuery = product.imageSearchQuery
    ?? `${product.category} ${product.name} interior design`
  const imgSrc = `https://loremflickr.com/320/200/${encodeURIComponent(searchQuery)}?random=${index + 1}`

  const googleShopUrl = `https://www.google.com/search?q=${encodeURIComponent(product.name)}&tbm=shop`
  const googleLensUrl  = `https://lens.google.com/search?url=${encodeURIComponent(imgSrc)}`

  const openMenu = useCallback(() => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = rect.left + rect.width / 2
    // Show below card image; clamp so it doesn't go off-screen bottom
    const y = Math.min(rect.top + 150, window.innerHeight - 220)
    setMenu({ x, y })
    setPressing(false)
    if (navigator.vibrate) navigator.vibrate(40)
  }, [])

  const startPress = useCallback((e) => {
    if (e.target.closest('a')) return          // let normal links through
    setPressing(true)
    timerRef.current = setTimeout(openMenu, 500)
  }, [openMenu])

  const cancelPress = useCallback(() => {
    clearTimeout(timerRef.current)
    setPressing(false)
  }, [])

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, scale: pressing ? 0.96 : 1 }}
        transition={{ delay: index * 0.06, duration: pressing ? 0.12 : 0.35 }}
        className="card card-hover flex flex-col overflow-hidden select-none"
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
        onContextMenu={e => e.preventDefault()}
      >
        {/* Product image */}
        {!imgFailed ? (
          <div className="w-full h-40 bg-[#F0F0F8] overflow-hidden flex-shrink-0">
            <img
              src={imgSrc}
              alt={product.name}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ) : (
          <div className={`w-full h-40 flex items-center justify-center flex-shrink-0 ${cat.bg}`}>
            <ShoppingBag size={28} className={`${cat.text} opacity-50`} />
          </div>
        )}

        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Store + Category */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9B9BB8] font-medium">{product.store}</span>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
              {product.category}
            </span>
          </div>

          {/* Product name */}
          <p className="text-sm font-semibold text-[#0D0D1A] leading-snug">{product.name}</p>

          {/* Reason */}
          {product.reason && (
            <p className="text-xs text-[#6B6B8A] leading-relaxed line-clamp-2">{product.reason}</p>
          )}

          {/* Price + CTA */}
          <div className="mt-auto pt-3 border-t border-black/[0.06] flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#0D0D1A]">{product.priceRange}</span>
            <a
              href={product.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-brand text-white text-xs font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 flex-shrink-0 no-underline"
            >
              Shop
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Hold-to-search hint */}
        <div className="absolute top-2 left-2 text-[9px] text-white/70 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Hold to search
        </div>
      </motion.div>

      {/* Context menu — rendered into document.body via portal */}
      {menu && createPortal(
        <>
          {/* Tap-away backdrop */}
          <div
            className="fixed inset-0 z-50"
            onClick={() => setMenu(null)}
          />

          {/* Menu card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: menu.x,
              top: menu.y,
              transform: 'translateX(-50%)',
              zIndex: 51,
            }}
            className="bg-white rounded-2xl shadow-2xl border border-black/[0.07] p-2 min-w-[230px] max-w-[90vw]"
            onClick={e => e.stopPropagation()}
          >
            {/* Product title */}
            <p className="text-xs font-semibold text-[#0D0D1A] px-2 pt-1 pb-2 border-b border-black/[0.06] truncate">
              {product.name}
            </p>

            {/* Option: shop on original store */}
            <a
              href={product.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(null)}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-violet-50 transition-colors no-underline mt-1"
            >
              <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={15} className="text-violet-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#0D0D1A]">Shop on {product.store}</div>
                <div className="text-[10px] text-[#9B9BB8]">{product.priceRange}</div>
              </div>
            </a>

            {/* Option: Google Shopping */}
            <a
              href={googleShopUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(null)}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-amber-50 transition-colors no-underline"
            >
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={15} className="text-amber-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#0D0D1A]">Google Shopping</div>
                <div className="text-[10px] text-[#9B9BB8]">Compare prices &amp; sellers</div>
              </div>
            </a>

            {/* Option: Google Lens (visual reverse-image search) */}
            <a
              href={googleLensUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenu(null)}
              className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-blue-50 transition-colors no-underline"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search size={15} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#0D0D1A]">Google Lens</div>
                <div className="text-[10px] text-[#9B9BB8]">Visual search with this image</div>
              </div>
            </a>
          </motion.div>
        </>,
        document.body,
      )}
    </>
  )
}
