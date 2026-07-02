import { create } from 'zustand'

const STORAGE_KEY = 'mosaic_theme'

export type ThemeMode = 'light' | 'dark'

// Matches bg-base / bg-base-dark in tailwind.config.ts — kept in sync with
// the <meta name="theme-color"> tag so the OS chrome (status bar, task
// switcher) never shows a color seam against the page.
const THEME_COLOR: Record<ThemeMode, string> = {
  light: '#FAF3E7',
  dark: '#121212',
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function readStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
  } catch {}
  // No explicit choice yet — start from the OS preference so nobody who
  // already gets dark mode automatically sees a regression on first load.
  return systemPrefersDark() ? 'dark' : 'light'
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const initialTheme = readStoredTheme()
// Defensive — index.html's inline blocking script already applies this
// before paint; re-applying here is a no-op unless something diverged.
applyTheme(initialTheme)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}))
