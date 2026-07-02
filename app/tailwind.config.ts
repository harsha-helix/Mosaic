import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Manual toggle (Settings > Appearance) rather than pure OS-driven —
  // dark: variants are unchanged, they now key off a `dark` class on <html>
  // instead of a media query. See src/store/theme.ts.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base — cream / parchment. Dark = "ink and ember": near-black
        // warm-tinted base with bigger tonal steps between page/card/raised
        // surfaces than before, so layers actually separate in dark mode.
        base: '#FAF3E7',
        'base-dark': '#120E0A',
        surface: '#FFFBF3',
        'surface-dark': '#1D1712',
        elevated: '#F4EAD9',
        'elevated-dark': '#2C2318',
        // Text
        ink: '#2B2420',
        'ink-dark': '#FBF5EA',
        muted: '#6B5F52',
        'muted-dark': '#D2BEA3',
        hint: '#9A8E7E',
        'hint-dark': '#93816C',
        // Border
        hairline: '#E5D9C6',
        'hairline-dark': '#4A3B2A',
        // Brand + accent clusters — values come from CSS custom properties
        // (see :root / .dark in index.css) so every Tailwind class that
        // uses them (bg-terracotta, text-warmth, etc) is automatically
        // theme-reactive without a dark: companion class. Dark mode uses
        // brighter, more saturated variants of the same 5 hues — colors
        // tuned for cream paper read muddy on a near-black background.
        terracotta: 'var(--color-terracotta)',
        reflective: 'var(--color-reflective)',
        warmth: 'var(--color-warmth)',
        sage: 'var(--color-sage)',
        mauve: 'var(--color-mauve)',
        danger: 'var(--color-danger)',
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
        // Was rgba(0,0,0,0.4) — a black shadow barely reads against an
        // already near-black page. Bigger blur/spread for definition, plus
        // a whisper of a top highlight so raised surfaces read as "lit
        // from above" rather than just a flat color step.
        'card-dark': '0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
        fab: '0 4px 20px rgba(193,99,61,0.35)',
        // Dark-mode FAB glow uses the brighter dark-mode terracotta at
        // higher opacity — glows read better against dark than light, so
        // this is a case where dark mode can look more vivid, not less.
        'fab-dark': '0 6px 28px rgba(243,145,92,0.55)',
        'btn-primary': 'inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)',
        'btn-primary-active': 'inset 0 -1px 0 rgba(43,36,32,0.15), 0 1px 2px rgba(43,36,32,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
