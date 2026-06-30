import type { Moment } from '../../types'
import { MOMENT_COLORS, MOMENT_EMOJIS } from '../../types'

interface MomentCardProps {
  moment: Moment
  compact?: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function MomentCard({ moment, compact = false }: MomentCardProps) {
  const color = MOMENT_COLORS[moment.type]
  const emoji = MOMENT_EMOJIS[moment.type]
  const label = moment.type.charAt(0).toUpperCase() + moment.type.slice(1)

  if (compact) {
    return (
      <div
        className="bg-white dark:bg-[#1E1E1E] rounded-[16px] p-3 flex gap-3"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <span className="text-base leading-none mt-0.5">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-medium" style={{ color }}>{label}</span>
            <span className="text-[11px] text-[#AAAAAA] shrink-0">{formatTime(moment.captured_at)}</span>
          </div>
          <p className="text-[13px] text-[#111111] dark:text-[#F0F0F0] mt-0.5 line-clamp-2">{moment.text}</p>
        </div>
        {moment.remember && <span className="text-[#FFD93D] text-sm self-start">★</span>}
      </div>
    )
  }

  return (
    <div
      className="bg-white dark:bg-[#1E1E1E] rounded-[16px] p-4"
      style={{
        borderLeft: `3px solid ${color}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[13px] font-medium" style={{ color }}>{label}</span>
          <span className="text-[12px] text-[#AAAAAA]">
            {formatDate(moment.captured_at)} · {formatTime(moment.captured_at)}
          </span>
        </div>
        {moment.remember && <span className="text-[#FFD93D]">★</span>}
      </div>

      {/* Text */}
      <p className="text-[15px] text-[#111111] dark:text-[#F0F0F0] leading-relaxed">{moment.text}</p>
    </div>
  )
}
