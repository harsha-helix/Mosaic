/**
 * Client-side image processing (docs/11 D4).
 *
 * Raw camera photos are 3–8 MB — on a mobile connection the upload often
 * doesn't finish before the browser suspends the tab, which is the root of
 * "images don't sync on the phone." Downscaling at capture (max 1600px long
 * edge, JPEG q0.8) cuts that to ~200–500 KB, and a 256px thumbnail stored in
 * IndexedDB lets every list surface render instantly without touching Drive.
 */

const FULL_MAX_EDGE = 1600
const FULL_QUALITY = 0.8
const THUMB_MAX_EDGE = 256
const THUMB_QUALITY = 0.7

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(blob)
    } catch { /* fall through to <img> decode */ }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image decode failed')) }
    img.src = url
  })
}

function dimensions(src: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  return src instanceof HTMLImageElement
    ? { w: src.naturalWidth, h: src.naturalHeight }
    : { w: src.width, h: src.height }
}

async function resizeToJpeg(blob: Blob, maxEdge: number, quality: number): Promise<Blob> {
  const src = await decode(blob)
  const { w, h } = dimensions(src)
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  const outW = Math.max(1, Math.round(w * scale))
  const outH = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')
  ctx.drawImage(src, 0, 0, outW, outH)
  if ('close' in src) src.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Canvas encode failed'))),
      'image/jpeg',
      quality
    )
  })
}

/**
 * Downscale a captured photo for upload. Falls back to the original blob if
 * processing fails (e.g. unsupported format) — an oversized upload is better
 * than a lost photo. Returns the blob and the extension it should be saved as.
 */
export async function processForUpload(file: Blob): Promise<{ blob: Blob; ext: string }> {
  try {
    const blob = await resizeToJpeg(file, FULL_MAX_EDGE, FULL_QUALITY)
    return { blob, ext: 'jpg' }
  } catch {
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    return { blob: file, ext }
  }
}

/** Small thumbnail for list rendering. Returns null if processing fails. */
export async function makeThumbnail(file: Blob): Promise<Blob | null> {
  try {
    return await resizeToJpeg(file, THUMB_MAX_EDGE, THUMB_QUALITY)
  } catch {
    return null
  }
}
