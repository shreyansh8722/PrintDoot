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
          50: '#e5feff',
          100: '#b3fcff',
          200: '#80faff',
          300: '#4df5f9',
          400: '#00DCE5',
          500: '#00C4CC',
          600: '#00A8B0',
          700: '#008A91',
          800: '#006B70',
          900: '#004D50',
          DEFAULT: '#00DCE5',
        },
        surface: '#ffffff',
        dark: '#1a2332',
      },
    },
  },
  plugins: [],
}
