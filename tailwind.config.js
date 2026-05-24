/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          950: '#07070D',
          900: '#0C0C16',
          800: '#111120',
          700: '#17172A',
          600: '#1E1E35',
        },
        accent: {
          violet:    '#7C3AED',
          'violet-lt': '#A78BFA',
          blue:      '#3B82F6',
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
      },
    },
  },
  plugins: [],
}
