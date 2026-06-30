import { create } from 'zustand'

type SyncStatus = 'idle' | 'syncing' | 'error'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: string | null
  setStatus: (s: SyncStatus) => void
  setSynced: (at: string) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  setStatus: (status) => set({ status }),
  setSynced: (at) => set({ status: 'idle', lastSyncedAt: at }),
}))
