/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Noto Serif', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          surface: '#fefae0',
          surfaceLow: '#f8f4db',
          surfaceHigh: '#e7e3ca',
          palm: '#012d1d',
          palmContainer: '#1b4332',
          terracotta: '#fda055',
          terracottaInk: '#703800',
          secondary: '#924c00',
          outline: '#717973',
          onSurface: '#1d1c0d',
        },
      },
      boxShadow: {
        ambient: '0 24px 40px rgba(29, 28, 13, 0.06)',
        soft: '0 18px 28px rgba(29, 28, 13, 0.05)',
      },
    },
  },
  plugins: [],
}

