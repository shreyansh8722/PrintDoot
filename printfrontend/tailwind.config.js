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
          50: '#eaf6fc',
          100: '#c8e8f6',
          200: '#a3d9f0',
          300: '#7dcae9',
          400: '#52B0D8',
          500: '#3d9ac4',
          600: '#3083ab',
          700: '#246a8e',
          800: '#1a5170',
          900: '#103952',
          DEFAULT: '#52B0D8',
        },
        surface: '#ffffff',
        dark: '#1a2332',
      },
    },
  },
  plugins: [],
}
