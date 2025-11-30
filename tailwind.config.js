/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-gold': '#FDB813',
        'gold-hover': '#E5A510',
        'gold-light': '#FEF3E2',
      },
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
