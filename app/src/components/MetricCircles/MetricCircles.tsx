interface MetricCirclesProps {
  value: number | undefined   // 1–10, undefined = none selected
  onChange: (v: number | undefined) => void
  color: string               // hex, e.g. '#FF6B6B'
  label: string
}

export function MetricCircles({ value, onChange, color, label }: MetricCirclesProps) {
  function handleTap(n: number) {
    // Tap same number → deselect; tap new number → select 1..n
    onChange(value === n ? undefined : n)
  }

  return (
    <div className="space-y-2">
      <p className="text-[15px] font-medium text-[#111111] dark:text-[#F0F0F0]">{label}</p>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const filled = value !== undefined && n <= value
          return (
            <button
              key={n}
              onClick={() => handleTap(n)}
              aria-label={`${label} ${n}`}
              className="w-7 h-7 rounded-full border-2 flex-shrink-0 transition-transform active:scale-90"
              style={{
                backgroundColor: filled ? color : 'transparent',
                borderColor: filled ? color : '#E8E8E8',
              }}
            />
          )
        })}
      </div>
      <div className="flex justify-between px-0.5">
        <span className="text-[11px] text-[#AAAAAA]">1</span>
        <span className="text-[11px] text-[#AAAAAA]">5</span>
        <span className="text-[11px] text-[#AAAAAA]">10</span>
      </div>
    </div>
  )
}
