import type { DailyEntry, Moment } from '../types'

/** Compute averages for the last N days from a list of entries */
export function computeAverages(entries: DailyEntry[], days = 7): {
  spark: number | null
  mood: number | null
  energy: number | null
  anxiety: number | null
  sleep: number | null
} {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const recent = entries.filter(e => e.date >= cutoffStr)

  function avg(vals: (number | undefined)[]): number | null {
    const nums = vals.filter((v): v is number => v !== undefined)
    return nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null
  }

  return {
    spark:   avg(recent.map(e => e.evening?.spark)),
    mood:    avg([...recent.map(e => e.morning?.mood), ...recent.map(e => e.evening?.mood)]),
    energy:  avg(recent.map(e => e.morning?.energy)),
    anxiety: avg(recent.map(e => e.morning?.anxiety)),
    sleep:   avg(recent.map(e => e.evening?.sleep_hours)),
  }
}

/** Format a date string YYYY-MM-DD into a readable label like "Jun 28" */
export function formatDateLabel(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/** Format an ISO timestamp into "9:14 AM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/** Full-text search: returns true if query appears in the moment's text */
export function momentMatchesQuery(moment: Moment, query: string): boolean {
  const q = query.toLowerCase()
  return (moment.text?.toLowerCase().includes(q) ?? false)
}

/** Highlight matched substring in terracotta (brand accent) */
export function highlight(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(
    new RegExp('(' + escaped + ')', 'gi'),
    '<mark style="background:color-mix(in srgb, var(--color-terracotta) 13%, transparent);color:var(--color-terracotta);border-radius:3px;padding:0 2px">$1</mark>'
  )
}

/** Group an array by a key function */
export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    ;(acc[k] ??= []).push(item)
    return acc
  }, {})
}
