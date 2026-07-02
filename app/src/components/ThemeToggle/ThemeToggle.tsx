import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../store/theme'
import { SunIcon, MoonIcon } from '../icons/Icons'

// Pill switch, track + sliding thumb — same tactile language as
// RememberToggle (scale/rotate pop on state change) rather than a flat
// on/off checkbox. Track colors are the light/dark hairline tokens so the
// control reads as part of the paper palette in either theme.
export function ThemeToggle() {
  const theme = useThemeStore(s => s.theme)
  const setTheme = useThemeStore(s => s.setTheme)
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative w-[52px] h-[30px] shrink-0 rounded-pill flex items-center px-[3px] transition-colors duration-200"
      style={{ backgroundColor: isDark ? '#4A3B2A' : '#E5D9C6' }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: isDark ? '#2C2318' : '#FFFBF3',
          marginLeft: isDark ? 22 : 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ scale: 0.4, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.4, rotate: 25, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'inline-flex' }}
          >
            {isDark ? <MoonIcon size={13} color="#D2BEA3" /> : <SunIcon size={13} color="#C9A24B" />}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  )
}
