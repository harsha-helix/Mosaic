import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { initAuth, signIn } from '../../lib/drive/client'
import { bootstrapDrive, syncFromDrive } from '../../lib/drive/operations'
import { useAuthStore } from '../../store/auth'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

// Onboarding restructured from one static form into a short flow
// (docs/15_Onboarding_and_Dark_Theme_Refresh.md Part A). Same four things
// collected as before (name, morning time, evening time, Drive connect) —
// this paces what's already asked for rather than adding anything new.
const STEPS = ['welcome', 'name', 'reminders', 'connect'] as const
type Step = (typeof STEPS)[number]

// Step transitions: slide-up + fade, 300ms (docs/15 motion spec — matches
// the slide-up pattern already specified for screen transitions in
// 07_UI_Specification.md's motion table).
const STEP_VARIANTS = {
  initial: { y: 24, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { y: -24, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' as const } },
}

const PRIMARY_BTN_SHADOW = { boxShadow: 'inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)' }
const PRIMARY_BTN_CLASS = 'w-full py-4 rounded-btn bg-terracotta font-display font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform'

export default function OnboardingScreen() {
  const navigate = useNavigate()
  const { setSignedIn } = useAuthStore()
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState('')
  const [morningTime, setMorningTime] = useState('08:00')
  const [eveningTime, setEveningTime] = useState('21:00')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [succeeded, setSucceeded] = useState(false)

  const stepIndex = STEPS.indexOf(step)

  function goBack() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1])
  }
  function goNext() {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1])
  }

  async function handleConnect() {
    setError('')
    setLoading(true)
    try {
      setStatus('Connecting to Google Drive…')
      initAuth(CLIENT_ID)
      await signIn()
      setStatus('Setting up your Mosaic…')
      await bootstrapDrive(name.trim(), { morning_time: morningTime, evening_time: eveningTime })
      setStatus('Syncing existing data…')
      await syncFromDrive()
      setSignedIn(name.trim())

      // Brief success beat before handing off to Home — first run is a
      // one-time impression, worth a half-second checkmark (spec §1 note:
      // "a half-second checkmark/confetti beat here would cost little").
      // This is the natural 5th beat of the sequence, unchanged from before
      // the flow was split into steps.
      setSucceeded(true)
      await new Promise(resolve => setTimeout(resolve, 900))
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  if (succeeded) {
    return (
      <div className="min-h-screen bg-base dark:bg-base-dark flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: 'var(--color-sage)' }}
        >
          <span className="text-4xl text-white">✓</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="font-display text-[20px] font-semibold text-ink dark:text-ink-dark"
        >
          You're all set
        </motion.p>
      </div>
    )
  }

  return (
    // Desktop: 440px centered card (docs/14 §1 `dialog-width-form`, still
    // holds per docs/15 — only the contents change per step). Mobile stays
    // full-bleed: the lg: card classes below are inert below the breakpoint.
    <div className="min-h-screen bg-base dark:bg-base-dark flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm lg:max-w-[440px] relative lg:bg-surface lg:dark:bg-surface-dark lg:rounded-card lg:shadow-card lg:dark:shadow-card-dark lg:p-10">
        {stepIndex > 0 && (
          <div className="flex items-center justify-between mb-8">
            <button onClick={goBack} className="text-terracotta text-[15px] font-medium" aria-label="Back">
              ←
            </button>
            <div className="flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className="w-1.5 h-1.5 rounded-full"
                  style={
                    i <= stepIndex
                      ? { backgroundColor: 'var(--color-terracotta)' }
                      : { border: '1px solid var(--color-hairline)' }
                  }
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step} variants={STEP_VARIANTS} initial="initial" animate="animate" exit="exit">
            {step === 'welcome' && <WelcomeStep onBegin={goNext} />}
            {step === 'name' && <NameStep name={name} onChange={setName} onContinue={goNext} />}
            {step === 'reminders' && (
              <RemindersStep
                morningTime={morningTime}
                eveningTime={eveningTime}
                onMorningChange={setMorningTime}
                onEveningChange={setEveningTime}
                onContinue={goNext}
              />
            )}
            {step === 'connect' && (
              <ConnectStep loading={loading} status={status} error={error} onConnect={handleConnect} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Step 1 — brand mark and tagline get their own beat instead of being
// squeezed above a form. Entrance: mark scales/fades in first, tagline
// follows ~150ms later — reuses the exact spring config from the
// success-state mark animation above (same spring, same delay pattern) so
// the flow's first and last beats read as one family.
function WelcomeStep({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="text-center">
      <motion.p
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="font-display text-5xl font-bold text-ink dark:text-ink-dark"
      >
        ✦ Mosaic
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="font-display text-xl text-muted dark:text-muted-dark mt-2 italic"
      >
        Made of the moments you'd otherwise forget.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        onClick={onBegin}
        className={`${PRIMARY_BTN_CLASS} mt-10`}
        style={{ color: '#3D1F12', ...PRIMARY_BTN_SHADOW }}
      >
        Begin
      </motion.button>
    </div>
  )
}

// Step 2 — one question, one large auto-focused input. Continue disabled
// until non-empty (same validation as before, just moved earlier instead
// of surfacing as an error after tapping Connect).
function NameStep({
  name, onChange, onContinue,
}: {
  name: string
  onChange: (v: string) => void
  onContinue: () => void
}) {
  return (
    <div>
      <label className="block font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-6 text-center">
        What should we call you?
      </label>
      <input
        type="text"
        autoFocus
        value={name}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onContinue() }}
        placeholder="Your name"
        className="w-full px-4 py-3.5 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[17px] text-center outline-none focus:border-terracotta transition-colors"
      />
      <button
        onClick={onContinue}
        disabled={!name.trim()}
        className={`${PRIMARY_BTN_CLASS} mt-8`}
        style={{ color: '#3D1F12', ...PRIMARY_BTN_SHADOW }}
      >
        Continue
      </button>
    </div>
  )
}

// Step 3 — morning + evening presented as a single paired card
// (rounded-card/shadow-card/bg-surface — same language Home, Highlights,
// and Day View already use) instead of today's bare bordered <input>s.
// Rationale copy above ties the ask back to the "small commits" framing
// rather than reading as arbitrary settings.
function RemindersStep({
  morningTime, eveningTime, onMorningChange, onEveningChange, onContinue,
}: {
  morningTime: string
  eveningTime: string
  onMorningChange: (v: string) => void
  onEveningChange: (v: string) => void
  onContinue: () => void
}) {
  return (
    <div>
      <label className="block font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-2 text-center">
        When should Mosaic nudge you?
      </label>
      <p className="text-[14px] text-muted dark:text-muted-dark text-center mb-6">
        Mosaic checks in twice a day — once to start, once to reflect.
      </p>

      <div className="rounded-card bg-surface dark:bg-surface-dark shadow-card dark:shadow-card-dark divide-y divide-hairline dark:divide-hairline-dark overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-[15px] font-medium text-ink dark:text-ink-dark">Morning</span>
          <input
            type="time"
            value={morningTime}
            onChange={e => onMorningChange(e.target.value)}
            className="bg-transparent text-ink dark:text-ink-dark text-[15px] outline-none text-right"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-[15px] font-medium text-ink dark:text-ink-dark">Evening</span>
          <input
            type="time"
            value={eveningTime}
            onChange={e => onEveningChange(e.target.value)}
            className="bg-transparent text-ink dark:text-ink-dark text-[15px] outline-none text-right"
          />
        </div>
      </div>

      <button onClick={onContinue} className={`${PRIMARY_BTN_CLASS} mt-8`} style={{ color: '#3D1F12', ...PRIMARY_BTN_SHADOW }}>
        Continue
      </button>
    </div>
  )
}

// Step 4 — unchanged from today: Connect button + reassurance copy. The
// post-connect success beat (checkmark + "You're all set") is preserved
// as-is and becomes this sequence's natural 5th beat.
function ConnectStep({
  loading, status, error, onConnect,
}: {
  loading: boolean
  status: string
  error: string
  onConnect: () => void
}) {
  return (
    <div>
      <label className="block font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-6 text-center">
        Connect your Drive
      </label>

      <button
        onClick={onConnect}
        disabled={loading}
        className={PRIMARY_BTN_CLASS}
        style={{ color: '#3D1F12', ...PRIMARY_BTN_SHADOW }}
      >
        {loading ? (status || 'Connecting…') : 'Connect Google Drive'}
      </button>

      {error && <p className="text-center text-sm mt-4" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      <p className="text-center text-[13px] text-hint dark:text-hint-dark mt-4">
        Your data lives in your Drive. Only you can see it.
      </p>
    </div>
  )
}
