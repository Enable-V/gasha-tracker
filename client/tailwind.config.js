/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Основная палитра — глубокий космос
        'void': {
          950: '#050510',
          900: '#0a0a1a',
          800: '#0f0f23',
          700: '#141428',
          600: '#1a1a35',
        },
        // Золото звёзд (5★)
        'star-gold': {
          DEFAULT: '#fbbf24',
          light: '#fde68a',
          dark: '#d97706',
          glow: '#f59e0b',
        },
        // Фиолетовый (4★)
        'star-purple': {
          DEFAULT: '#a855f7',
          light: '#c084fc',
          dark: '#7c3aed',
          glow: '#8b5cf6',
        },
        // Синий (3★) 
        'star-blue': {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
          glow: '#6366f1',
        },
        // Акцентные
        'accent': {
          cyan: '#22d3ee',
          pink: '#ec4899',
        },
        // Обратная совместимость
        'hsr-gold': '#fbbf24',
        'hsr-purple': '#a855f7',
        'hsr-blue': '#3b82f6',
        'hsr-dark': '#0a0a1a',
        'hsr-darker': '#050510',
      },
      fontFamily: {
        'sans': ['"Exo 2"', 'Inter', 'system-ui', 'sans-serif'],
        'display': ['"Exo 2"', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'hero-pattern': 'radial-gradient(ellipse at 20% 50%, rgba(168,85,247,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(251,191,36,0.05) 0%, transparent 50%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'text-shimmer': 'text-shimmer 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'star-twinkle': 'star-twinkle 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'particle': 'particle 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(251,191,36,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'text-shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'star-twinkle': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        particle: {
          '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(720deg)', opacity: '0' },
        },
      },
      boxShadow: {
        'glow-gold': '0 0 15px rgba(251,191,36,0.3), 0 0 45px rgba(251,191,36,0.1)',
        'glow-purple': '0 0 15px rgba(168,85,247,0.3), 0 0 45px rgba(168,85,247,0.1)',
        'glow-blue': '0 0 15px rgba(59,130,246,0.3), 0 0 45px rgba(59,130,246,0.1)',
        'glow-cyan': '0 0 15px rgba(34,211,238,0.3), 0 0 45px rgba(34,211,238,0.1)',
        'glass': '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-hover': '0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
}
