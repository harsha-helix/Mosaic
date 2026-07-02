import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllEntries, getAllMoments } from '../../lib/db/queries'
import { formatDateLabel, groupBy } from '../../lib/utils'
import type { DailyEntry, Moment } from '../../types'
import { METRIC_COLORS } from '../../types'
import { MomentCard } from '../../components/MomentCard/MomentCard'
import { DayGlyph } from '../../components/DayGlyph/DayGlyph'

interface HighlightItem {
  kind: 'moment' | 'commit'
  date: string
  sortKey: string
  moment?: Moment
  entry?: DailyEntry
}

function CommitCard({ entry, onClick }: { entry: DailyEntry; onClick: () => void }) {
  const ev = entry.evening!
  const m = entry.morning
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-card p-4 bg-surface dark:bg-surface-dark shadow-card dark:shadow-card-dark flex gap-3"
      style={{ borderLeft: '3px solid var(--color-terracotta)' }}
    >
      {m && (m.mood !== undefined || m.energy !== undefined || m.anxiety !== undefined || m.excitement !== undefined) && (
        <DayGlyph mood={m.mood} energy={m.energy} anxiety={m.anxiety} excitement={m.excitement} size={40} className="flex-shrink-0 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium text-terracotta">✦ Day committed</span>
          {ev.remember && <span className="text-[14px] text-warmth">★</span>}
        </div>
        {ev.day_title && (
          <p className="font-display text-[16px] font-semibold text-ink dark:text-ink-dark leading-snug mb-1">
            "{ev.day_title}"
          </p>
        )}
        {ev.commit_message && (
          <p className="font-mono text-[12px] text-muted dark:text-muted-dark mb-2">{ev.commit_message}</p>
        )}
        <div className="flex items-center gap-3">
          {ev.spark !== undefined && (
            <span className="text-[12px] text-hint dark:text-hint-dark">Spark <span className="font-medium" style={{ color: METRIC_COLORS.spark }}>{ev.spark}</span></span>
          )}
          {ev.mood !== undefined && (
            <span className="text-[12px] text-hint dark:text-hint-dark">Mood <span className="font-medium" style={{ color: METRIC_COLORS.mood }}>{ev.mood}</span></span>
          )}
        </div>
      </div>
    </button>
  )
}

export default function HighlightsScreen() {
  const navigate = useNavigate()
  const [items, setItems] = useState<HighlightItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [entries, moments] = await Promise.all([getAllEntries(), getAllMoments()])

      const all: HighlightItem[] = []

      // Remembered moments
      for (const m of moments) {
        if (m.remember) {
          all.push({ kind: 'moment', date: m.captured_at.slice(0, 10), sortKey: m.captured_at, moment: m })
        }
      }

      // Evening commits
      for (const e of entries) {
        if (e.evening?.submitted_at) {
          all.push({ kind: 'commit', date: e.date, sortKey: e.evening.submitted_at, entry: e })
        }
      }

      // Sort newest first
      all.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      setItems(all)
      setLoading(false)
    }
    load()
  }, [])

  const grouped = groupBy(items, i => i.date)
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (loading) {
    return (
      <div className="min-h-screen bg-base dark:bg-base-dark flex items-center justify-center">
        <p className="text-hint dark:text-hint-dark text-[14px]">Loading...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-base dark:bg-base-dark px-4 pt-14 pb-6">
        <h1 className="font-display text-[24px] font-semibold text-ink dark:text-ink-dark mb-8">Highlights</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[40px] mb-4 text-terracotta">✦</p>
          <p className="text-[15px] text-muted dark:text-muted-dark leading-relaxed max-w-[240px]">
            Nothing remembered yet — tap ★ on any moment to keep it here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base dark:bg-base-dark px-4 pt-14 pb-24">
      <h1 className="font-display text-[24px] font-semibold text-ink dark:text-ink-dark mb-6">Highlights</h1>

      <div className="space-y-6">
        {dates.map(date => (
          <div key={date} className="space-y-3">
            <p className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide">{formatDateLabel(date)}</p>
            {grouped[date].map((item, i) => (
              item.kind === 'moment' ? (
                <MomentCard
                  key={i}
                  moment={item.moment!}
                  onClick={() => {/* future: moment detail */}}
                />
              ) : (
                <CommitCard
                  key={i}
                  entry={item.entry!}
                  onClick={() => navigate('/day/' + item.date)}
                />
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
