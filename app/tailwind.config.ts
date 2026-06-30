import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Hero colors
        mosaic: {
          violet: '#7C4DFF',
          coral: '#FF6B6B',
          yellow: '#FFD93D',
          green: '#6BCB77',
          blue: '#4D96FF',
          pink: '#EC4899',
          orange: '#F97316',
          cyan: '#06B6D4',
          lime: '#84CC16',
          red: '#EF4444',
          amber: '#F59E0B',
          indigo: '#6366F1',
          emerald: '#10B981',
          purple: '#A855F7',
        },
        // Neutrals
        base: '#FAFAF8',
        surface: '#FFFFFF',
        elevated: '#F4F4F2',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
        btn: '12px',
        input: '12px',
        sheet: '24px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-dark': '0 2px 12px rgba(0,0,0,0.4)',
        fab: '0 4px 20px rgba(124,77,255,0.4)',
      },
    },
  },
  plugins: [],
}

export default config
