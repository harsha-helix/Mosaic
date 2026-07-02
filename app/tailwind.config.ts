import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Base — cream / parchment
        base: '#FAF3E7',
        'base-dark': '#1E1812',
        surface: '#FFFBF3',
        'surface-dark': '#2A231C',
        elevated: '#F4EAD9',
        'elevated-dark': '#332B21',
        // Text
        ink: '#2B2420',
        'ink-dark': '#F3EAD9',
        muted: '#6B5F52',
        'muted-dark': '#B3A390',
        hint: '#9A8E7E',
        'hint-dark': '#7A6D5C',
        // Border
        hairline: '#E5D9C6',
        'hairline-dark': '#3A2F24',
        // Brand + accent clusters
        terracotta: '#C1633D',
        reflective: '#5B7B7A',
        warmth: '#C9A24B',
        sage: '#7A8B5C',
        mauve: '#8B6B7D',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Karla', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
        btn: '14px',
        'btn-sm': '12px',
        input: '12px',
        sheet: '24px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(43,36,32,0.08)',
        'card-dark': '0 2px 12px rgba(0,0,0,0.4)',
        fab: '0 4px 20px rgba(193,99,61,0.35)',
        'btn-primary': 'inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)',
        'btn-primary-active': 'inset 0 -1px 0 rgba(43,36,32,0.15), 0 1px 2px rgba(43,36,32,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
