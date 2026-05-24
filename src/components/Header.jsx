import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, LogOut, ChevronDown } from 'lucide-react'

export default function Header({ user, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2.5"
      >
        <div className="w-8 h-8 rounded-lg btn-brand flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="text-lg font-700 text-white tracking-tight">
          Snap<span className="text-gradient font-800">Space</span>
        </span>
      </motion.div>

      {/* User menu */}
      {user && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Avatar button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 glass rounded-full pl-1 pr-3 py-1 hover:bg-white/5 transition-colors duration-200"
            aria-label="User menu"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User avatar'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full ring-2 ring-violet-500/40 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full btn-brand flex items-center justify-center text-white text-sm font-700">
                {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm font-500 text-gray-200 hidden sm:block max-w-[120px] truncate">
              {user.displayName?.split(' ')[0] ?? user.email}
            </span>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 glass rounded-2xl p-2 shadow-2xl shadow-black/40 border border-white/8"
              >
                {/* User info */}
                <div className="px-3 py-2.5 border-b border-white/6 mb-1">
                  <p className="text-sm font-600 text-white truncate">
                    {user.displayName ?? 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                </div>

                {/* Sign out */}
                <button
                  onClick={() => { setMenuOpen(false); onSignOut() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 text-left"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </header>
  )
}

