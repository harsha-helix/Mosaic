import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MomentType } from '../../types'
import { MOMENT_COLORS, MOMENT_PLACEHOLDERS, REMEMBER_DEFAULTS, generateMomentId } from '../../types'
import { RememberToggle } from '../RememberToggle/RememberToggle'
import { MomentIcon } from '../icons/Icons'
import { textOnAccent } from '../../lib/theme'
import { appendMoment, updateMoment, enqueueSyncItem, saveThumbnail } from '../../lib/db/queries'
import { pushMoments, pushMedia } from '../../lib/drive/operations'
import { processForUpload, makeThumbnail } from '../../lib/media'
import { silentSignIn } from '../../lib/drive/client'
import { useTodayStore } from '../../store/today'
import { useIsDesktop } from '../../lib/useIsDesktop'

// Grouped picker (docs/12_Capture_UX_Grouped_Grid.md): 14 types organized
// into 4 fixed, semantic groups so the eye scans a group first, then a
// type — spatial memory instead of a full-grid search every time. Order
// and membership are fixed (no frecency reordering) by design.
const GROUPS: { label: string; types: MomentType[] }[] = [
  { label: 'Mind',           types: ['idea', 'insight', 'gratitude', 'anxiety'] },
  { label: 'World',          types: ['beautiful', 'photo', 'place', 'music'] },
  { label: 'Words & People', types: ['conversation', 'quote', 'reading'] },
  { label: 'Body',           types: ['coffee', 'nicotine', 'workout'] },
]

// Body types are usually logged with no text — tapping the type saves a
// text-less moment immediately instead of opening the capture screen
// (doc 12 "Quick-log for Body types"): FAB → type is the full 2-tap flow.
const QUICK_LOG_TYPES: MomentType[] = ['coffee', 'nicotine', 'workout']

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

// Desktop dialog: scale+fade in place of the slide-up sheet (docs/14
// §Full-screen flows → Dialogs: "conventional desktop dialog motion").
// Picked at runtime via useIsDesktop() rather than a CSS-only swap because
// these are transform/opacity values driven by Framer Motion, not classes.
const DIALOG_VARIANTS = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.18, ease: 'easeOut' as const } },
  exit: { scale: 0.96, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
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
  const [step, setStep] = useState<'picker' | 'capture' | 'quicklog'>('picker')
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
  // Set when a body-type quick-log just saved — drives the "logged · add
  // note?" confirmation panel (doc 12). editingMomentId, when set, means the
  // capture screen is annotating that already-saved moment rather than
  // creating a new one.
  const [quickLogged, setQuickLogged] = useState<{ id: string; type: MomentType } | null>(null)
  const [editingMomentId, setEditingMomentId] = useState<string | null>(null)
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addMoment, patchMoment } = useTodayStore()
  const isDesktop = useIsDesktop()

  // Esc-to-dismiss — a desktop dialog convention (docs/14), harmless as an
  // extra escape hatch on mobile too since there's no dedicated keyboard there.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => () => { if (autoCloseRef.current) clearTimeout(autoCloseRef.current) }, [])

  function selectType(t: MomentType) {
    if (QUICK_LOG_TYPES.includes(t)) { quickLog(t); return }
    setType(t)
    setRemember(REMEMBER_DEFAULTS[t] ?? false)
    setText('')
    setPhoto(null)
    setPhotoPreview(null)
    setStep('capture')
  }

  // Body types (coffee/nicotine/workout) save immediately with no text —
  // FAB → type is the whole flow (doc 12). Confirmation panel offers an
  // optional "Add note" follow-up; otherwise the sheet auto-closes.
  async function quickLog(t: MomentType) {
    const date = todayDate()
    const id = generateMomentId()
    const color = MOMENT_COLORS[t]

    const moment = { id, captured_at: new Date().toISOString(), type: t, text: '' }
    const updated = await appendMoment(date, moment)
    addMoment(moment)

    silentSignIn()
      .then(() => pushMoments(date, updated))
      .catch(() => enqueueSyncItem('moments', 'moments/' + date + '.json', JSON.stringify(updated)))

    setFlyingTile({ id, color })
    setQuickLogged({ id, type: t })
    setStep('quicklog')

    autoCloseRef.current = setTimeout(onClose, 1600)
  }

  function addNoteToQuickLog() {
    if (!quickLogged) return
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
    setEditingMomentId(quickLogged.id)
    setType(quickLogged.type)
    setRemember(false)
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
    if (!editingMomentId && !text.trim() && !photo) return
    setSaving(true)

    const date = todayDate()
    // Annotating a quick-logged body moment reuses its id (so photo's
    // media_id convention — same id as the moment — still holds); otherwise
    // this is a brand new moment.
    const id = editingMomentId ?? generateMomentId()
    const color = MOMENT_COLORS[type]

    let updated: Awaited<ReturnType<typeof appendMoment>>

    if (editingMomentId) {
      const patch = {
        text: text.trim(),
        ...(remember && { remember: true }),
        ...(photo && { media_id: id }),
      }
      updated = await updateMoment(date, id, patch)
      patchMoment(id, patch)
    } else {
      const moment = {
        id,
        captured_at: new Date().toISOString(),
        type,
        text: text.trim() || '',
        ...(remember && { remember: true }),
        ...(photo && { media_id: id }),
      }
      updated = await appendMoment(date, moment)
      addMoment(moment)
    }

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

    if (editingMomentId) {
      // Tile already flew to the mosaic strip when this moment was
      // quick-logged — just close, no second animation.
      onClose()
      return
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
      className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center"
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
        className="relative bg-surface dark:bg-surface-dark rounded-t-sheet pb-8 pt-3 px-4 max-h-[90vh] overflow-y-auto lg:w-full lg:max-w-[480px] lg:rounded-card lg:shadow-card lg:dark:shadow-card-dark lg:max-h-[85vh] lg:p-6"
        variants={isDesktop ? DIALOG_VARIANTS : SHEET_VARIANTS}
      >
        <div className="w-10 h-1 bg-hairline dark:bg-hairline-dark rounded-full mx-auto mb-4 lg:hidden" />

        <AnimatePresence mode="wait" initial={false}>
          {step === 'picker' ? (
            <motion.div key="picker" variants={STEP_VARIANTS} initial="initial" animate="animate" exit="exit">
              <h2 className="font-display text-[20px] font-semibold text-ink dark:text-ink-dark mb-5">
                What's happening?
              </h2>
              {GROUPS.map((group, gi) => (
                <div key={group.label} className={gi > 0 ? 'mt-3' : ''}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-hint dark:text-hint-dark mb-2">
                    {group.label}
                  </p>
                  <div className={'grid gap-3 ' + (group.types.length === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
                    {group.types.map(t => {
                      const c = MOMENT_COLORS[t]
                      return (
                        <button
                          key={t}
                          onClick={() => selectType(t)}
                          className="flex flex-col items-center gap-2 p-3 rounded-card active:scale-95 transition-transform"
                          style={{ backgroundColor: `color-mix(in srgb, ${c} 10%, transparent)` }}
                        >
                          <MomentIcon type={t} size={22} color={c} />
                          <span className="text-[11px] font-medium" style={{ color: c }}>
                            {TYPE_LABELS[t]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : step === 'quicklog' && quickLogged ? (
            <motion.div key="quicklog" variants={STEP_VARIANTS} initial="initial" animate="animate" exit="exit" className="py-6 flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `color-mix(in srgb, ${MOMENT_COLORS[quickLogged.type]} 14%, transparent)` }}
              >
                <MomentIcon type={quickLogged.type} size={26} color={MOMENT_COLORS[quickLogged.type]} />
              </div>
              <p className="font-display text-[16px] font-semibold text-ink dark:text-ink-dark">
                {TYPE_LABELS[quickLogged.type]} logged
              </p>
              <button
                onClick={addNoteToQuickLog}
                className="mt-4 text-[14px] font-medium"
                style={{ color: 'var(--color-terracotta)' }}
              >
                Add note
              </button>
            </motion.div>
          ) : (
            <motion.div key="capture" variants={STEP_VARIANTS} initial="initial" animate="animate" exit="exit">
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => (editingMomentId ? onClose() : setStep('picker'))}
                  className="text-terracotta text-[15px] font-medium"
                >←</button>
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
