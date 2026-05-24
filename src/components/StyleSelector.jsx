import { motion } from 'framer-motion'

const STYLES = [
  { id: 'Modern',       emoji: '🏙️' },
  { id: 'Scandinavian', emoji: '🌿' },
  { id: 'Mid-Century',  emoji: '🛋️' },
  { id: 'Industrial',   emoji: '⚙️' },
  { id: 'Japandi',      emoji: '🍵' },
  { id: 'Bohemian',     emoji: '🌺' },
]

export default function StyleSelector({ selected, onSelect }) {
  return (
    <div className="w-full">
      <p className="text-xs font-medium text-[#484860] uppercase tracking-widest mb-3">Design style</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {STYLES.map((style, i) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(style.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-150 ${
              selected === style.id
                ? 'bg-[#7C3AED] border-[#7C3AED] text-white'
                : 'bg-[#0C0C16] border-white/[0.08] text-[#8888A4] hover:border-white/[0.18] hover:text-white'
            }`}
          >
            <span className="text-base">{style.emoji}</span>
            {style.id}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
