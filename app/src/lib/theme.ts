/**
 * Design token constants for use in inline `style` props (dynamic colors —
 * moment types, metrics — can't be expressed as static Tailwind classes).
 * Static/structural colors (backgrounds, text, borders) should use the
 * Tailwind theme classes in tailwind.config.ts instead (bg-base, text-ink, etc).
 */

// Accent clusters (spec §Design Tokens > Accent clusters)
export const CLUSTER = {
  reflective: '#5B7B7A', // dusty teal — reading, music, quote, insight; Excitement metric
  warmth:     '#C9A24B', // honey gold — beautiful, gratitude, place; Mood metric
  creative:   '#C1633D', // terracotta — idea, photo, conversation; brand; Spark metric
  body:       '#7A8B5C', // sage — workout, coffee, nicotine
  anxiety:    '#8B6B7D', // muted mauve — anxiety (alone)
} as const

// Darkest reasonable shade of each cluster's own family, for text-on-accent
// (buttons filled with a cluster color use this instead of pure white/black).
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
export const DANGER = '#B33F3F'

// Success (sync complete) — reuses sage rather than a cold system green.
export const SUCCESS = '#7A8B5C'

// Pending/waiting state — warmth gold.
export const PENDING = '#C9A24B'
