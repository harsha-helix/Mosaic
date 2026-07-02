import { CLUSTER } from '../lib/theme'

export type MomentType =
  | 'photo'
  | 'beautiful'
  | 'idea'
  | 'gratitude'
  | 'anxiety'
  | 'conversation'
  | 'reading'
  | 'music'
  | 'quote'
  | 'workout'
  | 'coffee'
  | 'nicotine'
  | 'place'
  | 'insight'

export interface Moment {
  id: string           // {unix-ms}-{4-char-random}
  captured_at: string  // ISO 8601
  type: MomentType
  text: string
  media_id?: string    // same as id when photo is attached
  remember?: boolean   // omitted when false
}

// 5 accent clusters, grouped by feeling rather than one hue per type
// (see docs/07_UI_Specification.md > Accent clusters).
export const MOMENT_COLORS: Record<MomentType, string> = {
  // Reflective — dusty teal
  reading:      CLUSTER.reflective,
  music:        CLUSTER.reflective,
  quote:        CLUSTER.reflective,
  insight:      CLUSTER.reflective,
  // Warmth — honey gold
  beautiful:    CLUSTER.warmth,
  gratitude:    CLUSTER.warmth,
  place:        CLUSTER.warmth,
  // Creative spark — terracotta
  idea:         CLUSTER.creative,
  photo:        CLUSTER.creative,
  conversation: CLUSTER.creative,
  // Body / routine — sage
  workout:      CLUSTER.body,
  coffee:       CLUSTER.body,
  nicotine:     CLUSTER.body,
  // Anxiety — muted mauve (kept alone)
  anxiety:      CLUSTER.anxiety,
}

export const MOMENT_PLACEHOLDERS: Record<MomentType, string> = {
  beautiful:    'What did you notice?',
  idea:         "What's the idea?",
  gratitude:    'What are you grateful for?',
  anxiety:      "What's on your mind?",
  conversation: 'Who did you talk to? What stuck?',
  reading:      'What are you reading?',
  music:        'What are you listening to?',
  quote:        'What did you read?',
  workout:      'What did you do?',
  coffee:       'First cup? Treat?',
  nicotine:     'Cigarette, gum, or patch?',
  place:        'Where are you?',
  insight:      'What did you just realise?',
  photo:        "What's in this photo?",
}

export const REMEMBER_DEFAULTS: Partial<Record<MomentType, boolean>> = {
  beautiful: true,
  photo: true,
}

export function generateMomentId(): string {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 6)
  return `${ts}-${rand}`
}
