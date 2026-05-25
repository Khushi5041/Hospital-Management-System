/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#5eead4',
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(13,148,136,0.06)',
      },
    },
  },
  plugins: [],
};
