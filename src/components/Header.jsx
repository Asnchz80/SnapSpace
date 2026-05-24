import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, LogOut, ChevronDown } from 'lucide-react'

export default function Header({ user, onSignOut }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-[#07070D]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            Snap<span className="text-gradient">Space</span>
          </span>
        </div>

        {/* User menu */}
        {user && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 hover:bg-white/[0.04] transition-colors"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#7C3AED] flex items-center justify-center text-white text-xs font-semibold">
                  {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="hidden sm:block text-sm text-[#8888A4] max-w-[120px] truncate">
                {user.displayName?.split(' ')[0] ?? user.email}
              </span>
              <ChevronDown
                size={13}
                className={`text-[#484860] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.13, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-52 card p-1.5 shadow-2xl shadow-black/70"
                >
                  <div className="px-3 py-2.5 mb-1 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white truncate">
                      {user.displayName ?? 'User'}
                    </p>
                    <p className="text-xs text-[#484860] mt-0.5 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setOpen(false); onSignOut() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#8888A4] hover:text-red-400 hover:bg-red-500/10 transition-all text-left"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  )
}

