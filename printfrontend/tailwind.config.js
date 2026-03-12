/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#e0f7f9',
          100: '#b3ecef',
          200: '#80dfe5',
          300: '#4dd2da',
          400: '#2bbcc4',
          500: '#1a9ba3',
          600: '#158189',
          700: '#0f666e',
          800: '#0a4c53',
          900: '#053238',
          DEFAULT: '#2bbcc4',
        },
        surface: '#ffffff',
        dark: '#1a2332',
      },
    },
  },
  plugins: [],
}
