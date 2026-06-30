import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetricCircles } from '../../components/MetricCircles/MetricCircles'
import { RememberToggle } from '../../components/RememberToggle/RememberToggle'
import { useTodayStore } from '../../store/today'
import { saveEntry, getEntry } from '../../lib/db/queries'
import { pushEntry } from '../../lib/drive/operations'
import type { DailyEntry, EveningEntry } from '../../types'
import { METRIC_COLORS } from '../../types'

function todayDate() { return new Date().toISOString().slice(0, 10) }
function todayLabel() {
  return new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

function CommitCeremony({ message, date, onDone }: { message: string; date: string; onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  const allLines = [
    '> committing ' + date + '...',
    ...(message.trim() ? ['> ' + message.trim()] : []),
    '> checkmark day committed',
  ]

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setLines(prev => [...prev, allLines[i]])
      i++
      if (i >= allLines.length) {
        clearInterval(interval)
        setTimeout(() => setShowConfetti(true), 300)
        setTimeout(onDone, 1800)
      }
    }, 400)
    return () => clearInterval(interval)
  })

  return (
    <div className="fixed inset-0 z-50 bg-[#141414] flex flex-col items-center justify-center px-8">
      <div className="w-full max-w-sm space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="font-mono text-[14px] text-green-400 leading-relaxed">{line}</p>
        ))}
      </div>
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {['#7C4DFF','#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#EC4899'].flatMap((c, i) =>
            Array.from({ length: 8 }, (_, j) => (
              <div
                key={i + '-' + j}
                className="absolute w-2 h-2 rounded-sm opacity-90"
                style={{
                  backgroundColor: c,
                  left: (10 + (i * 14 + j * 7) % 80) + '%',
                  top: '-10%',
                  animation: 'fall ' + (0.8 + (i + j) * 0.15) + 's ease-in ' + (i + j) * 0.05 + 's forwards',
                }}
              />
            ))
          )}
        </div>
      )}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }`}</style>
    </div>
  )
}

export default function EveningScreen() {
  const navigate = useNavigate()
  const { setEntry } = useTodayStore()

  const [spark, setSpark] = useState<number | undefined>()
  const [mood, setMood]   = useState<number | undefined>()
  const [exerciseDone, setExerciseDone] = useState<boolean | null>(null)
  const [exerciseMins, setExerciseMins] = useState('')
  const [readingMins, setReadingMins]   = useState('')
  const [deepWorkHrs, setDeepWorkHrs]   = useState('')
  const [biggestWin, setBiggestWin]         = useState('')
  const [biggestChallenge, setBiggestChallenge] = useState('')
  const [energisedBy, setEnergisedBy]   = useState('')
  const [drainedBy, setDrainedBy]       = useState('')
  const [journal, setJournal]           = useState('')
  const [dayTitle, setDayTitle]         = useState('')
  const [commitMsg, setCommitMsg]       = useState('')
  const [remember, setRemember]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [ceremony, setCeremony]         = useState(false)

  async function handleCommit() {
    setSaving(true)
    const date = todayDate()

    const evening: EveningEntry = {
      submitted_at: new Date().toISOString(),
      ...(spark !== undefined && { spark }),
      ...(mood  !== undefined && { mood }),
      ...(exerciseDone !== null && {
        exercise: {
          done: exerciseDone,
          ...(exerciseDone && exerciseMins ? { minutes: parseInt(exerciseMins) } : {}),
        },
      }),
      ...(readingMins && { reading_minutes: parseInt(readingMins) }),
      ...(deepWorkHrs && { deep_work_hours: parseFloat(deepWorkHrs) }),
      ...(biggestWin.trim()       && { biggest_win: biggestWin.trim() }),
      ...(biggestChallenge.trim() && { biggest_challenge: biggestChallenge.trim() }),
      ...(energisedBy.trim()      && { energised_by: energisedBy.trim() }),
      ...(drainedBy.trim()        && { drained_by: drainedBy.trim() }),
      ...(journal.trim()          && { journal: journal.trim() }),
      ...(dayTitle.trim()         && { day_title: dayTitle.trim() }),
      ...(commitMsg.trim()        && { commit_message: commitMsg.trim() }),
      ...(remember                && { remember: true }),
    }

    const existing = await getEntry(date)
    const updated: DailyEntry = { ...(existing ?? { date }), date, evening }

    await saveEntry(updated)
    setEntry(updated)
    pushEntry(updated).catch(console.warn)

    setSaving(false)
    setCeremony(true)
  }

  if (ceremony) {
    return (
      <CommitCeremony
        message={commitMsg}
        date={todayDate()}
        onDone={() => navigate('/', { replace: true })}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414]">
      <div className="flex items-center gap-4 px-4 pt-14 pb-4">
        <button onClick={() => navigate('/')} className="text-[#7C4DFF] text-[15px] font-medium">back</button>
        <div>
          <h1 className="font-display text-[22px] font-semibold text-[#111111] dark:text-[#F0F0F0]">Commit the day</h1>
          <p className="text-[13px] text-[#AAAAAA]">{todayLabel()}</p>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-6">
        <p className="text-[15px] text-[#666666] dark:text-[#999999]">How was the day, overall?</p>

        <MetricCircles label="Spark" value={spark} onChange={setSpark} color={METRIC_COLORS.spark} />
        <MetricCircles label="Mood"  value={mood}  onChange={setMood}  color={METRIC_COLORS.mood} />

        <hr className="border-[#E8E8E8] dark:border-[#2E2E2E]" />
        <p className="font-display text-[16px] font-semibold text-[#111111] dark:text-[#F0F0F0]">The numbers</p>

        <div className="space-y-2">
          <label className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">Exercise</label>
          <div className="flex items-center gap-3">
            {([true, false] as const).map(v => (
              <button
                key={String(v)}
                onClick={() => setExerciseDone(v)}
                className="px-5 py-2 rounded-[12px] text-[14px] font-medium border-2 transition-all"
                style={{
                  borderColor: exerciseDone === v ? '#7C4DFF' : '#E8E8E8',
                  backgroundColor: exerciseDone === v ? '#7C4DFF15' : 'transparent',
                  color: exerciseDone === v ? '#7C4DFF' : '#666666',
                }}
              >
                {v ? 'Yes' : 'No'}
              </button>
            ))}
            {exerciseDone && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={exerciseMins}
                  onChange={e => setExerciseMins(e.target.value)}
                  placeholder="0"
                  className="w-16 px-3 py-2 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] text-[14px] outline-none focus:border-[#7C4DFF] text-center"
                />
                <span className="text-[13px] text-[#666666]">mins</span>
              </div>
            )}
          </div>
        </div>

        {[
          { label: 'Reading', value: readingMins, set: setReadingMins, unit: 'minutes' },
          { label: 'Deep Work', value: deepWorkHrs, set: setDeepWorkHrs, unit: 'hours' },
        ].map(({ label, value, set, unit }) => (
          <div key={label} className="space-y-2">
            <label className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">{label}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                placeholder="0"
                className="w-24 px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] text-[15px] outline-none focus:border-[#7C4DFF]"
              />
              <span className="text-[13px] text-[#666666]">{unit}</span>
            </div>
          </div>
        ))}

        <hr className="border-[#E8E8E8] dark:border-[#2E2E2E]" />
        <p className="font-display text-[16px] font-semibold text-[#111111] dark:text-[#F0F0F0]">Reflect</p>

        {[
          { label: 'Biggest win',         value: biggestWin,       set: setBiggestWin,       ph: 'What went well?' },
          { label: 'Biggest challenge',   value: biggestChallenge, set: setBiggestChallenge, ph: 'What was hard?' },
          { label: 'What energised you?', value: energisedBy,      set: setEnergisedBy,      ph: 'What gave you energy?' },
          { label: 'What drained you?',   value: drainedBy,        set: setDrainedBy,        ph: 'What cost you energy?' },
          { label: 'One sentence',        value: journal,          set: setJournal,          ph: 'The day in one sentence...' },
        ].map(({ label, value, set, ph }) => (
          <div key={label} className="space-y-2">
            <label className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">{label}</label>
            <textarea
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={ph}
              rows={2}
              className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] text-[15px] outline-none focus:border-[#7C4DFF] resize-none"
            />
          </div>
        ))}

        <hr className="border-[#E8E8E8] dark:border-[#2E2E2E]" />

        <div className="space-y-2">
          <label className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">Name this day</label>
          <input
            type="text"
            value={dayTitle}
            onChange={e => setDayTitle(e.target.value)}
            placeholder="Day title"
            className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] text-[15px] outline-none focus:border-[#7C4DFF]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">Commit message</label>
          <input
            type="text"
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder="feat: ..."
            className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] text-[13px] font-mono outline-none focus:border-[#7C4DFF]"
          />
        </div>

        <RememberToggle value={remember} onChange={setRemember} />

        <button
          onClick={handleCommit}
          disabled={saving}
          className="w-full py-4 rounded-[999px] bg-[#7C4DFF] text-white font-display font-bold text-[18px] disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {saving ? 'Committing...' : 'Commit'}
        </button>
      </div>
    </div>
  )
}
