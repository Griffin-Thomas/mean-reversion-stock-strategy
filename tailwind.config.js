/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'signal-buy': '#10b981',
        'signal-sell': '#ef4444',
        'signal-hold': '#f59e0b',
      }
    },
  },
  plugins: [],
}
