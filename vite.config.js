import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/analytics', 'firebase/storage', 'firebase/functions'],
          'vendor-ui':       ['framer-motion', 'lucide-react', 'react-compare-slider'],
          'vendor-gemini':   ['@google/generative-ai'],
        },
      },
    },
  },
})
