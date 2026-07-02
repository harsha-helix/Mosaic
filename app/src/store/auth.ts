import { create } from 'zustand'
import { resetFolderIds } from '../lib/drive/fileIndex'

const STORAGE_KEY = 'mosaic_auth'

function readStorage(): { isSignedIn: boolean; displayName: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { isSignedIn: false, displayName: '' }
}

interface AuthState {
  isSignedIn: boolean
  displayName: string
  setSignedIn: (name: string) => void
  setSignedOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  ...readStorage(),
  setSignedIn: (name) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ isSignedIn: true, displayName: name })) } catch {}
    set({ isSignedIn: true, displayName: name })
  },
  setSignedOut: () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    // Reset only the in-memory folder IDs. The IndexedDB file index and data
    // stores are deliberately KEPT (docs/11 D5): clearing the index on
    // sign-out was what forced full re-bootstraps, and a bootstrap running
    // with an empty index is exactly the path that created 8 duplicate
    // meta.json files on Drive. Sign-out revokes access, not local knowledge.
    resetFolderIds()
    set({ isSignedIn: false, displayName: '' })
  },
}))
