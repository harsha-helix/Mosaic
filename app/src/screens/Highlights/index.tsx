import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllEntries, getAllMoments } from '../../lib/db/queries'
import { formatDateLabel, formatTime, groupBy } from '../../lib/utils'
import type { DailyEntry, Moment } from '../../types'
import { MOMENT_COLORS } from '../../types'

interface HighlightItem {
  kind: 'moment' | 'commit'
  date: string
  sortKey: string
  moment?: Moment
  entry?: DailyEntry
}

function MomentCard({ moment, onClick }: { moment: Moment; onClick: () => void }) {
  const color = MOMENT_COLORS[moment.type] ?? '#AAAAAA'
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[16px] p-4 bg-white dark:bg-[#1E1E1E]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '3px solid ' + color }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[13px] font-medium capitalize" style={{ color }}>{moment.type}</span>
          <span className="text-[12px] text-[#AAAAAA]">{formatTime(moment.captured_at)}</span>
        </div>
        {moment.remember && <span className="text-[#FFD93D] text-[16px]">★</span>}
      </div>
      {moment.text && (
        <p className="text-[14px] text-[#333333] dark:text-[#CCCCCC] leading-relaxed line-clamp-3 mt-1">{moment.text}</p>
      )}
    </button>
  )
}

function CommitCard({ entry, onClick }: { entry: DailyEntry; onClick: () => void }) {
  const ev = entry.evening!
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[16px] p-4 bg-white dark:bg-[#1E1E1E]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '3px solid #7C4DFF' }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[13px] font-medium text-[#7C4DFF]">✦ Day committed</span>
        {ev.remember && <span className="text-[#FFD93D] text-[14px]">★</span>}
      </div>
      {ev.day_title && (
        <p className="font-display text-[16px] font-semibold text-[#111111] dark:text-[#F0F0F0] leading-snug mb-1">
          "{ev.day_title}"
        </p>
      )}
      {ev.commit_message && (
        <p className="font-mono text-[12px] text-[#666666] dark:text-[#999999] mb-2">{ev.commit_message}</p>
      )}
      <div className="flex items-center gap-3">
        {ev.spark !== undefined && (
          <span className="text-[12px] text-[#AAAAAA]">Spark <span className="text-[#7C4DFF] font-medium">{ev.spark}</span></span>
        )}
        {ev.mood !== undefined && (
          <span className="text-[12px] text-[#AAAAAA]">Mood <span className="text-[#FF6B6B] font-medium">{ev.mood}</span></span>
        )}
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
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414] flex items-center justify-center">
        <p className="text-[#AAAAAA] text-[14px]">Loading...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414] px-4 pt-14 pb-6">
        <h1 className="font-display text-[24px] font-semibold text-[#111111] dark:text-[#F0F0F0] mb-8">Highlights</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[40px] mb-4">✦</p>
          <p className="text-[15px] text-[#666666] dark:text-[#999999] leading-relaxed max-w-[240px]">
            Nothing remembered yet — tap ★ on any moment to keep it here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414] px-4 pt-14 pb-24">
      <h1 className="font-display text-[24px] font-semibold text-[#111111] dark:text-[#F0F0F0] mb-6">Highlights</h1>

      <div className="space-y-6">
        {dates.map(date => (
          <div key={date} className="space-y-3">
            <p className="text-[12px] font-medium text-[#AAAAAA] uppercase tracking-wide">{formatDateLabel(date)}</p>
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
