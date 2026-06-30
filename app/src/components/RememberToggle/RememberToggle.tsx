interface RememberToggleProps {
  value: boolean
  onChange: (v: boolean) => void
}

export function RememberToggle({ value, onChange }: RememberToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 py-1 transition-transform active:scale-95"
      aria-label={value ? 'Remembered' : 'Remember this'}
    >
      <span
        className="text-xl transition-all duration-200"
        style={{
          color: value ? '#FFD93D' : '#AAAAAA',
          transform: value ? 'scale(1.2)' : 'scale(1)',
          display: 'inline-block',
        }}
      >
        {value ? '★' : '☆'}
      </span>
      <span className="text-[13px] text-[#666666] dark:text-[#999999]">Remember</span>
    </button>
  )
}
