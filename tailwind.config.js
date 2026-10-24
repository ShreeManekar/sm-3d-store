// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        darkSurface: '#111726',
        darkElevated: '#1a2337',
        neonCyan: '#00f0ff',
        neonPurple: '#8a2be2',
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('light', 'html:not(.dark) &');
    },
  ],
};
