import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetricCircles } from '../../components/MetricCircles/MetricCircles'
import { DayGlyph } from '../../components/DayGlyph/DayGlyph'
import { useTodayStore } from '../../store/today'
import { saveEntry, getEntry, enqueueSyncItem } from '../../lib/db/queries'
import { pushEntry } from '../../lib/drive/operations'
import { silentSignIn } from '../../lib/drive/client'
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

  const [sleep, setSleep]           = useState<string>('')
  const [mood, setMood]             = useState<number | undefined>()
  const [energy, setEnergy]         = useState<number | undefined>()
  const [anxiety, setAnxiety]       = useState<number | undefined>()
  const [excitement, setExcitement] = useState<number | undefined>()
  const [intention, setIntention]   = useState('')
  const [priority, setPriority]     = useState('')
  const [notice, setNotice]         = useState('')
  const [saving, setSaving]         = useState(false)
  const [showGlyph, setShowGlyph]   = useState(false)

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

    const existing = await getEntry(date)
    const updated: DailyEntry = {
      ...(existing ?? { date }),
      date,
      morning,
      ...(showSleep && sleep ? {
        evening: { ...entry?.evening, sleep_hours: parseFloat(sleep) } as DailyEntry['evening'],
      } : {}),
    }

    await saveEntry(updated)
    setEntry(updated)

    // Background Drive sync — token obtained lazily here, not on reload.
    // On failure, queue it for retry on next app open / reconnect.
    silentSignIn()
      .then(() => pushEntry(updated))
      .catch(() => enqueueSyncItem('entry', 'entries/' + updated.date + '.json', JSON.stringify(updated)))

    // Instant visual — Day Glyph pops in where the button was, holds briefly,
    // then we navigate home (spec §3: "Instant visual — Day Glyph").
    const anyMetric = mood !== undefined || energy !== undefined || anxiety !== undefined || excitement !== undefined
    if (anyMetric) {
      setShowGlyph(true)
      setTimeout(() => navigate('/', { replace: true }), 850)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-base dark:bg-base-dark lg:flex lg:items-center lg:justify-center lg:py-12 lg:px-6">
      <div className="lg:w-full lg:max-w-[600px] lg:bg-surface lg:dark:bg-surface-dark lg:rounded-card lg:shadow-card lg:dark:shadow-card-dark lg:overflow-hidden">
      <div className="flex items-center gap-4 px-4 pt-14 pb-4 lg:pt-8 lg:px-8 lg:pb-2">
        <button onClick={() => navigate('/')} className="text-terracotta text-[15px] font-medium">←</button>
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink dark:text-ink-dark">Morning</h1>
          <p className="text-[13px] text-hint dark:text-hint-dark">{todayLabel()}</p>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-6 lg:px-8 lg:pb-8">
        {showSleep && (
          <div className="space-y-2">
            <p className="text-[13px] text-hint dark:text-hint-dark">Sleep from last night</p>
            <p className="text-[15px] font-medium text-ink dark:text-ink-dark">How long did you sleep?</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={sleep}
                onChange={e => setSleep(e.target.value)}
                placeholder="7.5"
                step="0.5"
                min="0"
                max="24"
                className="w-28 px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[15px] outline-none focus:border-terracotta"
              />
              <span className="text-[15px] text-muted dark:text-muted-dark">hours</span>
            </div>
            <hr className="border-hairline dark:border-hairline-dark mt-4" />
          </div>
        )}

        <MetricCircles label="Mood"       value={mood}       onChange={setMood}       color={METRIC_COLORS.mood} />
        <MetricCircles label="Energy"     value={energy}     onChange={setEnergy}     color={METRIC_COLORS.energy} />
        <MetricCircles label="Anxiety"    value={anxiety}    onChange={setAnxiety}    color={METRIC_COLORS.anxiety} />
        <MetricCircles label="Excitement" value={excitement} onChange={setExcitement} color={METRIC_COLORS.excitement} />

        <hr className="border-hairline dark:border-hairline-dark" />

        {[
          { label: "Today's intention", value: intention, set: setIntention, placeholder: "What do you want to do today?" },
          { label: "Today's priority",  value: priority,  set: setPriority,  placeholder: "The one thing that matters most" },
          { label: "One thing to notice today", value: notice, set: setNotice, placeholder: "Notice light, notice kindness…" },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="space-y-2">
            <label className="text-[15px] font-medium text-ink dark:text-ink-dark">{label}</label>
            <textarea
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="w-full px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[15px] outline-none focus:border-terracotta resize-none transition-colors"
            />
          </div>
        ))}

        {showGlyph ? (
          <div className="w-full py-4 flex items-center justify-center mt-2">
            <DayGlyph mood={mood} energy={energy} anxiety={anxiety} excitement={excitement} size={72} animate />
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-btn bg-terracotta font-display font-semibold text-[16px] disabled:opacity-60 active:scale-[0.98] transition-transform mt-2"
            style={{ color: '#3D1F12', boxShadow: 'inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)' }}
          >
            {saving ? 'Saving…' : 'Save morning'}
          </button>
        )}
      </div>
      </div>
    </div>
  )
}
