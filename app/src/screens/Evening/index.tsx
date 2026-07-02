import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MetricCircles } from '../../components/MetricCircles/MetricCircles'
import { RememberToggle } from '../../components/RememberToggle/RememberToggle'
import { useTodayStore } from '../../store/today'
import { saveEntry, getEntry, enqueueSyncItem } from '../../lib/db/queries'
import { pushEntry } from '../../lib/drive/operations'
import { silentSignIn } from '../../lib/drive/client'
import type { DailyEntry, EveningEntry } from '../../types'
import { METRIC_COLORS } from '../../types'

function todayDate() { return new Date().toISOString().slice(0, 10) }
function todayLabel() {
  return new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

// Concept B "warmer terminal" (docs/16 §7): keeps the git-inspired beat
// structure and pacing (pulse → fade to dark → typed commit message →
// confetti → slide down to Home) but drops the literal green-on-black
// terminal skin for the app's own dark-theme tokens, and types
// character-by-character instead of a full line every 400ms.
function CommitCeremony({ message, date, onDone }: { message: string; date: string; onDone: () => void }) {
  const [charCount, setCharCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const fullText = [
    '> committing ' + date + '...',
    ...(message.trim() ? ['> ' + message.trim()] : []),
    '> ✓ day committed',
  ].join('\n')

  useEffect(() => {
    const interval = setInterval(() => {
      setCharCount(c => {
        const next = c + 1
        if (next >= fullText.length) {
          clearInterval(interval)
          setTimeout(() => setShowConfetti(true), 300)
          setTimeout(onDone, 1800)
        }
        return next
      })
    }, 16)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-base-dark flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="w-full max-w-sm">
        <p className="font-mono text-[14px] text-ink-dark leading-relaxed whitespace-pre-wrap">
          {fullText.slice(0, charCount)}
          {charCount < fullText.length && <span className="text-warmth">▍</span>}
        </p>
      </div>
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Ceremony backdrop is always dark regardless of app theme (it's
              a deliberate "terminal" moment), so confetti always uses the
              brighter dark-mode accent variants for visibility. */}
          {['#F3915C','#F4CB70','#A8C17E','#8FC0BC','#C793AF'].flatMap((c, i) =>
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
    </motion.div>
  )
}

export default function EveningScreen() {
  const navigate = useNavigate()
  const { setEntry } = useTodayStore()

  const [spark, setSpark]                   = useState<number | undefined>()
  const [mood, setMood]                     = useState<number | undefined>()
  const [exerciseDone, setExerciseDone]     = useState<boolean | null>(null)
  const [exerciseMins, setExerciseMins]     = useState('')
  const [readingMins, setReadingMins]       = useState('')
  const [deepWorkHrs, setDeepWorkHrs]       = useState('')
  const [biggestWin, setBiggestWin]         = useState('')
  const [biggestChallenge, setBiggestChallenge] = useState('')
  const [energisedBy, setEnergisedBy]       = useState('')
  const [drainedBy, setDrainedBy]           = useState('')
  const [journal, setJournal]               = useState('')
  const [dayTitle, setDayTitle]             = useState('')
  const [commitMsg, setCommitMsg]           = useState('')
  const [remember, setRemember]             = useState(false)
  const [saving, setSaving]                 = useState(false)
  const [pulsing, setPulsing]               = useState(false)
  const [ceremony, setCeremony]             = useState(false)

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

    // Background Drive sync — token obtained lazily here, not on reload.
    // On failure, queue it for retry on next app open / reconnect.
    silentSignIn()
      .then(() => pushEntry(updated))
      .catch(() => enqueueSyncItem('entry', 'entries/' + updated.date + '.json', JSON.stringify(updated)))

    // Lead-in beat (docs/16 §7): button pulses briefly before the screen
    // hands off to the full-screen ceremony, instead of cutting straight to
    // it. saving stays true through the pulse so the button doesn't flash
    // back to its idle label for one frame.
    setPulsing(true)
    setTimeout(() => setCeremony(true), 260)
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
    <div className="min-h-screen bg-base dark:bg-base-dark lg:flex lg:items-center lg:justify-center lg:py-12 lg:px-6">
      <div className="lg:w-full lg:max-w-[600px] lg:bg-surface lg:dark:bg-surface-dark lg:rounded-card lg:shadow-card lg:dark:shadow-card-dark lg:overflow-hidden">
      <div className="flex items-center gap-4 px-4 pt-14 pb-4 lg:pt-8 lg:px-8 lg:pb-2">
        <button onClick={() => navigate('/')} className="text-terracotta text-[15px] font-medium">←</button>
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink dark:text-ink-dark">Commit the day</h1>
          <p className="text-[13px] text-hint dark:text-hint-dark">{todayLabel()}</p>
        </div>
      </div>

      <div className="px-4 pb-24 space-y-6 lg:px-8 lg:pb-8">
        <p className="text-[15px] text-muted dark:text-muted-dark">How was the day, overall?</p>

        <MetricCircles label="Spark" value={spark} onChange={setSpark} color={METRIC_COLORS.spark} />
        <MetricCircles label="Mood"  value={mood}  onChange={setMood}  color={METRIC_COLORS.mood} />

        <hr className="border-hairline dark:border-hairline-dark" />
        <p className="font-display text-[16px] font-semibold text-ink dark:text-ink-dark">The numbers</p>

        <div className="space-y-2">
          <label className="text-[15px] font-medium text-ink dark:text-ink-dark">Exercise</label>
          <div className="flex items-center gap-3">
            {([true, false] as const).map(v => (
              <button
                key={String(v)}
                onClick={() => setExerciseDone(v)}
                className="px-5 py-2 rounded-input text-[14px] font-medium border-2 transition-all"
                style={{
                  borderColor: exerciseDone === v ? 'var(--color-terracotta)' : 'var(--color-hairline)',
                  backgroundColor: exerciseDone === v ? 'color-mix(in srgb, var(--color-terracotta) 8%, transparent)' : 'transparent',
                  color: exerciseDone === v ? 'var(--color-terracotta)' : 'var(--color-muted)',
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
                  className="w-16 px-3 py-2 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[14px] outline-none focus:border-terracotta text-center"
                />
                <span className="text-[13px] text-muted dark:text-muted-dark">mins</span>
              </div>
            )}
          </div>
        </div>

        {[
          { label: 'Reading',   value: readingMins, set: setReadingMins, unit: 'minutes' },
          { label: 'Deep Work', value: deepWorkHrs, set: setDeepWorkHrs, unit: 'hours'   },
        ].map(({ label, value, set, unit }) => (
          <div key={label} className="space-y-2">
            <label className="text-[15px] font-medium text-ink dark:text-ink-dark">{label}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value}
                onChange={e => set(e.target.value)}
                placeholder="0"
                className="w-24 px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[15px] outline-none focus:border-terracotta"
              />
              <span className="text-[13px] text-muted dark:text-muted-dark">{unit}</span>
            </div>
          </div>
        ))}

        <hr className="border-hairline dark:border-hairline-dark" />
        <p className="font-display text-[16px] font-semibold text-ink dark:text-ink-dark">Reflect</p>

        {[
          { label: 'Biggest win',         value: biggestWin,       set: setBiggestWin,       ph: 'What went well?' },
          { label: 'Biggest challenge',   value: biggestChallenge, set: setBiggestChallenge, ph: 'What was hard?' },
          { label: 'What energised you?', value: energisedBy,      set: setEnergisedBy,      ph: 'What gave you energy?' },
          { label: 'What drained you?',   value: drainedBy,        set: setDrainedBy,        ph: 'What cost you energy?' },
          { label: 'One sentence',        value: journal,          set: setJournal,          ph: 'The day in one sentence...' },
        ].map(({ label, value, set, ph }) => (
          <div key={label} className="space-y-2">
            <label className="text-[15px] font-medium text-ink dark:text-ink-dark">{label}</label>
            <textarea
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={ph}
              rows={2}
              className="w-full px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[15px] outline-none focus:border-terracotta resize-none"
            />
          </div>
        ))}

        <hr className="border-hairline dark:border-hairline-dark" />

        <div className="space-y-2">
          <label className="text-[15px] font-medium text-ink dark:text-ink-dark">Name this day</label>
          <input
            type="text"
            value={dayTitle}
            onChange={e => setDayTitle(e.target.value)}
            placeholder="Day title"
            className="w-full px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[15px] outline-none focus:border-terracotta"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[15px] font-medium text-ink dark:text-ink-dark">Commit message</label>
          <input
            type="text"
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder="feat: ..."
            className="w-full px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[13px] font-mono outline-none focus:border-terracotta"
          />
        </div>

        <RememberToggle value={remember} onChange={setRemember} />

        <button
          onClick={handleCommit}
          disabled={saving}
          className="w-full py-4 rounded-btn bg-terracotta font-display font-bold text-[18px] disabled:opacity-60 active:scale-[0.98] transition-transform"
          style={{
            color: '#3D1F12',
            boxShadow: 'inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)',
            animation: pulsing ? 'commit-pulse 260ms ease-out' : undefined,
          }}
        >
          {saving ? 'Committing...' : 'Commit ✦'}
        </button>
      </div>
      </div>
      <style>{`@keyframes commit-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }`}</style>
    </div>
  )
}
