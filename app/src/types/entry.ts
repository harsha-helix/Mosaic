export interface MorningEntry {
  submitted_at: string
  mood?: number        // 1–10
  energy?: number
  anxiety?: number
  excitement?: number
  intention?: string
  priority?: string
  notice?: string
}

export interface ExerciseEntry {
  done: boolean
  minutes?: number
}

export interface EveningEntry {
  submitted_at: string
  spark?: number       // 1–10
  mood?: number
  exercise?: ExerciseEntry
  reading_minutes?: number
  deep_work_hours?: number
  sleep_hours?: number
  biggest_win?: string
  biggest_challenge?: string
  energised_by?: string
  drained_by?: string
  journal?: string
  commit_message?: string
  day_title?: string
  remember?: boolean
}

export interface DailyEntry {
  date: string         // YYYY-MM-DD
  morning?: MorningEntry
  evening?: EveningEntry
}

export const METRIC_COLORS: Record<string, string> = {
  mood:       '#FF6B6B',
  energy:     '#FFD93D',
  anxiety:    '#A855F7',
  excitement: '#6BCB77',
  spark:      '#7C4DFF',
}
