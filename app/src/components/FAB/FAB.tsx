interface FABProps {
  onClick: () => void
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Add moment"
      className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full bg-terracotta shadow-fab dark:shadow-fab-dark flex items-center justify-center text-2xl font-display font-medium active:scale-90 transition-transform lg:hidden"
      style={{ color: '#3D1F12' }}
    >
      +
    </button>
  )
}
