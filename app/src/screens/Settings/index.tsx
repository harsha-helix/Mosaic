import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'
import { CLUSTER, DANGER, textOnAccent } from '../../lib/theme'
import { silentSignIn, signIn, getToken } from '../../lib/drive/client'
import { fullSync, flushSyncQueue, fetchMeta, pushMeta } from '../../lib/drive/operations'
import { getPendingSyncItems } from '../../lib/db/queries'
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle'

type SyncState = 'idle' | 'syncing' | 'done' | 'error'
type ProfileState = 'idle' | 'saving' | 'done' | 'error'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { displayName, setSignedIn, setSignedOut } = useAuthStore()
  const theme = useThemeStore(s => s.theme)
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  const [name, setName] = useState(displayName)
  const [morningTime, setMorningTime] = useState('08:00')
  const [eveningTime, setEveningTime] = useState('21:00')
  const [profileState, setProfileState] = useState<ProfileState>('idle')
  const [profileMessage, setProfileMessage] = useState<string | null>(null)

  const refreshPendingCount = useCallback(async () => {
    const items = await getPendingSyncItems()
    setPendingCount(items.length)
  }, [])

  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  // Load current reminder times / name from meta.json (falls back to
  // whatever's already in the auth store + onboarding defaults if meta
  // isn't reachable — e.g. offline).
  useEffect(() => {
    fetchMeta().then(meta => {
      if (!meta) return
      setName(meta.display_name || displayName)
      setMorningTime(meta.notifications?.morning_time ?? '08:00')
      setEveningTime(meta.notifications?.evening_time ?? '21:00')
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSaveProfile() {
    setProfileState('saving')
    setProfileMessage(null)
    try {
      await silentSignIn()
      const existing = await fetchMeta()
      const updated = {
        version: existing?.version ?? '1',
        display_name: name.trim() || displayName,
        created_at: existing?.created_at ?? new Date().toISOString(),
        notifications: { morning_time: morningTime, evening_time: eveningTime },
        last_synced_at: existing?.last_synced_at ?? new Date().toISOString(),
        ...(existing?.fcm_token ? { fcm_token: existing.fcm_token } : {}),
      }
      await pushMeta(updated)
      if (updated.display_name !== displayName) setSignedIn(updated.display_name)
      setProfileState('done')
      setProfileMessage('Saved')
      setTimeout(() => { setProfileState('idle'); setProfileMessage(null) }, 2500)
    } catch (e) {
      setProfileState('error')
      setProfileMessage(e instanceof Error ? e.message : 'Could not save — check your connection')
      setTimeout(() => { setProfileState('idle'); setProfileMessage(null) }, 4000)
    }
  }

  async function handleSync() {
    setSyncState('syncing')
    setSyncResult(null)
    try {
      await silentSignIn()
      if (!getToken()) {
        // Silent reauth didn't produce a token (timed out or was refused).
        // Don't report this as a generic failure — point at the fix.
        setSyncResult('Not connected — tap "Reconnect Google Drive" below')
        setSyncState('error')
        setTimeout(() => setSyncState('idle'), 5000)
        return
      }
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

  async function handleReconnect() {
    setSyncState('syncing')
    setSyncResult(null)
    try {
      await signIn() // interactive — shows Google's account picker, doesn't rely on the silent iframe flow
      const { pulled, pushed } = await fullSync()
      await flushSyncQueue()
      await refreshPendingCount()
      const total = pulled.entries + pulled.moments + pushed.entries + pushed.moments
      setSyncResult(total > 0 ? 'Reconnected and synced' : 'Reconnected — already up to date')
      setSyncState('done')
      setTimeout(() => setSyncState('idle'), 3000)
    } catch (e) {
      setSyncResult(e instanceof Error ? e.message : 'Reconnect failed — try again')
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

  // textOnAccent() rather than a manual white/dark ternary — dark mode's
  // accent chips are brighter/lighter than light mode's, so a fixed
  // "white text on done/error" rule (which read fine against light
  // mode's darker sage/red) would lose contrast once those same tokens
  // brighten for dark mode. textOnAccent always returns a dark shade,
  // which keeps working since every state color is a light-ish chip in
  // both themes.
  const syncColor = syncState === 'done'  ? CLUSTER.body
    : syncState === 'error' ? DANGER
    : CLUSTER.creative
  const syncTextColor = textOnAccent(syncColor)

  return (
    <div className="min-h-screen bg-base dark:bg-base-dark">
      <div className="px-4 pt-14 pb-6">
        <h1 className="font-display text-[22px] font-semibold text-ink dark:text-ink-dark">Settings</h1>
      </div>

      <div className="px-4 space-y-4 pb-24 lg:max-w-[760px] lg:mx-auto lg:space-y-6">
        {/* Account */}
        <div className="lg:grid lg:grid-cols-[160px_1fr] lg:gap-6 lg:items-start">
          <p className="hidden lg:block text-[13px] font-medium text-muted dark:text-muted-dark pt-4">Account</p>
          <div className="rounded-card bg-surface dark:bg-surface-dark border border-hairline dark:border-hairline-dark p-4">
            <p className="text-[11px] text-hint dark:text-hint-dark uppercase tracking-wide mb-3 lg:hidden">Account</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'color-mix(in srgb, var(--color-terracotta) 13%, transparent)' }}>
                <span className="font-display font-bold text-terracotta text-[17px]">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-[15px] font-medium text-ink dark:text-ink-dark">{displayName}</p>
                <p className="text-[12px] text-hint dark:text-hint-dark">Google Drive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="lg:grid lg:grid-cols-[160px_1fr] lg:gap-6 lg:items-start">
          <p className="hidden lg:block text-[13px] font-medium text-muted dark:text-muted-dark pt-4">Appearance</p>
          <div className="rounded-card bg-surface dark:bg-surface-dark border border-hairline dark:border-hairline-dark p-4">
            <p className="text-[11px] text-hint dark:text-hint-dark uppercase tracking-wide mb-3 lg:hidden">Appearance</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-ink dark:text-ink-dark">Dark theme</p>
                <p className="text-[12px] text-hint dark:text-hint-dark">{theme === 'dark' ? 'On' : 'Off'}</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Profile & Reminders */}
        <div className="lg:grid lg:grid-cols-[160px_1fr] lg:gap-6 lg:items-start">
        <p className="hidden lg:block text-[13px] font-medium text-muted dark:text-muted-dark pt-4">Profile &amp; reminders</p>
        <div className="rounded-card bg-surface dark:bg-surface-dark border border-hairline dark:border-hairline-dark p-4 space-y-3">
          <p className="text-[11px] text-hint dark:text-hint-dark uppercase tracking-wide lg:hidden">Profile &amp; reminders</p>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink dark:text-ink-dark">Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-input border border-hairline dark:border-hairline-dark bg-base dark:bg-base-dark text-ink dark:text-ink-dark text-[14px] outline-none focus:border-terracotta"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] font-medium text-ink dark:text-ink-dark">Morning reminder</label>
              <input
                type="time"
                value={morningTime}
                onChange={e => setMorningTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-input border border-hairline dark:border-hairline-dark bg-base dark:bg-base-dark text-ink dark:text-ink-dark text-[14px] outline-none focus:border-terracotta"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] font-medium text-ink dark:text-ink-dark">Evening reminder</label>
              <input
                type="time"
                value={eveningTime}
                onChange={e => setEveningTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-input border border-hairline dark:border-hairline-dark bg-base dark:bg-base-dark text-ink dark:text-ink-dark text-[14px] outline-none focus:border-terracotta"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={profileState === 'saving'}
            className="w-full py-2.5 rounded-btn-sm font-medium text-[14px] disabled:opacity-60 active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: profileState === 'done' ? CLUSTER.body : profileState === 'error' ? DANGER : CLUSTER.creative,
              color: textOnAccent(profileState === 'done' ? CLUSTER.body : profileState === 'error' ? DANGER : CLUSTER.creative),
            }}
          >
            {profileState === 'saving' ? 'Saving…' : profileState === 'done' ? '✓ Saved' : profileState === 'error' ? 'Failed' : 'Save'}
          </button>
          {profileMessage && profileState === 'error' && (
            <p className="text-[12px] text-center" style={{ color: 'var(--color-danger)' }}>{profileMessage}</p>
          )}
          <p className="text-[11px] text-hint dark:text-hint-dark leading-relaxed">
            Reminder times are stored, but push notifications aren't built yet — this is groundwork for that.
          </p>
        </div>
        </div>

        {/* Sync */}
        <div className="lg:grid lg:grid-cols-[160px_1fr] lg:gap-6 lg:items-start">
        <p className="hidden lg:block text-[13px] font-medium text-muted dark:text-muted-dark pt-4">Sync</p>
        <div className="rounded-card bg-surface dark:bg-surface-dark border border-hairline dark:border-hairline-dark p-4 space-y-3">
          <p className="text-[11px] text-hint dark:text-hint-dark uppercase tracking-wide lg:hidden">Sync</p>
          <p className="text-[13px] text-muted dark:text-muted-dark leading-relaxed">
            Push your data to Google Drive and pull any changes from other devices.
          </p>

          <button
            onClick={handleSync}
            disabled={syncState === 'syncing'}
            className="w-full py-3 rounded-btn-sm font-medium text-[14px] disabled:opacity-60 active:scale-[0.98] transition-all duration-300"
            style={{ backgroundColor: syncColor, color: syncTextColor }}
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
                    className="inline-block w-4 h-4 border-2 rounded-full"
                    style={{ borderColor: 'rgba(61,31,18,0.35)', borderTopColor: '#3D1F12', animation: 'spin 0.8s linear infinite' }}
                  />
                  Syncing…
                </span>
              ) : syncLabel}
            </span>
          </button>

          {syncResult && (
            <p
              className="text-[13px] text-center transition-all duration-300"
              style={{ color: syncState === 'error' ? 'var(--color-danger)' : 'var(--color-muted)' }}
            >
              {syncResult}
            </p>
          )}

          {pendingCount > 0 && (
            <p className="text-[13px] text-center" style={{ color: 'var(--color-warmth)' }}>
              {pendingCount} {pendingCount === 1 ? 'item' : 'items'} waiting to sync
            </p>
          )}

          <button
            onClick={handleReconnect}
            disabled={syncState === 'syncing'}
            className="w-full py-2.5 rounded-btn-sm border border-hairline dark:border-hairline-dark text-terracotta font-medium text-[13px] disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            Reconnect Google Drive
          </button>
          <p className="text-[11px] text-hint dark:text-hint-dark text-center leading-relaxed">
            If sync gets stuck on "Syncing…" with no result, background reconnect likely failed silently — this opens Google's sign-in directly.
          </p>
        </div>
        </div>

        {/* About */}
        <div className="lg:grid lg:grid-cols-[160px_1fr] lg:gap-6 lg:items-start">
        <p className="hidden lg:block text-[13px] font-medium text-muted dark:text-muted-dark pt-4">About</p>
        <div className="rounded-card bg-surface dark:bg-surface-dark border border-hairline dark:border-hairline-dark p-4">
          <p className="text-[11px] text-hint dark:text-hint-dark uppercase tracking-wide mb-3 lg:hidden">About</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-[13px] text-muted dark:text-muted-dark">Version</p>
              <p className="text-[13px] text-ink dark:text-ink-dark font-mono">0.3.0</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[13px] text-muted dark:text-muted-dark">Storage</p>
              <p className="text-[13px] text-ink dark:text-ink-dark">Your Google Drive</p>
            </div>
          </div>
        </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-btn-sm border border-hairline dark:border-hairline-dark font-medium text-[14px] active:scale-[0.98] transition-transform"
          style={{ color: 'var(--color-danger)' }}
        >
          Sign out
        </button>

        <p className="text-center text-[11px] text-hint dark:text-hint-dark pt-2">
          Your data lives in your Google Drive. Mosaic never stores it elsewhere.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
