import type { ReactElement } from 'react'
import type { MomentType } from '../../types'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  xmlns: 'http://www.w3.org/2000/svg',
})

/* ── Nav icons ──────────────────────────────────────────────────────────── */

export function HomeIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill={color}>
      <path d="M12 2.5 2.5 10.5V21.5h6.2v-6.8h6.6v6.8h6.2V10.5L12 2.5Z" />
    </svg>
  )
}

export function HighlightsIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill={color}>
      <path d="M12 2c.6 3.6 1.9 5.9 5.5 6.5-3.6.6-4.9 2.9-5.5 6.5-.6-3.6-1.9-5.9-5.5-6.5C10.1 7.9 11.4 5.6 12 2Z" />
      <path d="M19 15c.3 1.8.9 2.9 2.7 3.2-1.8.3-2.4 1.4-2.7 3.2-.3-1.8-.9-2.9-2.7-3.2 1.8-.3 2.4-1.4 2.7-3.2Z" />
    </svg>
  )
}

export function InsightsIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill={color}>
      <rect x="3.5" y="13" width="4" height="8" rx="1" />
      <rect x="10" y="8" width="4" height="13" rx="1" />
      <rect x="16.5" y="4" width="4" height="17" rx="1" />
    </svg>
  )
}

export function SearchIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke={color} strokeWidth="2.4" />
      <line x1="15.3" y1="15.3" x2="20.5" y2="20.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function SettingsIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill={color} fillRule="evenodd">
      <path d="M12 1.5 14 3.6l2.8-.6 1 2.7 2.7 1-.6 2.8 2.1 2-2.1 2 .6 2.8-2.7 1-1 2.7-2.8-.6L12 22.5l-2-2.1-2.8.6-1-2.7-2.7-1 .6-2.8-2.1-2 2.1-2-.6-2.8 2.7-1 1-2.7 2.8.6L12 1.5Z" />
      <circle cx="12" cy="12" r="4.2" fill="#FFFFFF" fillOpacity="0.6" />
    </svg>
  )
}

/* ── Theme icons ────────────────────────────────────────────────────────── */

export function SunIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill={color}>
      <circle cx="12" cy="12" r="4.6" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <rect key={a} x="11.15" y="1.4" width="1.7" height="4" rx="0.85" transform={`rotate(${a} 12 12)`} />
      ))}
    </svg>
  )
}

export function MoonIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill={color}>
      <path d="M20.2 14.9A8.6 8.6 0 1 1 9.4 4.1a7 7 0 0 0 10.8 10.8Z" />
    </svg>
  )
}

/* ── Moment-type icons ──────────────────────────────────────────────────── */

function PhotoIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color} fillRule="evenodd">
      <path d="M8.5 4.5 7.3 6.5H3.8A1.3 1.3 0 0 0 2.5 7.8v11A1.3 1.3 0 0 0 3.8 20h16.4a1.3 1.3 0 0 0 1.3-1.3v-11a1.3 1.3 0 0 0-1.3-1.3h-3.5l-1.2-2H8.5Z" />
      <circle cx="12" cy="13" r="3.6" fill="#FFFFFF" fillOpacity="0.6" />
    </svg>
  )
}

function BeautifulIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse
          key={a}
          cx="12" cy="7.2" rx="3" ry="4.4"
          transform={`rotate(${a} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" fillOpacity="0.6" />
    </svg>
  )
}

function IdeaIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <path d="M12 2.8a6.2 6.2 0 0 0-3.7 11.2c.7.5 1.1 1.2 1.1 2v.5h5.2v-.5c0-.8.4-1.5 1.1-2A6.2 6.2 0 0 0 12 2.8Z" />
      <rect x="9.4" y="18" width="5.2" height="1.7" rx="0.8" />
      <rect x="9.9" y="20.2" width="4.2" height="1.5" rx="0.7" />
    </svg>
  )
}

function GratitudeIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <path d="M12 20.3 4.9 13c-2-2.1-2-5.1-.2-7 1.8-1.8 4.5-1.7 6.2.2l1.1 1.2 1.1-1.2c1.7-1.9 4.4-2 6.2-.2 1.8 1.9 1.8 4.9-.2 7L12 20.3Z" />
    </svg>
  )
}

function AnxietyIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill="none">
      <path
        d="M2.5 12c1.6 0 1.6-4 3.2-4s1.6 4 3.2 4 1.6-4 3.2-4 1.6 4 3.2 4 1.6-4 3.2-4 1.6 4 3.2 4"
        stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function ConversationIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v9A1.5 1.5 0 0 1 19.5 16H9l-4 4v-4H4.5A1.5 1.5 0 0 1 3 14.5v-9Z" />
    </svg>
  )
}

function ReadingIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <path d="M12 5.2c-1.6-1.2-4-1.7-7-1.2v13c3 -.5 5.4 0 7 1.2V5.2Z" />
      <path d="M12 5.2c1.6-1.2 4-1.7 7-1.2v13c-3-.5-5.4 0-7 1.2V5.2Z" />
    </svg>
  )
}

function MusicIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <rect x="10.6" y="3" width="1.9" height="13.5" rx="0.6" />
      <path d="M12.5 3 19 4.6v3l-6.5-1.6V3Z" />
      <circle cx="8.4" cy="17.6" r="3" />
      <circle cx="17" cy="15.8" r="3" />
    </svg>
  )
}

function QuoteIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <path d="M4 9.5c0-3 2-5 5-5.5l.6 1.6C7.8 6 7 7 7 8.3h2.6V14H4V9.5Z" />
      <path d="M13.4 9.5c0-3 2-5 5-5.5l.6 1.6c-1.8.4-2.6 1.4-2.6 2.7H19V14h-5.6V9.5Z" />
    </svg>
  )
}

function WorkoutIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <rect x="1.5" y="9.5" width="3" height="5" rx="1" />
      <rect x="19.5" y="9.5" width="3" height="5" rx="1" />
      <rect x="4.2" y="7.5" width="2.6" height="9" rx="1" />
      <rect x="17.2" y="7.5" width="2.6" height="9" rx="1" />
      <rect x="6.6" y="11" width="10.8" height="2" rx="1" />
    </svg>
  )
}

function CoffeeIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color} fillRule="evenodd">
      <path d="M4 8h13v6.5A4.5 4.5 0 0 1 12.5 19h-4A4.5 4.5 0 0 1 4 14.5V8Z" />
      <path d="M17 9.2h1.3a2.6 2.6 0 0 1 0 5.2H17v-1.8h1.3a.8.8 0 0 0 0-1.6H17V9.2Z" />
    </svg>
  )
}

function NicotineIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <rect x="2.5" y="11" width="16" height="4" rx="0.8" />
      <rect x="18" y="11" width="3.5" height="4" rx="0.8" opacity="0.55" />
    </svg>
  )
}

function PlaceIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color} fillRule="evenodd">
      <path d="M12 2.2c-4 0-7 3-7 6.8 0 5 7 12.8 7 12.8s7-7.8 7-12.8c0-3.8-3-6.8-7-6.8Z" />
      <circle cx="12" cy="9" r="2.6" fill="#FFFFFF" fillOpacity="0.6" />
    </svg>
  )
}

function InsightIcon({ size, color }: Required<Pick<IconProps, 'size' | 'color'>>) {
  return (
    <svg {...base(size)} fill={color}>
      <path d="M12 3.5c-3.5 0-6 2.5-6 5.6 0 2 1 3.5 2.4 4.6.5.4.8.9.8 1.5v.6h5.6v-.6c0-.6.3-1.1.8-1.5C16.9 12.6 18 11.1 18 9.1c0-3.1-2.5-5.6-6-5.6Z" />
      <rect x="9.2" y="17" width="5.6" height="1.6" rx="0.8" />
      <path d="M12 19.6c-.9 0-1.6.6-1.6 1.4h3.2c0-.8-.7-1.4-1.6-1.4Z" />
    </svg>
  )
}

const MOMENT_ICON_MAP: Record<MomentType, (p: Required<Pick<IconProps, 'size' | 'color'>>) => ReactElement> = {
  photo: PhotoIcon,
  beautiful: BeautifulIcon,
  idea: IdeaIcon,
  gratitude: GratitudeIcon,
  anxiety: AnxietyIcon,
  conversation: ConversationIcon,
  reading: ReadingIcon,
  music: MusicIcon,
  quote: QuoteIcon,
  workout: WorkoutIcon,
  coffee: CoffeeIcon,
  nicotine: NicotineIcon,
  place: PlaceIcon,
  insight: InsightIcon,
}

export function MomentIcon({ type, size = 22, color = 'currentColor', className }: IconProps & { type: MomentType }) {
  const Cmp = MOMENT_ICON_MAP[type]
  return (
    <span className={className} style={{ display: 'inline-flex', width: size, height: size }}>
      <Cmp size={size} color={color} />
    </span>
  )
}
