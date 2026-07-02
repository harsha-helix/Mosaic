import { motion } from 'framer-motion'

interface RememberToggleProps {
  value: boolean
  onChange: (v: boolean) => void
}

export function RememberToggle({ value, onChange }: RememberToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 py-1"
      aria-label={value ? 'Remembered' : 'Remember this'}
    >
      <motion.span
        className="text-xl"
        style={{ display: 'inline-block', color: value ? '#C9A24B' : '#9A8E7E' }}
        animate={{
          scale: value ? 1.2 : 1,
          rotate: value ? [0, -18, 14, -8, 0] : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        {value ? '★' : '☆'}
      </motion.span>
      <span className="text-[13px] text-muted dark:text-muted-dark">Remember</span>
    </button>
  )
}
