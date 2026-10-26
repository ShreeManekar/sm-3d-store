// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      transitionTimingFunction: {
        'apple-ease': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'apple-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      colors: {
        darkBg: '#080b11',
        darkSurface: '#0b0f17',
        darkElevated: '#121824',
        neonGold: '#f59e0b',
        goldAccent: '#fbbf24',
        goldDark: '#d97706',
        neonCyan: '#f59e0b', // fallback so any legacy neonCyan renders golden
        neonPurple: '#d97706',
        appleGray: {
          50: '#fbfbfd',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#86868b',
          500: '#6e6e73',
          600: '#424245',
          700: '#333336',
          800: '#1d1d1f',
          900: '#0b0f17',
          950: '#080b11',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
      },
      boxShadow: {
        'gold-glow': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'gold-sm': '0 0 15px -2px rgba(245, 158, 11, 0.25)',
        'gold-rim': '0 0 0 1px rgba(245, 158, 11, 0.3), 0 12px 35px -8px rgba(0, 0, 0, 0.85)',
        'dark-velvet': '0 20px 45px -15px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(245, 158, 11, 0.12)',
        'dark-deep': '0 25px 60px -15px rgba(0, 0, 0, 0.98)',
        'apple-card': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'apple-glow': '0 0 40px -10px rgba(245, 158, 11, 0.22)',
      },
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('light', 'html:not(.dark) &');
    },
  ],
};

