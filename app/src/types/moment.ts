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

export const MOMENT_COLORS: Record<MomentType, string> = {
  photo:        '#4D96FF',
  beautiful:    '#FFD93D',
  idea:         '#FF6B6B',
  gratitude:    '#6BCB77',
  anxiety:      '#A855F7',
  conversation: '#F97316',
  reading:      '#06B6D4',
  music:        '#EC4899',
  quote:        '#84CC16',
  workout:      '#EF4444',
  coffee:       '#6366F1',
  nicotine:     '#F59E0B',
  place:        '#10B981',
  insight:      '#F59E0B',
}

export const MOMENT_EMOJIS: Record<MomentType, string> = {
  photo:        '📷',
  beautiful:    '🌸',
  idea:         '💡',
  gratitude:    '🙏',
  anxiety:      '😟',
  conversation: '❤️',
  reading:      '📚',
  music:        '🎵',
  quote:        '📖',
  workout:      '🏃',
  coffee:       '☕',
  nicotine:     '🚬',
  place:        '🌍',
  insight:      '✨',
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
