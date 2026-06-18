/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'atlas-bg':      '#05050a',
        'atlas-surface': '#0a0a12',
        'atlas-text':    '#e2e8f0',
        'atlas-accent':  '#6366f1',
        'atlas-purple':  '#8b5cf6',
      },
      fontFamily: {
        sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'float':         'float 4s ease-in-out infinite',
        'float-alt':     'floatAlt 5s ease-in-out infinite',
        'fade-in':       'fadeIn 0.35s ease forwards',
        'slide-in':      'slideIn 0.28s ease forwards',
        'ambient-pulse': 'ambientPulse 12s ease-in-out infinite',
        'orb-spin':      'orbSpin 90s linear infinite',
      },
    },
  },
  plugins: [],
}
