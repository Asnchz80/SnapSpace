import { motion } from 'framer-motion'
import { ExternalLink, Tag, ShoppingBag } from 'lucide-react'

const CATEGORY_COLORS = {
  Furniture:   { bg: 'bg-violet-500/15', text: 'text-violet-300', dot: 'bg-violet-400' },
  Lighting:    { bg: 'bg-amber-500/15',  text: 'text-amber-300',  dot: 'bg-amber-400'  },
  Textiles:    { bg: 'bg-rose-500/15',   text: 'text-rose-300',   dot: 'bg-rose-400'   },
  Decor:       { bg: 'bg-emerald-500/15',text: 'text-emerald-300',dot: 'bg-emerald-400' },
  Storage:     { bg: 'bg-blue-500/15',   text: 'text-blue-300',   dot: 'bg-blue-400'   },
  Appliances:  { bg: 'bg-cyan-500/15',   text: 'text-cyan-300',   dot: 'bg-cyan-400'   },
}

const STORE_COLORS = {
  IKEA:      'from-blue-600 to-blue-800',
  Wayfair:   'from-violet-600 to-purple-800',
  'West Elm':'from-emerald-600 to-green-800',
  Amazon:    'from-orange-500 to-orange-700',
  'CB2':     'from-zinc-500 to-zinc-700',
  'Pottery Barn': 'from-amber-600 to-amber-800',
}

/**
 * @param {{ product: { name, category, priceRange, store, searchUrl, reason } }} props
 */
export default function ProductCard({ product, index }) {
  const cat = CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.Decor
  const storeGrad = STORE_COLORS[product.store] ?? 'from-violet-600 to-blue-700'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="glass rounded-2xl overflow-hidden hover:border-white/12 transition-all duration-300 group flex flex-col"
    >
      {/* Store banner / image placeholder */}
      <div className={`bg-gradient-to-br ${storeGrad} h-28 flex items-center justify-center relative overflow-hidden`}>
        <ShoppingBag size={36} className="text-white/20 absolute right-4 bottom-3 scale-150" />
        <div className="text-center z-10">
          <p className="text-white/60 text-xs font-500 uppercase tracking-widest">from</p>
          <p className="text-white font-700 text-xl mt-0.5">{product.store}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Category badge */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-600 ${cat.bg} ${cat.text} self-start`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
          {product.category}
        </span>

        <p className="text-white font-600 text-sm leading-snug">{product.name}</p>

        {product.reason && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{product.reason}</p>
        )}

        {/* Price + Shop button */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Tag size={12} />
            <span className="text-sm font-600">{product.priceRange}</span>
          </div>

          <motion.a
            href={product.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-brand text-white text-xs font-600 px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-violet-500/20 no-underline"
          >
            Shop Now
            <ExternalLink size={11} />
          </motion.a>
        </div>
      </div>
    </motion.div>
  )
}
