/**** @type {import('tailwindcss').Config} ****/
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
  darkMode: 'class', // Enable class-based dark mode (controlled by .dark on <html>)
};
