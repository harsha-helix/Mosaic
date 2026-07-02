import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav/BottomNav'
import { SidebarNav } from './components/SidebarNav/SidebarNav'
import { FAB } from './components/FAB/FAB'
import { MomentCapture } from './components/MomentCapture/MomentCapture'
import { Lightbox } from './components/Lightbox/Lightbox'
import { useAuthStore } from './store/auth'
import { useTodayStore } from './store/today'
import { getEntry, getMoments, getFileId } from './lib/db/queries'
import { initAuth, silentSignIn, isSignedIn as driveIsSignedIn } from './lib/drive/client'
import { setFolderIds } from './lib/drive/fileIndex'
import { hydrateToday, flushSyncQueue, syncFromDrive, fetchMeta, pushMeta } from './lib/drive/operations'
import { useSyncStore } from './store/sync'

// Screens
import HomeScreen       from './screens/Home'
import MorningScreen    from './screens/Morning'
import EveningScreen    from './screens/Evening'
import HighlightsScreen from './screens/Highlights'
import DayViewScreen    from './screens/DayView'
import InsightsScreen   from './screens/Insights'
import SearchScreen     from './screens/Search'
import SettingsScreen   from './screens/Settings'
import OnboardingScreen from './screens/Onboarding'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const SIX_HOURS_MS = 6 * 60 * 60 * 1000

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
})

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function waitForGIS(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) { clearInterval(interval); resolve() }
    }, 100)
  })
}

const PAGE_VARIANTS = {
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={location.pathname}
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Routes location={location}>
          <Route path="/"           element={<HomeScreen />} />
          <Route path="/morning"    element={<MorningScreen />} />
          <Route path="/evening"    element={<EveningScreen />} />
          <Route path="/highlights" element={<HighlightsScreen />} />
          <Route path="/day/:date"  element={<DayViewScreen />} />
          <Route path="/insights"   element={<InsightsScreen />} />
          <Route path="/search"     element={<SearchScreen />} />
          <Route path="/settings"   element={<SettingsScreen />} />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

async function restoreFolderIds(): Promise<void> {
  const [mosaic, entries, moments, media] = await Promise.all([
    getFileId('__mosaic_root__'),
    getFileId('__entries_folder__'),
    getFileId('__moments_folder__'),
    getFileId('__media_folder__'),
  ])
  if (mosaic && entries && moments && media) {
    setFolderIds({ mosaic, entries, moments, media })
  }
}

function AppShell() {
  const [hydrated, setHydrated] = useState(false)
  const isSignedIn = useAuthStore(s => s.isSignedIn)
  const { setEntry, setMoments, setLoaded } = useTodayStore()
  const { setStatus, setSynced } = useSyncStore()
  const [showCapture, setShowCapture] = useState(false)
  const location = useLocation()

  // Matches SidebarNav/BottomNav's own hide rule (docs/14: full-attention
  // flows hide chrome on both mobile and desktop) — used here just to drop
  // the sidebar's content offset so Morning/Evening's centered card isn't
  // pushed off-center by a gutter for a sidebar that isn't showing.
  const hideChrome = ['/morning', '/evening', '/onboarding'].some(p => location.pathname.startsWith(p))

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    const date = todayDate()

    async function init() {
      // 1. Load IndexedDB immediately — show UI with local data right away
      const [localEntry, localMoments] = await Promise.all([
        getEntry(date),
        getMoments(date),
      ])
      if (localEntry)   setEntry(localEntry)
      if (localMoments) setMoments(localMoments)
      setLoaded()

      // 2. Set up Drive auth + restore folder IDs (no popup)
      try {
        await waitForGIS()
        initAuth(CLIENT_ID)
        await restoreFolderIds()
      } catch {
        // Drive setup failed — local data is fine, skip sync
        return
      }

      // 3. Background hydration: refresh file index + pull today from Drive
      //    Silently acquires a token — never shows a popup.
      //    If the token can't be refreshed (e.g. revoked), we just stay on local data.
      try {
        await silentSignIn()
        if (!driveIsSignedIn()) return

        setStatus('syncing')
        const { entry: freshEntry, moments: freshMoments } = await hydrateToday(date)

        // Update store if Drive had newer data
        if (freshEntry)           setEntry(freshEntry)
        if (freshMoments.length)  setMoments(freshMoments)

        // Replay anything queued from a previous offline session
        await flushSyncQueue()

        // Periodic full-history sync: catches an older edit from a second
        // device without hitting Drive on every single open.
        const meta = await fetchMeta()
        const lastSyncedMs = meta?.last_synced_at ? new Date(meta.last_synced_at).getTime() : 0
        if (Date.now() - lastSyncedMs > SIX_HOURS_MS) {
          await syncFromDrive()
          if (meta) await pushMeta(meta)
        }

        setSynced(new Date().toISOString())
      } catch {
        setStatus('error')
      }
    }

    init()
  }, [isSignedIn])

  // Reconnect: flush anything queued while offline, without waiting for
  // the next full app open.
  useEffect(() => {
    function handleOnline() {
      silentSignIn()
        .then(() => { if (driveIsSignedIn()) return flushSyncQueue() })
        .catch(() => {})
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  // Opportunistic token refresh (docs/11 D5): when the PWA returns to the
  // foreground with no live token, try one silent sign-in and flush the
  // queue. Mobile browsers block the silent iframe flow far less often right
  // after the user has foregrounded the page, so this quietly recovers most
  // "signed out on the phone" states without any prompt — and if it fails,
  // nothing changes: reads stay local, writes keep queueing.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState !== 'visible') return
      if (!useAuthStore.getState().isSignedIn) return
      if (driveIsSignedIn()) return
      silentSignIn()
        .then(() => { if (driveIsSignedIn()) return flushSyncQueue() })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [])

  // Hold one tick while localStorage hydrates to prevent onboarding flash
  if (!hydrated) return null

  if (!isSignedIn) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <div className="relative min-h-screen bg-base dark:bg-base-dark">
      <SidebarNav onCapture={() => setShowCapture(true)} />

      <main className={`pb-16 lg:pb-0 ${hideChrome ? '' : 'lg:pl-60'}`}>
        <AnimatedRoutes />
      </main>

      <BottomNav />
      <FAB onClick={() => setShowCapture(true)} />
      <AnimatePresence>
        {showCapture && <MomentCapture onClose={() => setShowCapture(false)} />}
      </AnimatePresence>
      <Lightbox />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
