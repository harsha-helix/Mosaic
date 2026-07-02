import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTodayStore } from '../../store/today'
import { useAuthStore } from '../../store/auth'
import { getEntriesInRange, getLatestMomentWhere } from '../../lib/db/queries'
import { computeAverages, formatDateLabel } from '../../lib/utils'
import type { Moment } from '../../types'
import { METRIC_COLORS, MOMENT_COLORS } from '../../types'
import { DayGlyph } from '../../components/DayGlyph/DayGlyph'
import { PhotoThumbnail } from '../../components/PhotoThumbnail/PhotoThumbnail'
import { useLightboxStore } from '../../store/lightbox'

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
  const openLightbox = useLightboxStore(s => s.open)
  const [morningDismissed, setMorningDismissed] = useState(false)
  const [eveningDismissed, setEveningDismissed] = useState(false)
  const [quote] = useState(() => FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)])
  const [averages, setAverages] = useState<ReturnType<typeof computeAverages> | null>(null)
  const [lastBeautiful, setLastBeautiful] = useState<Moment | null>(null)

  useEffect(() => {
    async function load() {
      // Bounded queries only (docs/11 D6): Home mounts on every app open, so
      // it must never scan full history — last 7 days of entries, and a
      // reverse-cursor walk that stops at the newest matching moment.
      const end = new Date().toISOString().slice(0, 10)
      const start = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
      const [entries, beautiful] = await Promise.all([
        getEntriesInRange(start, end),
        getLatestMomentWhere(m => (m.type === 'beautiful' || m.type === 'photo') && !!m.text),
      ])
      setAverages(computeAverages(entries))
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
    <div className="min-h-screen bg-base dark:bg-base-dark px-4 pt-12 pb-6 space-y-5 lg:space-y-0 lg:px-10 lg:pt-16 lg:pb-16 lg:max-w-[1120px] lg:mx-auto home-grid-lg">
      {/* Greeting */}
      <div className="area-greeting">
        <h1 className="font-display text-[28px] font-bold text-ink dark:text-ink-dark leading-tight">
          {greeting.text} {greeting.emoji}
        </h1>
        <p className="text-[13px] text-hint dark:text-hint-dark mt-1">{getTodayLabel()}</p>
      </div>

      {/* Quote card */}
      <div className="area-quote rounded-card p-5 bg-surface dark:bg-surface-dark shadow-card dark:shadow-card-dark">
        <p className="font-display text-[15px] italic text-muted dark:text-muted-dark leading-relaxed">
          "{quote}"
        </p>
      </div>

      {/* 7-day averages */}
      {hasAverages && (
        <div className="area-averages">
          <p className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide mb-2">Last 7 days</p>
          <div className="rounded-card p-4 bg-surface dark:bg-surface-dark shadow-card dark:shadow-card-dark flex flex-wrap gap-x-5 gap-y-2">
            <AverageChip label="Spark"   value={averages!.spark}   color={METRIC_COLORS.spark} />
            <AverageChip label="Mood"    value={averages!.mood}    color={METRIC_COLORS.mood} />
            <AverageChip label="Energy"  value={averages!.energy}  color={METRIC_COLORS.energy} />
            <AverageChip label="Anxiety" value={averages!.anxiety} color={METRIC_COLORS.anxiety} />
            {averages!.sleep !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium" style={{ color: 'var(--color-reflective)' }}>Sleep</span>
                <span className="text-[15px] font-bold text-ink dark:text-ink-dark">{averages!.sleep}h</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last beautiful thing */}
      {lastBeautiful && (
        <div
          className="area-lastbeautiful rounded-card p-4 bg-surface dark:bg-surface-dark shadow-card dark:shadow-card-dark relative overflow-hidden"
          style={{ borderLeft: '3px solid var(--color-warmth)' }}
        >
          <p className="text-[12px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-warmth)' }}>Last beautiful thing</p>
          {lastBeautiful.media_id && (
            <button
              type="button"
              onClick={() => openLightbox(lastBeautiful)}
              className="block w-full mb-2"
              aria-label="Open photo"
            >
              <PhotoThumbnail
                mediaId={lastBeautiful.media_id}
                className="w-full max-h-40 object-cover rounded-input"
              />
            </button>
          )}
          <p className="text-[15px] text-ink dark:text-ink-dark leading-relaxed line-clamp-2">{lastBeautiful.text}</p>
          <p className="text-[12px] text-hint dark:text-hint-dark mt-1">{formatDateLabel(lastBeautiful.captured_at.slice(0, 10))}</p>
        </div>
      )}

      {/* Today status strip */}
      <div className="area-today">
        <p className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide mb-2">Today</p>
        <div className="rounded-card p-4 bg-surface dark:bg-surface-dark shadow-card dark:shadow-card-dark flex items-center gap-3">
          {morningDone && morning ? (
            <DayGlyph mood={morning.mood} energy={morning.energy} anxiety={morning.anxiety} excitement={morning.excitement} size={22} />
          ) : (
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-hairline)' }} />
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
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: eveningDone ? 'var(--color-terracotta)' : 'var(--color-hairline)' }} />
        </div>
      </div>

      {/* Morning banner */}
      {showMorningBanner && (
        <button
          onClick={() => navigate('/morning')}
          className="area-morningbanner w-full rounded-card p-4 text-left flex items-center justify-between active:scale-[0.98] transition-transform"
          style={{ backgroundColor: 'var(--color-terracotta)' }}
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
          className="area-eveningbanner w-full rounded-card p-4 text-left flex items-center justify-between active:scale-[0.98] transition-transform bg-ink dark:bg-elevated-dark"
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
