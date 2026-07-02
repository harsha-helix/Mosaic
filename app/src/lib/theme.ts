/**
 * Design token constants for use in inline `style` props (dynamic colors —
 * moment types, metrics — can't be expressed as static Tailwind classes).
 * Static/structural colors (backgrounds, text, borders) should use the
 * Tailwind theme classes in tailwind.config.ts instead (bg-base, text-ink, etc).
 *
 * Values below are CSS custom-property references (see :root / .dark in
 * index.css), not literal hex — dark mode uses brighter, more saturated
 * variants of the same 5 hues, and referencing the variable means every
 * consumer (including plain object maps like MOMENT_COLORS that run
 * outside React, before any component renders) stays theme-reactive
 * without needing to know which theme is active.
 */

// Accent clusters (spec §Design Tokens > Accent clusters)
export const CLUSTER = {
  reflective: 'var(--color-reflective)', // dusty teal — reading, music, quote, insight; Excitement metric
  warmth:     'var(--color-warmth)',     // honey gold — beautiful, gratitude, place; Mood metric
  creative:   'var(--color-terracotta)', // terracotta — idea, photo, conversation; brand; Spark metric
  body:       'var(--color-sage)',       // sage — workout, coffee, nicotine
  anxiety:    'var(--color-mauve)',      // muted mauve — anxiety (alone)
} as const

// Darkest reasonable shade of each cluster's own family, for text-on-accent
// (buttons filled with a cluster color use this instead of pure white/black).
// These stay static across themes — dark mode's accent chips are brighter/
// lighter than light mode's, so the same dark text keeps working (often
// with *more* contrast, not less).
const TEXT_ON_ACCENT: Record<string, string> = {
  [CLUSTER.reflective]: '#1F3231',
  [CLUSTER.warmth]:     '#4A3612',
  [CLUSTER.creative]:   '#3D1F12',
  [CLUSTER.body]:       '#2E3820',
  [CLUSTER.anxiety]:    '#3A2530',
}

export function textOnAccent(color: string): string {
  return TEXT_ON_ACCENT[color] ?? '#2B2420'
}

// A muted, warm destructive/error color — distinct from any cluster so it
// doesn't collide with a moment-type or metric meaning.
export const DANGER = 'var(--color-danger)'

// Success (sync complete) — reuses sage rather than a cold system green.
export const SUCCESS = 'var(--color-sage)'

// Pending/waiting state — warmth gold.
export const PENDING = 'var(--color-warmth)'
