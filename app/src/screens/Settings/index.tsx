import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { silentSignIn } from '../../lib/drive/client'
import { fullSync, flushSyncQueue } from '../../lib/drive/operations'
import { getPendingSyncItems } from '../../lib/db/queries'

type SyncState = 'idle' | 'syncing' | 'done' | 'error'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { displayName, setSignedOut } = useAuthStore()
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    const items = await getPendingSyncItems()
    setPendingCount(items.length)
  }, [])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  async function handleSync() {
    setSyncState('syncing')
    setSyncResult(null)
    try {
      await silentSignIn()
      const { pulled, pushed } = await fullSync()
      await flushSyncQueue()
      await refreshPendingCount()
      const parts: string[] = []
      if (pulled.entries > 0)  parts.push(`↓ ${pulled.entries} ${pulled.entries === 1 ? 'entry' : 'entries'}`)
      if (pulled.moments > 0)  parts.push(`↓ ${pulled.moments} ${pulled.moments === 1 ? 'moment' : 'moments'}`)
      if (pushed.entries > 0)  parts.push(`↑ ${pushed.entries} ${pushed.entries === 1 ? 'entry' : 'entries'}`)
      if (pushed.moments > 0)  parts.push(`↑ ${pushed.moments} ${pushed.moments === 1 ? 'moment' : 'moments'}`)
      setSyncResult(parts.length > 0 ? parts.join('  ') : 'Already up to date')
      setSyncState('done')
      setTimeout(() => setSyncState('idle'), 3000)
    } catch (e) {
      setSyncResult(e instanceof Error ? e.message : 'Sync failed — check your connection')
      setSyncState('error')
      setTimeout(() => setSyncState('idle'), 4000)
    }
  }

  function handleSignOut() {
    setSignedOut()
    navigate('/onboarding', { replace: true })
  }

  const syncLabel = syncState === 'syncing' ? 'Syncing…'
    : syncState === 'done'    ? '✓ Synced'
    : syncState === 'error'   ? 'Failed'
    : 'Sync with Drive'

  const syncColor = syncState === 'done'  ? '#22C55E'
    : syncState === 'error' ? '#EF4444'
    : '#7C4DFF'

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#141414]">
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
            Push your data to Google Drive and pull any changes from other devices.
          </p>

          <button
            onClick={handleSync}
            disabled={syncState === 'syncing'}
            className="w-full py-3 rounded-[12px] text-white font-medium text-[14px] disabled:opacity-60 active:scale-[0.98] transition-all duration-300"
            style={{ backgroundColor: syncColor }}
          >
            <span
              className="inline-block transition-all duration-300"
              style={{
                transform: syncState === 'syncing' ? 'scale(0.95)' : 'scale(1)',
                opacity: syncState === 'syncing' ? 0.8 : 1,
              }}
            >
              {syncState === 'syncing' ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                    style={{ animation: 'spin 0.8s linear infinite' }}
                  />
                  Syncing…
                </span>
              ) : syncLabel}
            </span>
          </button>

          {syncResult && (
            <p
              className="text-[13px] text-center transition-all duration-300"
              style={{ color: syncState === 'error' ? '#EF4444' : '#666666' }}
            >
              {syncResult}
            </p>
          )}

          {pendingCount > 0 && (
            <p className="text-[13px] text-center text-[#F59E0B]">
              {pendingCount} {pendingCount === 1 ? 'item' : 'items'} waiting to sync
            </p>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
