/**
 * The day's visual signature — a 4-axis kite/radar shape built from the
 * morning metrics (Mood, Energy, Anxiety, Excitement). Reused wherever a
 * day is referenced: right after "Save morning", the Today status strip,
 * the Day View header, and Highlights' day-commit cards.
 * See docs/07_UI_Specification.md §3 (Morning Check-in) — "Instant visual — Day Glyph".
 */
import { CLUSTER } from '../../lib/theme'

interface DayGlyphProps {
  mood?: number
  energy?: number
  anxiety?: number
  excitement?: number
  size?: number
  className?: string
  /** Play the pop-in scale-bounce (only on the Morning save moment) */
  animate?: boolean
}

const AXIS_COLOR = {
  mood: CLUSTER.warmth,
  energy: CLUSTER.body,
  anxiety: CLUSTER.anxiety,
  excitement: CLUSTER.reflective,
}

export function DayGlyph({ mood, energy, anxiety, excitement, size = 56, className, animate = false }: DayGlyphProps) {
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.42
  const dot = Math.max(2, size * 0.07)

  const frac = (v: number | undefined) => (v === undefined ? 0 : Math.max(0, Math.min(10, v)) / 10)

  const top    = { x: cx,                    y: cy - maxR * frac(mood) }
  const right  = { x: cx + maxR * frac(energy), y: cy }
  const bottom = { x: cx,                    y: cy + maxR * frac(anxiety) }
  const left   = { x: cx - maxR * frac(excitement), y: cy }

  const points = `${top.x},${top.y} ${right.x},${right.y} ${bottom.x},${bottom.y} ${left.x},${left.y}`

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={animate ? { animation: 'day-glyph-pop 200ms ease-out' } : undefined}
    >
      <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="var(--color-hairline)" strokeWidth="1" strokeDasharray="2 3" opacity={0.6} />
      <polygon points={points} fill="color-mix(in srgb, var(--color-terracotta) 15%, transparent)" stroke="var(--color-terracotta)" strokeWidth={Math.max(1, size * 0.02)} strokeLinejoin="round" />
      {mood !== undefined && <circle cx={top.x} cy={top.y} r={dot} fill={AXIS_COLOR.mood} />}
      {energy !== undefined && <circle cx={right.x} cy={right.y} r={dot} fill={AXIS_COLOR.energy} />}
      {anxiety !== undefined && <circle cx={bottom.x} cy={bottom.y} r={dot} fill={AXIS_COLOR.anxiety} />}
      {excitement !== undefined && <circle cx={left.x} cy={left.y} r={dot} fill={AXIS_COLOR.excitement} />}
      <circle cx={cx} cy={cy} r={dot * 0.7} fill="var(--color-terracotta)" />
      <style>{`
        @keyframes day-glyph-pop {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </svg>
  )
}
