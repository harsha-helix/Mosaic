import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const [error, setError] = useState('')

  async function handleConnect() {
    if (!name.trim()) { setError('Please enter your name first.'); return }
    setError('')
    setLoading(true)
    try {
      initAuth(CLIENT_ID)
      await signIn()
      await bootstrapDrive(name.trim())
      // Pull any existing data from Drive (no-op on first device, restores history on new device)
      await syncFromDrive()
      setSignedIn(name.trim())
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414] flex flex-col items-center px-6 pt-16 pb-12">
      {/* Brand */}
      <div className="mb-10 text-center">
        <p className="font-display text-5xl font-bold text-[#111111] dark:text-[#F0F0F0]">✦ Mosaic</p>
        <p className="font-display text-xl text-[#666666] mt-2 italic">
          Version control for a life well lived.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#111111] dark:text-[#F0F0F0] mb-2">
            What should we call you?
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] text-[15px] outline-none focus:border-[#7C4DFF] transition-colors"
          />
        </div>

        {/* Morning time */}
        <div>
          <label className="block text-sm font-medium text-[#111111] dark:text-[#F0F0F0] mb-2">
            Morning reminder
          </label>
          <input
            type="time"
            value={morningTime}
            onChange={e => setMorningTime(e.target.value)}
            className="px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] outline-none focus:border-[#7C4DFF] transition-colors"
          />
        </div>

        {/* Evening time */}
        <div>
          <label className="block text-sm font-medium text-[#111111] dark:text-[#F0F0F0] mb-2">
            Evening reminder
          </label>
          <input
            type="time"
            value={eveningTime}
            onChange={e => setEveningTime(e.target.value)}
            className="px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-[#111111] dark:text-[#F0F0F0] outline-none focus:border-[#7C4DFF] transition-colors"
          />
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-4 rounded-[999px] bg-[#7C4DFF] text-white font-display font-semibold text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? 'Connecting…' : 'Connect Google Drive'}
        </button>

        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}

        <p className="text-center text-[13px] text-[#AAAAAA]">
          Your data lives in your Drive. Only you can see it.
        </p>
      </div>
    </div>
  )
}
