import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetricCircles } from '../../components/MetricCircles/MetricCircles'
import { useTodayStore } from '../../store/today'
import { saveEntry, getEntry } from '../../lib/db/queries'
import { pushEntry } from '../../lib/drive/operations'
import type { DailyEntry, MorningEntry } from '../../types'
import { METRIC_COLORS } from '../../types'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function todayLabel() {
  return new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function MorningScreen() {
  const navigate = useNavigate()
  const { entry, setEntry } = useTodayStore()

  const prevEveningHasSleep = !!entry?.evening?.sleep_hours
  const showSleep = !!entry?.evening?.submitted_at && !prevEveningHasSleep

  const [sleep, setSleep]       = useState<string>('')
  const [mood, setMood]         = useState<number | undefined>()
  const [energy, setEnergy]     = useState<number | undefined>()
  const [anxiety, setAnxiety]   = useState<number | undefined>()
  const [excitement, setExcitement] = useState<number | undefined>()
  const [intention, setIntention]   = useState('')
  const [priority, setPriority]     = useState('')
  const [notice, setNotice]         = useState('')
  const [saving, setSaving]         = useState(false)

  async function handleSave() {
    setSaving(true)
    const date = todayDate()

    const morning: MorningEntry = {
      submitted_at: new Date().toISOString(),
      ...(mood       !== undefined && { mood }),
      ...(energy     !== undefined && { energy }),
      ...(anxiety    !== undefined && { anxiety }),
      ...(excitement !== undefined && { excitement }),
      ...(intention.trim() && { intention: intention.trim() }),
      ...(priority.trim()  && { priority: priority.trim() }),
      ...(notice.trim()    && { notice: notice.trim() }),
    }

    // Load existing entry to preserve evening data
    const existing = await getEntry(date)
    const updated: DailyEntry = {
      ...(existing ?? { date }),
      date,
      morning,
      // If sleep was entered, write it back into prev evening
      ...(showSleep && sleep ? {
        evening: { ...entry?.evening, sleep_hours: parseFloat(sleep) } as DailyEntry['evening'],
      } : {}),
    }

    await saveEntry(updated)
    setEntry(updated)

    // Background Drive sync
    pushEntry(updated).catch(console.warn)

    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414]">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-14 pb-4">
        <button
          onClick={() => navigate('/')}
          className="text-[#7C4DFF] text-[15px] font-medium"
        >
          ←
        </button>
        <div>
          <h1 className="font-display text-[22px] font-semibold text-[#111111] dark:text-[#F0F0F0]">
            Morning
          </h1>
          <p className="text-[13px] text-[#AAAAAA]">{todayLabel()}</p>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-6">
        {/* Sleep (conditional) */}
        {showSleep && (
          <div className="space-y-2">
            <p className="text-[13px] text-[#AAAAAA]">Sleep from last night</p>
            <p className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">
              How long did you sleep?
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={sleep}
                onChange={e => setSleep(e.target.value)}
                placeholder="7.5"
                step="0.5"
                min="0"
                max="24"
                className="w-28 px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] text-[15px] outline-none focus:border-[#7C4DFF]"
              />
              <span className="text-[15px] text-[#666666]">hours</span>
            </div>
            <hr className="border-[#E8E8E8] dark:border-[#2E2E2E] mt-4" />
          </div>
        )}

        {/* Metrics */}
        <MetricCircles label="Mood"       value={mood}       onChange={setMood}       color={METRIC_COLORS.mood} />
        <MetricCircles label="Energy"     value={energy}     onChange={setEnergy}     color={METRIC_COLORS.energy} />
        <MetricCircles label="Anxiety"    value={anxiety}    onChange={setAnxiety}    color={METRIC_COLORS.anxiety} />
        <MetricCircles label="Excitement" value={excitement} onChange={setExcitement} color={METRIC_COLORS.excitement} />

        <hr className="border-[#E8E8E8] dark:border-[#2E2E2E]" />

        {/* Text fields */}
        {[
          { label: "Today's intention", value: intention, set: setIntention, placeholder: "What do you want to do today?" },
          { label: "Today's priority",  value: priority,  set: setPriority,  placeholder: "The one thing that matters most" },
          { label: "One thing to notice today", value: notice, set: setNotice, placeholder: "Notice light, notice kindness…" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="space-y-2">
            <label className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">{label}</label>
            <textarea
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] text-[15px] outline-none focus:border-[#7C4DFF] resize-none transition-colors"
            />
          </div>
        ))}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-[999px] bg-[#7C4DFF] text-white font-display font-semibold text-[16px] disabled:opacity-60 active:scale-[0.98] transition-transform mt-2"
        >
          {saving ? 'Saving…' : 'Save morning'}
        </button>
      </div>
    </div>
  )
}
