import { useState } from 'react'
import { motion } from 'framer-motion'
import { signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { Check, Sparkles } from 'lucide-react'
import { auth, googleProvider } from '../firebase.js'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const FEATURES = [
  'Photorealistic AI redesigns in under 60 seconds',
  'Shop every product in your redesign with direct links',
  'Repaint specific areas for targeted changes',
]

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider)
        return
      }
      if (
        err.code !== 'auth/popup-closed-by-user' &&
        err.code !== 'auth/cancelled-popup-request'
      ) {
        setError('Sign-in failed. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#F5F5FA] flex">
      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 border-r border-black/[0.07] relative overflow-hidden bg-white">
        {/* Subtle bg tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-transparent to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center">
            <Sparkles size={17} className="text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">SnapSpace</span>
        </div>

        {/* Main copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-5xl font-bold text-[#0D0D1A] leading-[1.1] tracking-[-0.03em]">
            Your space,<br />redesigned<br />by AI.
          </h1>
          <p className="mt-5 text-[17px] text-[#6B6B8A] leading-relaxed">
            Upload a photo of any room. Get a photorealistic redesign with real,
            shoppable product links — in under a minute.
          </p>
          <ul className="mt-9 space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-[#6B6B8A]">
                <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={11} className="text-[#7C3AED]" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Footer */}
        <p className="text-sm text-[#9B9BB8] relative z-10">
          Free to use · No credit card required
        </p>
      </div>

      {/* ── Right panel — sign in ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center">
              <Sparkles size={17} className="text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#0D0D1A]">SnapSpace</span>
          </div>

          <h2 className="text-2xl font-semibold text-[#0D0D1A] tracking-tight">Sign in</h2>
          <p className="mt-1.5 text-sm text-[#6B6B8A]">Continue to SnapSpace — it's free</p>

          <div className="mt-8">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-3 bg-white text-gray-900 text-sm font-medium rounded-xl shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-sm text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}
          </div>

          {/* Mobile features */}
          <ul className="lg:hidden mt-10 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-[#6B6B8A]">
                <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={11} className="text-[#7C3AED]" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xs text-[#9B9BB8] text-center leading-relaxed">
            By signing in you agree to our Terms of Service.<br />
            We never post or share your data.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
