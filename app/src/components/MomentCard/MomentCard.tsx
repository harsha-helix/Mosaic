import type { Moment } from '../../types'
import { MOMENT_COLORS } from '../../types'
import { PhotoThumbnail } from '../PhotoThumbnail/PhotoThumbnail'
import { useLightboxStore } from '../../store/lightbox'

interface MomentCardProps {
  moment: Moment
  variant?: 'default' | 'compact'
  /** Search passes pre-highlighted (query-matched) HTML instead of plain text */
  highlightHtml?: string
  /** 'time' (Day View — same-day context), 'date' (Search), 'datetime' (Highlights) */
  dateFormat?: 'time' | 'date' | 'datetime'
  onClick?: () => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function MomentCard({ moment, variant = 'default', highlightHtml, dateFormat = 'datetime', onClick }: MomentCardProps) {
  const openLightbox = useLightboxStore(s => s.open)
  const color = MOMENT_COLORS[moment.type] ?? 'var(--color-hint)'
  const label = moment.type.charAt(0).toUpperCase() + moment.type.slice(1)
  const compact = variant === 'compact'

  const dateLabel =
    dateFormat === 'time'     ? formatTime(moment.captured_at) :
    dateFormat === 'date'     ? formatDate(moment.captured_at) :
    `${formatDate(moment.captured_at)} · ${formatTime(moment.captured_at)}`

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      className={
        (onClick ? 'w-full text-left ' : '') +
        'bg-surface dark:bg-surface-dark shadow-card dark:shadow-card-dark ' +
        (compact ? 'rounded-btn-sm p-3' : 'rounded-card p-4')
      }
      style={{ borderLeft: '3px solid ' + color }}
    >
      <div className={'flex items-center justify-between ' + (compact ? 'mb-0.5' : 'mb-2')}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className={compact ? 'text-[12px] font-medium' : 'text-[13px] font-medium'} style={{ color }}>{label}</span>
          <span className={compact ? 'text-[11px] text-hint dark:text-hint-dark' : 'text-[12px] text-hint dark:text-hint-dark'}>
            {dateFormat === 'date' ? '· ' : ''}{dateLabel}
          </span>
        </div>
        {moment.remember && <span className="text-warmth flex-shrink-0" style={{ fontSize: compact ? 14 : 16 }}>★</span>}
      </div>

      {highlightHtml ? (
        <p
          className={(compact ? 'text-[13px] ' : 'text-[14px] ') + 'text-muted dark:text-muted-dark leading-relaxed line-clamp-3'}
          dangerouslySetInnerHTML={{ __html: highlightHtml }}
        />
      ) : moment.text ? (
        <p className={(compact ? 'text-[13px] mt-1 line-clamp-2' : 'text-[14px] mt-1 line-clamp-3') + ' text-muted dark:text-muted-dark leading-relaxed'}>
          {moment.text}
        </p>
      ) : null}

      {moment.media_id && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); openLightbox(moment) }}
          className="block w-full mt-2"
          aria-label="Open photo"
        >
          <PhotoThumbnail
            mediaId={moment.media_id}
            className={'w-full object-cover rounded-input ' + (compact ? 'max-h-32' : 'max-h-48')}
          />
        </button>
      )}
    </Wrapper>
  )
}
