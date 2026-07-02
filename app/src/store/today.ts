import { create } from 'zustand'
import type { DailyEntry, Moment } from '../types'

interface TodayState {
  entry: DailyEntry | null
  moments: Moment[]
  loaded: boolean
  setEntry: (entry: DailyEntry) => void
  setMoments: (moments: Moment[]) => void
  addMoment: (moment: Moment) => void
  patchMoment: (id: string, patch: Partial<Moment>) => void
  setLoaded: () => void
}

export const useTodayStore = create<TodayState>((set) => ({
  entry: null,
  moments: [],
  loaded: false,
  setEntry: (entry) => set({ entry }),
  setMoments: (moments) => set({ moments }),
  addMoment: (moment) => set((s) => ({ moments: [...s.moments, moment] })),
  patchMoment: (id, patch) => set((s) => ({
    moments: s.moments.map(m => (m.id === id ? { ...m, ...patch } : m)),
  })),
  setLoaded: () => set({ loaded: true }),
}))
