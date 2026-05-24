import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

const CATEGORY_COLORS = {
  Furniture:  { bg: 'bg-violet-500/10', text: 'text-violet-300' },
  Lighting:   { bg: 'bg-amber-500/10',  text: 'text-amber-300'  },
  Textiles:   { bg: 'bg-rose-500/10',   text: 'text-rose-300'   },
  Decor:      { bg: 'bg-emerald-500/10',text: 'text-emerald-300'},
  Storage:    { bg: 'bg-blue-500/10',   text: 'text-blue-300'   },
  Appliances: { bg: 'bg-cyan-500/10',   text: 'text-cyan-300'   },
}

export default function ProductCard({ product, index }) {
  const cat = CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.Decor

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="card card-hover flex flex-col overflow-hidden transition-colors"
    >
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Store + Category */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#484860] font-medium">{product.store}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
            {product.category}
          </span>
        </div>

        {/* Product name */}
        <p className="text-sm font-medium text-white leading-snug">{product.name}</p>

        {/* Reason */}
        {product.reason && (
          <p className="text-xs text-[#8888A4] leading-relaxed line-clamp-2">{product.reason}</p>
        )}

        {/* Price + CTA */}
        <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white">{product.priceRange}</span>
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
