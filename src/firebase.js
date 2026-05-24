import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getStorage } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDBk71W95Ujg30WWQvpZGxNCM7r-6V_4YA',
  authDomain: 'snapspace-4d243.firebaseapp.com',
  databaseURL: 'https://snapspace-4d243-default-rtdb.firebaseio.com',
  projectId: 'snapspace-4d243',
  storageBucket: 'snapspace-4d243.firebasestorage.app',
  messagingSenderId: '593570680775',
  appId: '1:593570680775:web:70cac68989958f0c9313e2',
  measurementId: 'G-M24X02ZKJ5',
}

const app = initializeApp(firebaseConfig)

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
export const storage   = getStorage(app)
export const functions = getFunctions(app)
export const auth      = getAuth(app)

// Google OAuth — client ID: 593570680775-0u7j4bsb0v14rnrbt7ceot8ms52fqmea.apps.googleusercontent.com
// Registered under project 593570680775 (snapspace-4d243)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// Connect to local emulator in development if flag is set
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFunctionsEmulator(functions, 'localhost', 5001)
}

export default app
