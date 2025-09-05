/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hsr-gold': '#FFD700',
        'hsr-purple': '#9932CC',
        'hsr-blue': '#4169E1',
        'hsr-dark': '#1a1a2e',
        'hsr-darker': '#16213e',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #FFD700' },
          '100%': { boxShadow: '0 0 20px #FFD700, 0 0 30px #FFD700' },
        },
      },
    },
  },
  plugins: [],
}
