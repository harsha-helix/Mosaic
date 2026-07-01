import { useState, useRef } from 'react'
import type { MomentType } from '../../types'
import { MOMENT_COLORS, MOMENT_EMOJIS, MOMENT_PLACEHOLDERS, REMEMBER_DEFAULTS, generateMomentId } from '../../types'
import { RememberToggle } from '../RememberToggle/RememberToggle'
import { appendMoment } from '../../lib/db/queries'
import { pushMoments, pushMedia } from '../../lib/drive/operations'
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

    silentSignIn()
      .then(() => pushMoments(date, updated))
      .catch(console.warn)

    if (photo) {
      const ext = photo.name.split('.').pop() ?? 'jpg'
      silentSignIn()
        .then(() => pushMedia(id, photo!, ext))
        .catch(console.warn)
    }

    onClose()
  }

  const color = type ? MOMENT_COLORS[type] : '#7C4DFF'

  // Step 1: Type Picker
  if (step === 'picker') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white dark:bg-[#1E1E1E] rounded-t-[24px] pb-8 pt-3 px-4 max-h-[90vh] overflow-y-auto">
          <div className="w-10 h-1 bg-[#E8E8E8] dark:bg-[#2E2E2E] rounded-full mx-auto mb-5" />
          <h2 className="font-display text-[20px] font-semibold text-[#111111] dark:text-[#F0F0F0] mb-5">
            What's happening?
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {MOMENT_TYPES.map(t => {
              const c = MOMENT_COLORS[t]
              return (
                <button
                  key={t}
                  onClick={() => selectType(t)}
                  className="flex flex-col items-center gap-2 p-4 rounded-[16px] active:scale-95 transition-transform"
                  style={{ backgroundColor: `${c}1A` }}
                >
                  <span className="text-2xl">{MOMENT_EMOJIS[t]}</span>
                  <span className="text-[12px] font-medium" style={{ color: c }}>
                    {TYPE_LABELS[t]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Capture
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1E1E1E] rounded-t-[24px] pb-8 pt-3 px-4">
        <div className="w-10 h-1 bg-[#E8E8E8] dark:bg-[#2E2E2E] rounded-full mx-auto mb-4" />

        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setStep('picker')} className="text-[#7C4DFF] text-[15px] font-medium">←</button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${color}1A` }}>
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
          className="w-full px-4 py-3 rounded-[12px] border border-[#E8E8E8] dark:border-[#2E2E2E] bg-[#FAFAF8] dark:bg-[#141414] text-[#111111] dark:text-[#F0F0F0] text-[15px] outline-none focus:border-[#7C4DFF] resize-none transition-colors mb-3"
        />

        {photoPreview && (
          <div className="mb-3 relative">
            <img src={photoPreview} alt="preview" className="w-full max-h-48 object-cover rounded-[12px]" />
            <button
              onClick={() => { setPhoto(null); setPhotoPreview(null) }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            >×</button>
          </div>
        )}

        <button onClick={() => fileRef.current?.click()} className="text-[13px] text-[#666666] dark:text-[#999999] mb-3 flex items-center gap-1">
          📷 Add photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />

        <hr className="border-[#E8E8E8] dark:border-[#2E2E2E] mb-3" />

        <div className="flex items-center justify-between">
          <RememberToggle value={remember} onChange={setRemember} />
          <button
            onClick={handleSave}
            disabled={saving || (!text.trim() && !photo)}
            className="px-8 py-3 rounded-[999px] text-white font-display font-semibold text-[15px] disabled:opacity-40 active:scale-[0.98] transition-all"
            style={{ backgroundColor: color }}
          >
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
