import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLightboxStore } from '../../store/lightbox'
import { resolveMediaUrl } from '../../lib/drive/mediaCache'
import { formatDateLabel, formatTime } from '../../lib/utils'

/**
 * Full-screen photo overlay (docs/16 §3). Opened from anywhere via
 * useLightboxStore.open(moment) — mounted once in App.tsx. Dark scrim,
 * photo centered/contained, tap-scrim or swipe-down to close, caption +
 * date shown below. No cross-photo swipe or pinch-zoom (explicitly out of
 * scope for this pass per the decision doc).
 */
export function Lightbox() {
  const moment = useLightboxStore(s => s.moment)
  const close = useLightboxStore(s => s.close)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!moment?.media_id) { setUrl(null); return }
    let cancelled = false
    setUrl(null)
    resolveMediaUrl(moment.media_id).then(u => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [moment?.media_id])

  useEffect(() => {
    if (!moment) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [moment, close])

  return (
    <AnimatePresence>
      {moment && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/92 px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={close}
        >
          <motion.div
            className="flex flex-col items-center max-w-full max-h-full"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.6}
            onDragEnd={(_e, info) => { if (info.offset.y > 100) close() }}
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {url ? (
              <img
                src={url}
                alt={moment.text || 'Photo'}
                className="max-w-full max-h-[75vh] object-contain rounded-input"
              />
            ) : (
              <div className="w-64 h-64 rounded-input bg-elevated-dark animate-pulse" />
            )}

            {(moment.text || moment.captured_at) && (
              <div className="mt-4 text-center max-w-sm">
                {moment.text && (
                  <p className="text-[15px] text-ink-dark leading-relaxed">{moment.text}</p>
                )}
                <p className="text-[12px] text-hint-dark mt-1.5">
                  {formatDateLabel(moment.captured_at.slice(0, 10))} &middot; {formatTime(moment.captured_at)}
                </p>
              </div>
            )}
          </motion.div>

          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white text-lg flex items-center justify-center"
          >
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
