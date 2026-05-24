import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { motion } from 'framer-motion'
import { ArrowLeftRight } from 'lucide-react'

export default function ComparisonSlider({ originalSrc, redesignedSrc, alt = 'Space' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full relative"
    >
      {/* Labels */}
      <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-[#484860] mb-3 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#484860]" />
          Before
        </span>
        <span className="flex items-center gap-1.5 text-[#A78BFA]">
          After
          <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
        </span>
      </div>

      {/* Slider */}
      <div className="rounded-xl overflow-hidden border border-white/[0.08]">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={originalSrc}
              alt={`${alt} — original`}
              style={{ objectFit: 'cover' }}
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src={redesignedSrc}
              alt={`${alt} — redesigned`}
              style={{ objectFit: 'cover' }}
            />
          }
          style={{ height: 'clamp(220px, 52vw, 420px)' }}
        />
      </div>

      {/* Drag hint */}
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#484860]">
        <ArrowLeftRight size={12} />
        Drag to compare before &amp; after
      </div>
    </motion.div>
  )
}
