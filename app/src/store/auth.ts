import { create } from 'zustand'
import { clearFileIndex } from '../lib/db/queries'
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
    // Clear IDB file index and in-memory folder IDs so the next onboarding starts fresh
    clearFileIndex().catch(console.warn)
    resetFolderIds()
    set({ isSignedIn: false, displayName: '' })
  },
}))
