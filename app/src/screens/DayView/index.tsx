import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEntry, getMoments } from '../../lib/db/queries'
import { formatDateLabel, formatTime } from '../../lib/utils'
import type { DailyEntry, Moment } from '../../types'
import { MOMENT_COLORS, METRIC_COLORS } from '../../types'

function MetricChip({ label, value, color, suffix = '' }: { label: string; value: number | undefined; color: string; suffix?: string }) {
  if (value === undefined) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[999px] text-[12px] font-medium"
      style={{ backgroundColor: color + '1A', color }}
    >
      {label} {value}{suffix}
    </span>
  )
}

function CompactMomentCard({ moment }: { moment: Moment }) {
  const color = MOMENT_COLORS[moment.type] ?? '#AAAAAA'
  return (
    <div
      className="rounded-[12px] p-3 bg-white dark:bg-[#1E1E1E]"
      style={{ borderLeft: '3px solid ' + color }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[12px] font-medium capitalize" style={{ color }}>{moment.type}</span>
          <span className="text-[11px] text-[#AAAAAA]">{formatTime(moment.captured_at)}</span>
        </div>
        {moment.remember && <span className="text-[#FFD93D] text-[14px]">★</span>}
      </div>
      {moment.text && (
        <p className="text-[13px] text-[#333333] dark:text-[#CCCCCC] leading-relaxed mt-1 line-clamp-2">{moment.text}</p>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[#E8E8E8] dark:bg-[#2E2E2E]" />
      <span className="text-[12px] font-medium text-[#AAAAAA] uppercase tracking-wide whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-[#E8E8E8] dark:bg-[#2E2E2E]" />
    </div>
  )
}

function ReflectionRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-[12px] font-medium text-[#AAAAAA] uppercase tracking-wide">{label}</p>
      <p className="text-[14px] text-[#333333] dark:text-[#CCCCCC] leading-relaxed">{value}</p>
    </div>
  )
}

export default function DayViewScreen() {
  const navigate = useNavigate()
  const { date } = useParams<{ date: string }>()
  const [entry, setEntry] = useState<DailyEntry | null>(null)
  const [moments, setMoments] = useState<Moment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!date) return
    async function load() {
      const [e, m] = await Promise.all([getEntry(date!), getMoments(date!)])
      setEntry(e ?? null)
      setMoments(m)
      setLoading(false)
    }
    load()
  }, [date])

  const dayLabel = date ? formatDateLabel(date) : ''
  const weekday = date ? new Date(date + 'T00:00:00').toLocaleDateString([], { weekday: 'long' }) : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414] flex items-center justify-center">
        <p className="text-[#AAAAAA] text-[14px]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414]">
      {/* Header */}
      <div className="px-4 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="text-[#7C4DFF] text-[15px] font-medium mb-3 block">
          &larr; Back
        </button>
        <p className="text-[13px] text-[#AAAAAA]">{dayLabel} &middot; {weekday}</p>
        {entry?.evening?.day_title && (
          <h1 className="font-display text-[24px] font-bold text-[#111111] dark:text-[#F0F0F0] leading-tight mt-1">
            "{entry.evening.day_title}"
          </h1>
        )}
      </div>

      <div className="px-4 pb-24 space-y-2">
        {/* Morning */}
        {entry?.morning && (
          <>
            <SectionLabel>Morning</SectionLabel>
            <div className="flex flex-wrap gap-2 mb-3">
              <MetricChip label="Mood"       value={entry.morning.mood}       color={METRIC_COLORS.mood} />
              <MetricChip label="Energy"     value={entry.morning.energy}     color={METRIC_COLORS.energy} />
              <MetricChip label="Anxiety"    value={entry.morning.anxiety}    color={METRIC_COLORS.anxiety} />
              <MetricChip label="Excitement" value={entry.morning.excitement} color="#6BCB77" />
            </div>
            <div className="space-y-3">
              <ReflectionRow label="Intention" value={entry.morning.intention} />
              <ReflectionRow label="Priority"  value={entry.morning.priority} />
              <ReflectionRow label="Notice"    value={entry.morning.notice} />
            </div>
          </>
        )}

        {/* Moments */}
        <SectionLabel>Moments ({moments.length})</SectionLabel>
        {moments.length === 0 ? (
          <p className="text-[13px] text-[#AAAAAA] text-center py-4">A quiet day. Nothing captured.</p>
        ) : (
          <div className="space-y-2">
            {moments.map((m, i) => <CompactMomentCard key={i} moment={m} />)}
          </div>
        )}

        {/* Evening */}
        {entry?.evening && (
          <>
            <SectionLabel>Evening</SectionLabel>
            <div className="flex flex-wrap gap-2 mb-3">
              <MetricChip label="Spark" value={entry.evening.spark}            color={METRIC_COLORS.spark} />
              <MetricChip label="Mood"  value={entry.evening.mood}             color={METRIC_COLORS.mood} />
              {entry.evening.exercise?.done && (
                <MetricChip label="Exercise" value={entry.evening.exercise.minutes} color="#6BCB77" suffix="m" />
              )}
              <MetricChip label="Reading"   value={entry.evening.reading_minutes}  color="#06B6D4" suffix="m" />
              <MetricChip label="Deep work" value={entry.evening.deep_work_hours}  color="#7C4DFF" suffix="h" />
            </div>
            <div className="space-y-3">
              <ReflectionRow label="Biggest win"       value={entry.evening.biggest_win} />
              <ReflectionRow label="Biggest challenge" value={entry.evening.biggest_challenge} />
              <ReflectionRow label="Energised by"      value={entry.evening.energised_by} />
              <ReflectionRow label="Drained by"        value={entry.evening.drained_by} />
              <ReflectionRow label="Journal"           value={entry.evening.journal} />
            </div>

            {entry.evening.commit_message && (
              <div className="mt-4 p-3 rounded-[12px] bg-[#F4F4F2] dark:bg-[#1E1E1E]">
                <p className="font-mono text-[13px] text-[#555555] dark:text-[#999999]">
                  &gt; {entry.evening.commit_message}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
