import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEntry, getMoments } from '../../lib/db/queries'
import { formatDateLabel } from '../../lib/utils'
import type { DailyEntry, Moment } from '../../types'
import { METRIC_COLORS } from '../../types'
import { MomentCard } from '../../components/MomentCard/MomentCard'
import { DayGlyph } from '../../components/DayGlyph/DayGlyph'

function MetricChip({ label, value, color, suffix = '' }: { label: string; value: number | undefined; color: string; suffix?: string }) {
  if (value === undefined) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[12px] font-medium"
      style={{ backgroundColor: color + '1A', color }}
    >
      {label} {value}{suffix}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-hairline dark:bg-hairline-dark" />
      <span className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-hairline dark:bg-hairline-dark" />
    </div>
  )
}

function ReflectionRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div className="space-y-1">
      <p className="text-[12px] font-medium text-hint dark:text-hint-dark uppercase tracking-wide">{label}</p>
      <p className="text-[14px] text-muted dark:text-muted-dark leading-relaxed">{value}</p>
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
      <div className="min-h-screen bg-base dark:bg-base-dark flex items-center justify-center">
        <p className="text-hint dark:text-hint-dark text-[14px]">Loading...</p>
      </div>
    )
  }

  const m = entry?.morning
  const hasGlyph = !!m && (m.mood !== undefined || m.energy !== undefined || m.anxiety !== undefined || m.excitement !== undefined)

  return (
    <div className="min-h-screen bg-base dark:bg-base-dark">
      {/* Header */}
      <div className="px-4 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="text-terracotta text-[15px] font-medium mb-3 block">
          &larr; Back
        </button>
        <div className="flex items-start gap-3">
          {hasGlyph && <DayGlyph mood={m!.mood} energy={m!.energy} anxiety={m!.anxiety} excitement={m!.excitement} size={44} className="flex-shrink-0 mt-0.5" />}
          <div>
            <p className="text-[13px] text-hint dark:text-hint-dark">{dayLabel} &middot; {weekday}</p>
            {entry?.evening?.day_title && (
              <h1 className="font-display text-[24px] font-bold text-ink dark:text-ink-dark leading-tight mt-1">
                "{entry.evening.day_title}"
              </h1>
            )}
          </div>
        </div>
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
              <MetricChip label="Excitement" value={entry.morning.excitement} color={METRIC_COLORS.excitement} />
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
          <p className="text-[13px] text-hint dark:text-hint-dark text-center py-4">A quiet day. Nothing captured.</p>
        ) : (
          <div className="space-y-2">
            {moments.map((m, i) => <MomentCard key={i} moment={m} variant="compact" dateFormat="time" />)}
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
                <MetricChip label="Exercise" value={entry.evening.exercise.minutes} color="#7A8B5C" suffix="m" />
              )}
              <MetricChip label="Reading"   value={entry.evening.reading_minutes}  color="#5B7B7A" suffix="m" />
              <MetricChip label="Deep work" value={entry.evening.deep_work_hours}  color="#C1633D" suffix="h" />
            </div>
            <div className="space-y-3">
              <ReflectionRow label="Biggest win"       value={entry.evening.biggest_win} />
              <ReflectionRow label="Biggest challenge" value={entry.evening.biggest_challenge} />
              <ReflectionRow label="Energised by"      value={entry.evening.energised_by} />
              <ReflectionRow label="Drained by"        value={entry.evening.drained_by} />
              <ReflectionRow label="Journal"           value={entry.evening.journal} />
            </div>

            {entry.evening.commit_message && (
              <div className="mt-4 p-3 rounded-input bg-elevated dark:bg-elevated-dark">
                <p className="font-mono text-[13px] text-muted dark:text-muted-dark">
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
