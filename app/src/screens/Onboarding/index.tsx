import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { initAuth, signIn } from '../../lib/drive/client'
import { bootstrapDrive, syncFromDrive } from '../../lib/drive/operations'
import { useAuthStore } from '../../store/auth'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export default function OnboardingScreen() {
  const navigate = useNavigate()
  const { setSignedIn } = useAuthStore()
  const [name, setName] = useState('')
  const [morningTime, setMorningTime] = useState('08:00')
  const [eveningTime, setEveningTime] = useState('21:00')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [succeeded, setSucceeded] = useState(false)

  async function handleConnect() {
    if (!name.trim()) { setError('Please enter your name first.'); return }
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
    <div className="min-h-screen bg-base dark:bg-base-dark flex flex-col items-center px-6 pt-16 pb-12">
      <div className="mb-10 text-center">
        <p className="font-display text-5xl font-bold text-ink dark:text-ink-dark">✦ Mosaic</p>
        <p className="font-display text-xl text-muted dark:text-muted-dark mt-2 italic">
          Made of the moments you'd otherwise forget.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-2">
            What should we call you?
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark text-[15px] outline-none focus:border-terracotta transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-2">
            Morning reminder
          </label>
          <input
            type="time"
            value={morningTime}
            onChange={e => setMorningTime(e.target.value)}
            className="px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark outline-none focus:border-terracotta transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink dark:text-ink-dark mb-2">
            Evening reminder
          </label>
          <input
            type="time"
            value={eveningTime}
            onChange={e => setEveningTime(e.target.value)}
            className="px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark outline-none focus:border-terracotta transition-colors"
          />
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-4 rounded-btn bg-terracotta font-display font-semibold text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
          style={{ color: '#3D1F12', boxShadow: 'inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)' }}
        >
          {loading ? (status || 'Connecting…') : 'Connect Google Drive'}
        </button>

        {error && <p className="text-center text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <p className="text-center text-[13px] text-hint dark:text-hint-dark">
          Your data lives in your Drive. Only you can see it.
        </p>
      </div>
    </div>
  )
}
