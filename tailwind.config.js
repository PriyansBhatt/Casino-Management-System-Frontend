/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'casino-dark': '#1a1a2e',
        'casino-accent': '#16213e',
        'casino-gold': '#e94560',
        'casino-light': '#0f3460',
      }
    },
  },
  plugins: [],
}
