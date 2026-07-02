/**
 * Resolves a moment's media_id to a viewable object URL.
 *
 * Two tiers (docs/11 D4):
 *  - resolveThumbUrl: IndexedDB thumbnail first (instant, offline) — the
 *    path every list surface (Highlights, Search, Day View, Home) should use.
 *    Falls back to the full image from Drive, and backfills the thumbnail
 *    store from it so photos captured before thumbnails existed only pay the
 *    Drive fetch once.
 *  - resolveMediaUrl: the full-size image from Drive, memory-cached per
 *    session — for detail views.
 */

import { getMediaFileId, getThumbnail, saveThumbnail } from '../db/queries'
import { makeThumbnail } from '../media'
import { readFileBytes } from './client'
import { silentSignIn } from './client'
import { isSignedIn } from './client'

const urlCache = new Map<string, string>()
const thumbUrlCache = new Map<string, string>()
const inFlight = new Map<string, Promise<string | null>>()

async function fetchFullFromDrive(mediaId: string): Promise<Blob | null> {
  try {
    if (!isSignedIn()) await silentSignIn()
    const fileId = await getMediaFileId(mediaId)
    if (!fileId) return null
    return await readFileBytes(fileId)
  } catch {
    return null
  }
}

export async function resolveMediaUrl(mediaId: string): Promise<string | null> {
  const cached = urlCache.get(mediaId)
  if (cached) return cached

  const key = 'full:' + mediaId
  const pending = inFlight.get(key)
  if (pending) return pending

  const promise = (async () => {
    try {
      const blob = await fetchFullFromDrive(mediaId)
      if (!blob) return null
      const url = URL.createObjectURL(blob)
      urlCache.set(mediaId, url)
      // Opportunistic backfill: older photos (pre-thumbnail) get a local
      // thumbnail now so future list renders never hit Drive again.
      getThumbnail(mediaId).then(existing => {
        if (existing) return
        makeThumbnail(blob).then(t => { if (t) saveThumbnail(mediaId, t).catch(() => {}) })
      }).catch(() => {})
      return url
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, promise)
  return promise
}

export async function resolveThumbUrl(mediaId: string): Promise<string | null> {
  const cached = thumbUrlCache.get(mediaId)
  if (cached) return cached

  const key = 'thumb:' + mediaId
  const pending = inFlight.get(key)
  if (pending) return pending

  const promise = (async () => {
    try {
      const local = await getThumbnail(mediaId)
      if (local) {
        const url = URL.createObjectURL(local)
        thumbUrlCache.set(mediaId, url)
        return url
      }
      // No local thumbnail (photo from another device, or pre-thumbnail era):
      // fall back to the full image — resolveMediaUrl backfills the thumbnail.
      return await resolveMediaUrl(mediaId)
    } catch {
      return null
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, promise)
  return promise
}
