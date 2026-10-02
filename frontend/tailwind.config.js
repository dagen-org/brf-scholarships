/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        sm: ['1rem', '1.5rem'],
        xs: ['0.875rem', '1.25rem'],
      }
    },
  },
  plugins: [],
}
