import { create } from 'zustand'

interface AuthState {
  isSignedIn: boolean
  displayName: string
  setSignedIn: (name: string) => void
  setSignedOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isSignedIn: false,
  displayName: '',
  setSignedIn: (name) => set({ isSignedIn: true, displayName: name }),
  setSignedOut: () => set({ isSignedIn: false, displayName: '' }),
}))
