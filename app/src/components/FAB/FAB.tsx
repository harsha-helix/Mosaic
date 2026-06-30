interface FABProps {
  onClick: () => void
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Add moment"
      className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full bg-[#7C4DFF] text-white flex items-center justify-center text-2xl font-light active:scale-90 transition-transform"
      style={{ boxShadow: '0 4px 20px rgba(124,77,255,0.4)' }}
    >
      +
    </button>
  )
}
