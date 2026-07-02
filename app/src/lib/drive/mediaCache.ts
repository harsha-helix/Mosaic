/**
 * Resolves a moment's media_id to a viewable object URL, caching in memory
 * so a photo already downloaded this session isn't re-fetched from Drive
 * on every render (Highlights, Search, Day View, and Home's "last beautiful
 * thing" card can all reference the same moment).
 */

import { getMediaFileId } from '../db/queries'
import { readFileBytes } from './client'
import { silentSignIn } from './client'
import { isSignedIn } from './client'

const urlCache = new Map<string, string>()
const inFlight = new Map<string, Promise<string | null>>()

export async function resolveMediaUrl(mediaId: string): Promise<string | null> {
  const cached = urlCache.get(mediaId)
  if (cached) return cached

  const pending = inFlight.get(mediaId)
  if (pending) return pending

  const promise = (async () => {
    try {
      if (!isSignedIn()) await silentSignIn()
      const fileId = await getMediaFileId(mediaId)
      if (!fileId) return null
      const blob = await readFileBytes(fileId)
      const url = URL.createObjectURL(blob)
      urlCache.set(mediaId, url)
      return url
    } catch {
      return null
    } finally {
      inFlight.delete(mediaId)
    }
  })()

  inFlight.set(mediaId, promise)
  return promise
}
