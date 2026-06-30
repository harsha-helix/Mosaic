import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { BottomNav } from './components/BottomNav/BottomNav'
import { FAB } from './components/FAB/FAB'
import { MomentCapture } from './components/MomentCapture/MomentCapture'
import { useAuthStore } from './store/auth'
import { useTodayStore } from './store/today'
import { getEntry, getMoments } from './lib/db/queries'
import { fetchEntry, fetchMoments } from './lib/drive/operations'

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

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
})

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function AppShell() {
  const isSignedIn = useAuthStore(s => s.isSignedIn)
  const { setEntry, setMoments, setLoaded } = useTodayStore()
  const [showCapture, setShowCapture] = useState(false)

  // Load today's data from IndexedDB on mount, then background-sync from Drive
  useEffect(() => {
    if (!isSignedIn) return
    const date = todayDate()

    async function loadToday() {
      // 1. Load from IndexedDB immediately
      const [localEntry, localMoments] = await Promise.all([
        getEntry(date),
        getMoments(date),
      ])
      if (localEntry)   setEntry(localEntry)
      if (localMoments) setMoments(localMoments)
      setLoaded()

      // 2. Background fetch from Drive — update if we got something
      try {
        const [driveEntry, driveMoments] = await Promise.all([
          fetchEntry(date),
          fetchMoments(date),
        ])
        if (driveEntry)          setEntry(driveEntry)
        if (driveMoments.length) setMoments(driveMoments)
      } catch {
        // Drive fetch failed — local data is fine
      }
    }

    loadToday()
  }, [isSignedIn])

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
