import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useLightboxStore } from '../../store/lightbox'
import { resolveMediaUrl } from '../../lib/drive/mediaCache'
import { formatDateLabel, formatTime } from '../../lib/utils'

const DRAG_CLOSE_OFFSET = 110
const DRAG_CLOSE_VELOCITY = 500
const DRAG_RANGE = 220

function CloseIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <path d="M2 2L14 14M14 2L2 14" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Full-screen photo overlay (docs/16 §3, refined per follow-up feedback).
 * Opened from anywhere via useLightboxStore.open(moment) — mounted once in
 * App.tsx. Blurred near-black scrim, photo lifted with a soft shadow,
 * drag-down to dismiss with live visual follow (scale + scrim fade), tap
 * scrim or X to close. Background is fully inert while open: page scroll is
 * locked and Tab is trapped on the close button. No cross-photo swipe or
 * pinch-zoom (explicitly out of scope for this pass).
 */
export function Lightbox() {
  const moment = useLightboxStore(s => s.moment)
  const close = useLightboxStore(s => s.close)
  const [url, setUrl] = useState<string | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Drag-down-to-dismiss position — also drives the live scale + scrim
  // fade below, so the gesture visibly does something instead of only
  // resolving on release.
  const y = useMotionValue(0)
  const dragScale = useTransform(y, [0, DRAG_RANGE], [1, 0.85])
  const scrimColor = useTransform(
    y,
    [0, DRAG_RANGE],
    ['rgba(10,10,10,0.94)', 'rgba(10,10,10,0.35)']
  )

  useEffect(() => {
    if (!moment?.media_id) { setUrl(null); return }
    let cancelled = false
    setUrl(null)
    resolveMediaUrl(moment.media_id).then(u => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [moment?.media_id])

  // Lock page scroll behind the overlay while it's open (including the iOS
  // rubber-band case, where a fixed overlay alone doesn't stop the page
  // underneath from scrolling on touch).
  useEffect(() => {
    if (!moment) return
    const prevOverflow = document.body.style.overflow
    const prevTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouchAction
    }
  }, [Boolean(moment)])

  // Move focus into the dialog on open, and trap Tab there — the close
  // button is the only focusable control, so keeping focus pinned to it is
  // a complete trap for this case without pulling in a focus-trap library.
  useEffect(() => {
    if (!moment) return
    closeBtnRef.current?.focus()

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { close(); return }
      if (e.key === 'Tab') { e.preventDefault(); closeBtnRef.current?.focus() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [moment, close])

  return (
    <AnimatePresence>
      {moment && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
        >
          {/* Scrim: blurred + near-black, fades toward transparent live as
              the photo is dragged down (docs feedback #1/#2). */}
          <motion.div
            className="absolute inset-0 backdrop-blur-md"
            style={{ backgroundColor: scrimColor }}
          />

          <button
            ref={closeBtnRef}
            onClick={e => { e.stopPropagation(); close() }}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/12 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <CloseIcon />
          </button>

          <motion.div
            className="relative z-[1] flex flex-col items-center max-w-full max-h-full"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.22, delay: 0.05, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              className="flex flex-col items-center"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.7}
              style={{ y, scale: dragScale }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > DRAG_CLOSE_OFFSET || info.velocity.y > DRAG_CLOSE_VELOCITY) close()
              }}
            >
              {url ? (
                <img
                  src={url}
                  alt={moment.text || 'Photo'}
                  className="max-w-full max-h-[75vh] object-contain rounded-card"
                  style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)' }}
                />
              ) : (
                <div
                  className="w-72 h-72 max-w-full rounded-card bg-elevated-dark animate-pulse"
                  style={{ boxShadow: '0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)' }}
                />
              )}

              {(moment.text || moment.captured_at) && (
                <div className="mt-5 text-center max-w-sm px-2">
                  {moment.text && (
                    <p className="font-display text-[16px] text-ink-dark leading-relaxed">{moment.text}</p>
                  )}
                  <p className="text-[12px] text-hint-dark mt-2">
                    {formatDateLabel(moment.captured_at.slice(0, 10))} &middot; {formatTime(moment.captured_at)}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
