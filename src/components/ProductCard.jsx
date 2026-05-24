import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, ShoppingBag } from 'lucide-react'

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

  const searchQuery = product.imageSearchQuery
    ?? `${product.category} ${product.name} interior design`
  const imgSrc = `https://loremflickr.com/320/200/${encodeURIComponent(searchQuery)}?random=${index + 1}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="card card-hover flex flex-col overflow-hidden transition-all"
    >
      {/* Product image */}
      {!imgFailed ? (
        <div className="w-full h-40 bg-[#F0F0F8] overflow-hidden flex-shrink-0">
          <img
            src={imgSrc}
            alt={product.name}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
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
    </motion.div>
  )
}
