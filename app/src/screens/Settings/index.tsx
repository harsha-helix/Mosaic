import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { silentSignIn } from '../../lib/drive/client'
import { syncFromDrive } from '../../lib/drive/operations'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { displayName, setSignedOut } = useAuthStore()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      await silentSignIn()
      const { entries, moments } = await syncFromDrive()
      const parts = []
      if (entries > 0) parts.push(`${entries} ${entries === 1 ? 'entry' : 'entries'}`)
      if (moments > 0) parts.push(`${moments} ${moments === 1 ? 'moment' : 'moments'}`)
      setSyncResult(parts.length > 0 ? `Pulled ${parts.join(', ')}` : 'Already up to date')
    } catch {
      setSyncResult('Sync failed — check your connection')
    } finally {
      setSyncing(false)
    }
  }

  function handleSignOut() {
    setSignedOut()
    navigate('/onboarding', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414]">
      {/* Header */}
      <div className="px-4 pt-14 pb-6">
        <h1 className="font-display text-[22px] font-semibold text-[#111111] dark:text-[#F0F0F0]">Settings</h1>
      </div>

      <div className="px-4 space-y-4 pb-24">
        {/* Account */}
        <div className="rounded-[16px] bg-white dark:bg-[#1E1E1E] border border-[#E8E8E8] dark:border-[#2E2E2E] p-4">
          <p className="text-[11px] text-[#AAAAAA] uppercase tracking-wide mb-3">Account</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7C4DFF20] flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-[#7C4DFF] text-[17px]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">{displayName}</p>
              <p className="text-[12px] text-[#AAAAAA]">Google Drive</p>
            </div>
          </div>
        </div>

        {/* Sync */}
        <div className="rounded-[16px] bg-white dark:bg-[#1E1E1E] border border-[#E8E8E8] dark:border-[#2E2E2E] p-4 space-y-3">
          <p className="text-[11px] text-[#AAAAAA] uppercase tracking-wide">Sync</p>
          <p className="text-[13px] text-[#666666] dark:text-[#888888] leading-relaxed">
            Pull your data from Google Drive. Use this when switching devices or after a period offline.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-3 rounded-[12px] bg-[#7C4DFF] text-white font-medium text-[14px] disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            {syncing ? 'Syncing…' : 'Sync with Drive'}
          </button>
          {syncResult && (
            <p className="text-[13px] text-center text-[#666666] dark:text-[#888888]">{syncResult}</p>
          )}
        </div>

        {/* About */}
        <div className="rounded-[16px] bg-white dark:bg-[#1E1E1E] border border-[#E8E8E8] dark:border-[#2E2E2E] p-4">
          <p className="text-[11px] text-[#AAAAAA] uppercase tracking-wide mb-3">About</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-[13px] text-[#666666] dark:text-[#888888]">Version</p>
              <p className="text-[13px] text-[#111111] dark:text-[#F0F0F0] font-mono">1.0.0</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[13px] text-[#666666] dark:text-[#888888]">Storage</p>
              <p className="text-[13px] text-[#111111] dark:text-[#F0F0F0]">Your Google Drive</p>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] text-[#FF4444] font-medium text-[14px] active:scale-[0.98] transition-transform"
        >
          Sign out
        </button>

        <p className="text-center text-[11px] text-[#CCCCCC] dark:text-[#444444] pt-2">
          Your data lives in your Google Drive. Mosaic never stores it elsewhere.
        </p>
      </div>
    </div>
  )
}
