import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Trash2, ArrowRight } from 'lucide-react'

function relativeTime(ts) {
  if (!ts) return ''
  const ms = ts.toMillis ? ts.toMillis() : ts.seconds ? ts.seconds * 1000 : Number(ts)
  const diff = Date.now() - ms
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(ms).toLocaleDateString()
}

export default function ScanHistoryCard({ scan, onResume, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const completedStyles = Object.values(scan.styles || {}).filter(s => s.status === 'done')
  const thumbnailUrl = completedStyles[0]?.imageUrl || scan.originalUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden border border-black/[0.07] shadow-sm hover:shadow-md hover:border-black/[0.14] transition-all duration-200 cursor-pointer group flex flex-col"
      onClick={() => onResume(scan)}
    >
      {/* Thumbnail */}
      <div className="relative h-32 bg-[#F0F0F8] overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt="Room scan"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-30">🏠</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-[#0D0D1A] px-2 py-0.5 rounded-full shadow-sm">
          {completedStyles.length}/5
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {scan.userDescription ? (
          <p className="text-xs font-medium text-[#0D0D1A] line-clamp-2 leading-snug">
            {scan.userDescription}
          </p>
        ) : (
          <p className="text-xs text-[#9B9BB8] italic">Room scan</p>
        )}

        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 text-[10px] text-[#9B9BB8]">
            <Clock size={9} />
            <span>{relativeTime(scan.createdAt)}</span>
          </div>
          <div className="flex gap-0.5 text-xs">
            {completedStyles.slice(0, 5).map((s, i) => (
              <span key={i}>{s.emoji}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1.5 mt-auto border-t border-black/[0.06]">
          <button
            onClick={e => { e.stopPropagation(); onResume(scan) }}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#7C3AED] py-1.5 hover:bg-violet-50 rounded-lg transition-colors"
          >
            Continue <ArrowRight size={11} />
          </button>
          {!confirmDelete ? (
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
              className="p-1.5 text-[#BEBEDE] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={12} />
            </button>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(false); onDelete(scan.id) }}
              className="text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors"
            >
              Delete?
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
