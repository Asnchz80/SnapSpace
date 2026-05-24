import { useState } from 'react'
import { motion } from 'framer-motion'
import { signInWithPopup, signInWithRedirect } from 'firebase/auth'
import { Sparkles, Wand2, ShoppingBag, PaintbrushIcon, Shield } from 'lucide-react'
import { auth, googleProvider } from '../firebase.js'

// ── Google's official logo SVG (required by branding guidelines) ──
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const FEATURES = [
  {
    icon: <Wand2 size={15} />,
    text: 'AI redesigns your room or kitchen realistically in under a minute',
  },
  {
    icon: <ShoppingBag size={15} />,
    text: 'Every item in the redesign links directly to where you can buy it',
  },
  {
    icon: <PaintbrushIcon size={15} />,
    text: 'Paint over a specific area to redesign just that spot',
  },
]

export default function LoginScreen() {
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
      // onAuthStateChanged in App.jsx takes over once signed in
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        // Popup was blocked by the browser — fall back to full-page redirect
        await signInWithRedirect(auth, googleProvider)
        return
      }
      // Ignore user-initiated cancellations
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
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-5%]  w-[500px] h-[500px] bg-blue-600/10  rounded-full blur-[120px]" />
        <div className="absolute top-[40%]  right-[20%]    w-[300px] h-[300px] bg-indigo-600/6  rounded-full blur-[90px]"  />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md flex flex-col items-center gap-8"
      >
        {/* ── Brand mark ─────────────────────────── */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="w-13 h-13 w-[52px] h-[52px] rounded-2xl btn-brand flex items-center justify-center shadow-2xl shadow-violet-500/40">
            <Sparkles size={26} className="text-white" />
          </div>
          <span className="text-[2rem] font-800 text-white tracking-tight leading-none">
            Snap<span className="text-gradient">Space</span>
          </span>
        </motion.div>

        {/* ── Headline ───────────────────────────── */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-700 text-white leading-snug">
            Transform any room<br />with AI design
          </h1>
          <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
            Upload a photo and get a photorealistic redesign with real product
            links — in under 60 seconds.
          </p>
        </div>

        {/* ── Feature cards ──────────────────────── */}
        <div className="w-full flex flex-col gap-2.5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.08 }}
              className="flex items-center gap-3 glass rounded-xl px-4 py-3"
            >
              <span className="text-violet-400 flex-shrink-0">{f.icon}</span>
              <span className="text-sm text-gray-300">{f.text}</span>
            </motion.div>
          ))}
        </div>

        {/* ── Sign-in card ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="w-full glass rounded-2xl p-6 flex flex-col items-center gap-4"
        >
          <p className="text-sm text-gray-400 font-500">Sign in to get started — it's free</p>

          <motion.button
            onClick={handleSignIn}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-600 text-sm py-3.5 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              : <GoogleIcon />
            }
            <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
          </motion.button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 text-center"
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* ── Privacy note ───────────────────────── */}
        <p className="text-xs text-gray-600 text-center max-w-xs leading-relaxed flex items-start gap-1.5">
          <Shield size={11} className="mt-0.5 flex-shrink-0 text-gray-700" />
          We only use your Google account to identify you. We never post, share, or access
          anything outside this app.
        </p>
      </motion.div>
    </div>
  )
}
