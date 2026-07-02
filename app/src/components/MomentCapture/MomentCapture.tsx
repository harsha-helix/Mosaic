import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MomentType } from '../../types'
import { MOMENT_COLORS, MOMENT_PLACEHOLDERS, REMEMBER_DEFAULTS, generateMomentId } from '../../types'
import { RememberToggle } from '../RememberToggle/RememberToggle'
import { MomentIcon } from '../icons/Icons'
import { textOnAccent } from '../../lib/theme'
import { appendMoment, enqueueSyncItem, saveThumbnail } from '../../lib/db/queries'
import { pushMoments, pushMedia } from '../../lib/drive/operations'
import { processForUpload, makeThumbnail } from '../../lib/media'
import { silentSignIn } from '../../lib/drive/client'
import { useTodayStore } from '../../store/today'

const MOMENT_TYPES: MomentType[] = [
  'photo', 'beautiful', 'idea',
  'gratitude', 'anxiety', 'conversation',
  'reading', 'music', 'quote',
  'workout', 'coffee', 'nicotine',
  'place', 'insight',
]

const TYPE_LABELS: Record<MomentType, string> = {
  photo: 'Photo', beautiful: 'Beautiful', idea: 'Idea',
  gratitude: 'Gratitude', anxiety: 'Anxiety', conversation: 'Convo',
  reading: 'Reading', music: 'Music', quote: 'Quote',
  workout: 'Workout', coffee: 'Coffee', nicotine: 'Nicotine',
  place: 'Place', insight: 'Insight',
}

// Bottom sheet: spring up on open (~250ms), ease-in down on dismiss (~200ms)
// (spec §Motion table: "Bottom sheet open" / "Bottom sheet dismiss")
const SHEET_VARIANTS = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 32 } },
  exit: { y: '100%', transition: { duration: 0.2, ease: 'easeIn' as const } },
}

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// Step 1 -> Step 2 content swap: slide up (spec: "Tap -> slide up to Step 2")
const STEP_VARIANTS = {
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.18, ease: 'easeOut' as const } },
  exit: { y: -16, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' as const } },
}

interface MomentCaptureProps {
  onClose: () => void
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

export function MomentCapture({ onClose }: MomentCaptureProps) {
  const [step, setStep] = useState<'picker' | 'capture'>('picker')
  const [type, setType] = useState<MomentType | null>(null)
  const [text, setText] = useState('')
  const [remember, setRemember] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // Set right before closing — renders a tiny tile that shares a layoutId with
  // the tile Home's Today mosaic strip renders for the same moment, so
  // Framer Motion animates one flying into the other (spec §4: "Instant
  // visual — Mosaic tile"). Only visible for the brief window between save
  // and the sheet closing.
  const [flyingTile, setFlyingTile] = useState<{ id: string; color: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addMoment } = useTodayStore()

  function selectType(t: MomentType) {
    setType(t)
    setRemember(REMEMBER_DEFAULTS[t] ?? false)
    setText('')
    setPhoto(null)
    setPhotoPreview(null)
    setStep('capture')
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!type) return
    if (!text.trim() && !photo) return
    setSaving(true)

    const date = todayDate()
    const id = generateMomentId()
    const color = MOMENT_COLORS[type]

    const moment = {
      id,
      captured_at: new Date().toISOString(),
      type,
      text: text.trim() || '',
      ...(remember && { remember: true }),
      ...(photo && { media_id: id }),
    }

    const updated = await appendMoment(date, moment)
    addMoment(moment)

    // On failure, queue for retry on next app open / reconnect.
    silentSignIn()
      .then(() => pushMoments(date, updated))
      .catch(() => enqueueSyncItem('moments', 'moments/' + date + '.json', JSON.stringify(updated)))

    if (photo) {
      // Downscale before storing or uploading (docs/11 D4): a raw camera
      // photo is 3–8 MB and routinely fails to finish uploading on a mobile
      // connection; ~1600px JPEG is 200–500 KB. The thumbnail goes straight
      // to IndexedDB so this photo renders instantly in every list, offline,
      // without ever re-fetching from Drive.
      const { blob: upload, ext } = await processForUpload(photo)
      makeThumbnail(upload).then(t => { if (t) saveThumbnail(id, t).catch(() => {}) })
      silentSignIn()
        .then(() => pushMedia(id, upload, ext))
        .catch(() => enqueueSyncItem('media', 'media/' + id + '.' + ext, upload))
    }

    // Give the tile-drop shared-layout animation a moment to register
    // against Home's Today strip (if Home is mounted underneath) before the
    // sheet's own exit animation starts — total added delay is small enough
    // to stay well under the spec's <10s capture target.
    setFlyingTile({ id, color })
    setTimeout(onClose, 90)
  }

  const color = type ? MOMENT_COLORS[type] : 'var(--color-terracotta)'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        className="absolute inset-0 bg-black/40"
        variants={BACKDROP_VARIANTS}
        onClick={onClose}
      />

      {flyingTile && (
        <motion.div
          layoutId={`mosaic-tile-${flyingTile.id}`}
          className="absolute bottom-24 right-8 w-4 h-4 rounded-[4px] pointer-events-none"
          style={{ backgroundColor: flyingTile.color }}
        />
      )}

      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-sheet pb-8 pt-3 px-4 max-h-[90vh] overflow-y-auto"
        variants={SHEET_VARIANTS}
      >
        <div className="w-10 h-1 bg-hairline dark:bg-hairline-dark rounded-full mx-auto mb-4" />

        <AnimatePresence mode="wait" initial={false}>
          {step === 'picker' ? (
            <motion.div key="picker" variants={STEP_VARIANTS} initial="initial" animate="animate" exit="exit">
              <h2 className="font-display text-[20px] font-semibold text-ink dark:text-ink-dark mb-5">
                What's happening?
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {MOMENT_TYPES.map(t => {
                  const c = MOMENT_COLORS[t]
                  return (
                    <button
                      key={t}
                      onClick={() => selectType(t)}
                      className="flex flex-col items-center gap-2 p-4 rounded-card active:scale-95 transition-transform"
                      style={{ backgroundColor: `color-mix(in srgb, ${c} 10%, transparent)` }}
                    >
                      <MomentIcon type={t} size={24} color={c} />
                      <span className="text-[12px] font-medium" style={{ color: c }}>
                        {TYPE_LABELS[t]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="capture" variants={STEP_VARIANTS} initial="initial" animate="animate" exit="exit">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep('picker')} className="text-terracotta text-[15px] font-medium">←</button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[13px] font-medium" style={{ color }}>{type && TYPE_LABELS[type]}</span>
                </div>
              </div>

              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={type ? MOMENT_PLACEHOLDERS[type] : ''}
                rows={4}
                className="w-full px-4 py-3 rounded-input border border-hairline dark:border-hairline-dark bg-base dark:bg-base-dark text-ink dark:text-ink-dark text-[15px] outline-none focus:border-terracotta resize-none transition-colors mb-3"
              />

              {photoPreview && (
                <div className="mb-3 relative">
                  <img src={photoPreview} alt="preview" className="w-full max-h-48 object-cover rounded-input" />
                  <button
                    onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >×</button>
                </div>
              )}

              <button onClick={() => fileRef.current?.click()} className="text-[13px] text-muted dark:text-muted-dark mb-3 flex items-center gap-1.5">
                <MomentIcon type="photo" size={15} color="currentColor" /> Add photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

              <hr className="border-hairline dark:border-hairline-dark mb-3" />

              <div className="flex items-center justify-between">
                <RememberToggle value={remember} onChange={setRemember} />
                <button
                  onClick={handleSave}
                  disabled={saving || (!text.trim() && !photo)}
                  className="px-8 py-3 rounded-btn font-display font-semibold text-[15px] disabled:opacity-40 active:scale-[0.98] transition-all"
                  style={{
                    backgroundColor: color,
                    color: textOnAccent(color),
                    boxShadow: 'inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)',
                  }}
                >
                  {saving ? '…' : 'Save'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
