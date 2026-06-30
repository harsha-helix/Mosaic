import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTodayStore } from '../../store/today'
import { useAuthStore } from '../../store/auth'
import { getAllEntries, getAllMoments } from '../../lib/db/queries'
import { computeAverages, formatDateLabel } from '../../lib/utils'
import type { Moment } from '../../types'

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
      <span className="text-[15px] font-bold text-[#111111] dark:text-[#F0F0F0]">{value}</span>
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

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414] px-4 pt-12 pb-6 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-[28px] font-bold text-[#111111] dark:text-[#F0F0F0] leading-tight">
          {greeting.text} {greeting.emoji}
        </h1>
        <p className="text-[13px] text-[#AAAAAA] mt-1">{getTodayLabel()}</p>
      </div>

      {/* Quote card */}
      <div className="rounded-[16px] p-5 bg-white dark:bg-[#1E1E1E]" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <p className="font-display text-[15px] italic text-[#333333] dark:text-[#CCCCCC] leading-relaxed">
          "{quote}"
        </p>
      </div>

      {/* 7-day averages */}
      {hasAverages && (
        <div>
          <p className="text-[12px] font-medium text-[#AAAAAA] uppercase tracking-wide mb-2">Last 7 days</p>
          <div className="rounded-[16px] p-4 bg-white dark:bg-[#1E1E1E] flex flex-wrap gap-x-5 gap-y-2" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <AverageChip label="Spark"   value={averages!.spark}   color="#7C4DFF" />
            <AverageChip label="Mood"    value={averages!.mood}    color="#FF6B6B" />
            <AverageChip label="Energy"  value={averages!.energy}  color="#FFD93D" />
            <AverageChip label="Anxiety" value={averages!.anxiety} color="#A855F7" />
            {averages!.sleep !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-[#4D96FF]">Sleep</span>
                <span className="text-[15px] font-bold text-[#111111] dark:text-[#F0F0F0]">{averages!.sleep}h</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last beautiful thing */}
      {lastBeautiful && (
        <div
          className="rounded-[16px] p-4 bg-white dark:bg-[#1E1E1E] relative overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '3px solid #FFD93D' }}
        >
          <p className="text-[12px] font-medium text-[#FFD93D] uppercase tracking-wide mb-1">Last beautiful thing</p>
          <p className="text-[15px] text-[#111111] dark:text-[#F0F0F0] leading-relaxed line-clamp-2">{lastBeautiful.text}</p>
          <p className="text-[12px] text-[#AAAAAA] mt-1">{formatDateLabel(lastBeautiful.captured_at.slice(0, 10))}</p>
        </div>
      )}

      {/* Today status strip */}
      <div>
        <p className="text-[12px] font-medium text-[#AAAAAA] uppercase tracking-wide mb-2">Today</p>
        <div className="rounded-[16px] p-4 bg-white dark:bg-[#1E1E1E] flex items-center gap-3" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: morningDone ? '#7C4DFF' : '#E8E8E8' }} />
          <span className="text-[14px] text-[#666666] dark:text-[#999999]">Morning</span>
          <span className="text-[#E8E8E8] dark:text-[#2E2E2E]">&middot;</span>
          <span className="text-[14px] font-medium text-[#111111] dark:text-[#F0F0F0]">
            {momentCount} {momentCount === 1 ? 'moment' : 'moments'}
          </span>
          <span className="text-[#E8E8E8] dark:text-[#2E2E2E]">&middot;</span>
          <span className="text-[14px] text-[#666666] dark:text-[#999999]">Evening</span>
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: eveningDone ? '#7C4DFF' : '#E8E8E8' }} />
        </div>
      </div>

      {/* Morning banner */}
      {showMorningBanner && (
        <button
          onClick={() => navigate('/morning')}
          className="w-full rounded-[16px] p-4 text-left flex items-center justify-between active:scale-[0.98] transition-transform"
          style={{ backgroundColor: '#7C4DFF' }}
        >
          <span className="font-display font-semibold text-white text-[15px]">Start your morning</span>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">&rarr;</span>
            <button
              onClick={e => { e.stopPropagation(); setMorningDismissed(true) }}
              className="text-white/60 text-xl leading-none ml-2 p-1"
              aria-label="Dismiss"
            >&times;</button>
          </div>
        </button>
      )}

      {/* Evening banner */}
      {showEveningBanner && (
        <button
          onClick={() => navigate('/evening')}
          className="w-full rounded-[16px] p-4 text-left flex items-center justify-between active:scale-[0.98] transition-transform bg-[#1E1E1E] dark:bg-[#2A2A2A]"
        >
          <span className="font-display font-semibold text-white text-[15px]">Commit today before you sleep</span>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">&rarr;</span>
            <button
              onClick={e => { e.stopPropagation(); setEveningDismissed(true) }}
              className="text-white/60 text-xl leading-none ml-2 p-1"
              aria-label="Dismiss"
            >&times;</button>
          </div>
        </button>
      )}
    </div>
  )
}
