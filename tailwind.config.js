/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background:  '#0f0e0d',
        surface:     '#1a1814',
        surfaceHigh: '#242018',
        border:      '#2e2a24',
        muted:       '#4a4540',
        textPrimary: '#e8e0d5',
        textSecond:  '#a89f94',
        orange:      '#e8743a',
        orangeHover: '#d4622a',
        orangeMuted: '#3d2a1a',
        amber:       '#c4852a',
        success:     '#5a8a5a',
        warning:     '#b8860b',
        error:       '#8b3a3a',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
