import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav/BottomNav'
import { FAB } from './components/FAB/FAB'
import { MomentCapture } from './components/MomentCapture/MomentCapture'
import { useAuthStore } from './store/auth'
import { useTodayStore } from './store/today'
import { getEntry, getMoments, getFileId } from './lib/db/queries'
import { initAuth } from './lib/drive/client'
import { setFolderIds } from './lib/drive/fileIndex'

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
  const [showCapture, setShowCapture] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    const date = todayDate()

    async function init() {
      // 1. Load IndexedDB immediately — no auth needed
      const [localEntry, localMoments] = await Promise.all([
        getEntry(date),
        getMoments(date),
      ])
      if (localEntry)   setEntry(localEntry)
      if (localMoments) setMoments(localMoments)
      setLoaded()

      // 2. Restore Drive folder IDs for future saves — no popup, no auth needed
      try {
        await waitForGIS()
        initAuth(CLIENT_ID)
        await restoreFolderIds()
      } catch {
        // Drive setup failed — local data is fine
      }
    }

    init()
  }, [isSignedIn])

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
    <div className="relative min-h-screen bg-[#FAFAF8] dark:bg-[#141414]">
      <main className="pb-16">
        <Routes>
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
      </main>

      <BottomNav />
      <FAB onClick={() => setShowCapture(true)} />
      {showCapture && <MomentCapture onClose={() => setShowCapture(false)} />}
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
