import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTodayStore } from '../../store/today'
import { useAuthStore } from '../../store/auth'
import { getAllEntries, getAllMoments } from '../../lib/db/queries'
import { computeAverages, formatDateLabel } from '../../lib/utils'
import type { Moment } from '../../types'
import { METRIC_COLORS, MOMENT_COLORS } from '../../types'
import { DayGlyph } from '../../components/DayGlyph/DayGlyph'
import { PhotoThumbnail } from '../../components/PhotoThumbnail/PhotoThumbnail'

const FALLBACK_QUOTES = [
  "The goal is not to remember every day. The goal is to notice every day.",
  "Small commits. Big life.",
  "Every moment captured is a moment that won't fade.",
  "History is valuable. Notice yours.",
]

function getGreeting(name: string): { text: string; emoji: string } {
  const h = new Date().getHours() + new Date().getMinutes() / 60
  if (h < 12)   return { text: 'Good morning, ' + name, emoji: '☀️' }
  if (h < 17)   return { text: 'Hey, ' + name, emoji: '✌️' }
  if (h < 21.5) return { text: 'Good evening, ' + name, emoji: '🏙️' }
  return         { text: 'Still going, ' + name + '?', emoji: '🌙' }
}

function getTodayLabel() {
  return new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function AverageChip({ label, value, color }: { label: string; value: number | null; color: string }) {
  if (value === null) return null
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[13px] font-medium" style={{ color }}>{label}</span>
      <span className="text-[15px] font-bold text-ink dark:text-ink-dark">{value}</span>
    </div>
  )
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const { entry, moments } = useTodayStore()
  const { displayName } = useAuthStore()
  const [morningDismissed, setMorningDismissed] = useState(false)
  const [eveningDismissed, setEveningDismissed] = useState(false)
  const [quote] = useState(() => FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)])
  const [averages, setAverages] = useState<ReturnType<typeof computeAverages> | null>(null)
  const [lastBeautiful, setLastBeautiful] = useState<Moment | null>(null)

  useEffect(() => {
    async function load() {
      const [entries, allMoments] = await Promise.all([getAllEntries(), getAllMoments()])
      setAverages(computeAverages(entries))
      const beautiful = allMoments
        .filter(m => (m.type === 'beautiful' || m.type === 'photo') && m.text)
        .sort((a, b) => b.captured_at.localeCompare(a.captured_at))[0] ?? null
      setLastBeautiful(beautiful)
    }
    load()
  }, [])

  const greeting = getGreeting(displayName || 'there')
  const morningDone = !!entry?.morning?.submitted_at
  const eveningDone = !!entry?.evening?.submitted_at
  const momentCount = moments.length
  const hour = new Date().getHours() + new Date().getMinutes() / 60

  const showMorningBanner = !morningDone && !morningDismissed
  const showEveningBanner = morningDone && !eveningDone && hour >= 20 && !eveningDismissed

  const hasAverages = averages && Object.values(averages).some(v => v !== null)

  const morning = entry?.morning

  return (
    <div className="min-h-screen bg-base dark:bg-base-dark px-4 pt-12 pb-6 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-[28px] font-bold text-ink dark:text-ink-dark leading-tight">
          {greeting.text} {greeting.emoji}
        </h1>
        <p className="text-[13px] text-hint dark:text-hint-dark mt-1">{getTodayLabel()}</p>
      </div>

      {/* Quote card */}
      <div className="rounded-card p-5 bg-surface dark:bg-surface-dark" style={{ boxShadow: '0 2px 12px rgba(43,36,32,0.08)' }}>
        <p className="font-display text-[15px] italic text-muted dark:text-muted-dark leading-relaxed">
          "{quote}"
        </p>
      </div>

      {/* 7-day averages */}
      {hasAverages && (
        <div>
          <p className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide mb-2">Last 7 days</p>
          <div className="rounded-card p-4 bg-surface dark:bg-surface-dark flex flex-wrap gap-x-5 gap-y-2" style={{ boxShadow: '0 2px 12px rgba(43,36,32,0.08)' }}>
            <AverageChip label="Spark"   value={averages!.spark}   color={METRIC_COLORS.spark} />
            <AverageChip label="Mood"    value={averages!.mood}    color={METRIC_COLORS.mood} />
            <AverageChip label="Energy"  value={averages!.energy}  color={METRIC_COLORS.energy} />
            <AverageChip label="Anxiety" value={averages!.anxiety} color={METRIC_COLORS.anxiety} />
            {averages!.sleep !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium" style={{ color: '#5B7B7A' }}>Sleep</span>
                <span className="text-[15px] font-bold text-ink dark:text-ink-dark">{averages!.sleep}h</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last beautiful thing */}
      {lastBeautiful && (
        <div
          className="rounded-card p-4 bg-surface dark:bg-surface-dark relative overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(43,36,32,0.08)', borderLeft: '3px solid #C9A24B' }}
        >
          <p className="text-[12px] font-medium uppercase tracking-wide mb-1" style={{ color: '#C9A24B' }}>Last beautiful thing</p>
          {lastBeautiful.media_id && (
            <PhotoThumbnail
              mediaId={lastBeautiful.media_id}
              className="w-full max-h-40 object-cover rounded-input mb-2"
            />
          )}
          <p className="text-[15px] text-ink dark:text-ink-dark leading-relaxed line-clamp-2">{lastBeautiful.text}</p>
          <p className="text-[12px] text-hint dark:text-hint-dark mt-1">{formatDateLabel(lastBeautiful.captured_at.slice(0, 10))}</p>
        </div>
      )}

      {/* Today status strip */}
      <div>
        <p className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide mb-2">Today</p>
        <div className="rounded-card p-4 bg-surface dark:bg-surface-dark flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(43,36,32,0.08)' }}>
          {morningDone && morning ? (
            <DayGlyph mood={morning.mood} energy={morning.energy} anxiety={morning.anxiety} excitement={morning.excitement} size={22} />
          ) : (
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#E5D9C6' }} />
          )}
          <span className="text-[14px] text-muted dark:text-muted-dark flex-shrink-0">Morning</span>
          <span className="text-hairline dark:text-hairline-dark flex-shrink-0">&middot;</span>

          {/* Today mosaic tile strip — one colored tile per moment captured
              today, in capture order. Replaces the plain "N moments" count
              (spec §4: "Instant visual — Mosaic tile"). Scrolls horizontally
              past ~12 tiles; empty when nothing's been captured yet. */}
          <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar py-1" aria-label={`${momentCount} ${momentCount === 1 ? 'moment' : 'moments'} today`}>
            {moments.map(m => (
              <motion.div
                key={m.id}
                layoutId={`mosaic-tile-${m.id}`}
                className="w-4 h-4 rounded-[4px] flex-shrink-0"
                style={{ backgroundColor: MOMENT_COLORS[m.type] }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              />
            ))}
          </div>

          <span className="text-hairline dark:text-hairline-dark flex-shrink-0">&middot;</span>
          <span className="text-[14px] text-muted dark:text-muted-dark flex-shrink-0">Evening</span>
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: eveningDone ? '#C1633D' : '#E5D9C6' }} />
        </div>
      </div>

      {/* Morning banner */}
      {showMorningBanner && (
        <button
          onClick={() => navigate('/morning')}
          className="w-full rounded-card p-4 text-left flex items-center justify-between active:scale-[0.98] transition-transform"
          style={{ backgroundColor: '#C1633D' }}
        >
          <span className="font-display font-semibold text-[15px]" style={{ color: '#3D1F12' }}>Start your morning</span>
          <div className="flex items-center gap-2">
            <span className="text-lg" style={{ color: '#3D1F12' }}>&rarr;</span>
            <button
              onClick={e => { e.stopPropagation(); setMorningDismissed(true) }}
              className="text-xl leading-none ml-2 p-1"
              style={{ color: 'rgba(61,31,18,0.6)' }}
              aria-label="Dismiss"
            >&times;</button>
          </div>
        </button>
      )}

      {/* Evening banner */}
      {showEveningBanner && (
        <button
          onClick={() => navigate('/evening')}
          className="w-full rounded-card p-4 text-left flex items-center justify-between active:scale-[0.98] transition-transform bg-ink dark:bg-elevated-dark"
        >
          <span className="font-display font-semibold text-ink-dark text-[15px]">Commit today before you sleep</span>
          <div className="flex items-center gap-2">
            <span className="text-ink-dark text-lg">&rarr;</span>
            <button
              onClick={e => { e.stopPropagation(); setEveningDismissed(true) }}
              className="text-xl leading-none ml-2 p-1 opacity-60 text-ink-dark"
              aria-label="Dismiss"
            >&times;</button>
          </div>
        </button>
      )}
    </div>
  )
}
