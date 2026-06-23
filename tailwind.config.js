/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand:   { DEFAULT: '#FF2D5E', light: '#ff5c82', dark: '#cc1a44' },
        xbox:    { DEFAULT: '#107C10', light: '#15a015', dark: '#0a5a0a' },
        ps:      { DEFAULT: '#003087', light: '#0050b3' },
        snes:    { DEFAULT: '#8b0000', light: '#b00000' },
        n64:     { DEFAULT: '#1a1aff', light: '#4444ff' },
        gcube:   { DEFAULT: '#6a0dad', light: '#8b15d4' },
        wii:     { DEFAULT: '#4a4a4a', light: '#666' },
        surface: { 1: '#0a0e1a', 2: '#1a1a1a', 3: '#252525', 4: '#333' },
        social:  { DEFAULT: '#FF4D4D', light: '#FF7A7A', dark: '#cc3a3a', bg: '#0a0e1a', ink: '#10162a' },
      },
      fontFamily: { sans: ['Montserrat', 'sans-serif'] },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.25,1,0.5,1) both',
        'toast-in': 'toastIn 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}

