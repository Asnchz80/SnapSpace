import { motion } from 'framer-motion'

const STYLES = [
  { id: 'Modern',        emoji: '🏙️', desc: 'Clean lines, neutral palette' },
  { id: 'Scandinavian',  emoji: '🌿', desc: 'Light wood, cozy minimalism' },
  { id: 'Mid-Century',   emoji: '🛋️', desc: 'Retro warmth, organic shapes' },
  { id: 'Industrial',    emoji: '⚙️', desc: 'Raw materials, urban edge' },
  { id: 'Japandi',       emoji: '🍵', desc: 'Japanese-Scandi harmony' },
  { id: 'Bohemian',      emoji: '🌺', desc: 'Layered textures, warm earth tones' },
]

export default function StyleSelector({ selected, onSelect }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-sm text-gray-400 mb-3 text-center font-500">Choose a design style</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STYLES.map((style, i) => (
          <motion.button
            key={style.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(style.id)}
            className={`glass rounded-xl p-4 text-left transition-all duration-200 hover:border-violet-500/50 ${
              selected === style.id
                ? 'border-violet-500/70 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                : 'hover:bg-white/3'
            }`}
          >
            <span className="text-2xl block mb-2">{style.emoji}</span>
            <p className="text-white text-sm font-600">{style.id}</p>
            <p className="text-gray-500 text-xs mt-0.5">{style.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
