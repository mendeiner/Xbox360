/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        xbox:    { DEFAULT: '#107C10', light: '#15a015', dark: '#0a5a0a' },
        ps:      { DEFAULT: '#003087', light: '#0050b3' },
        snes:    { DEFAULT: '#8b0000', light: '#b00000' },
        n64:     { DEFAULT: '#1a1aff', light: '#4444ff' },
        gcube:   { DEFAULT: '#6a0dad', light: '#8b15d4' },
        wii:     { DEFAULT: '#4a4a4a', light: '#666' },
        surface: { 1: '#0f0f0f', 2: '#1a1a1a', 3: '#252525', 4: '#333' },
      },
      fontFamily: { sans: ['Montserrat', 'sans-serif'] },
    },
  },
  plugins: [],
}

