import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { DailyEntry, Moment } from '../../types'

export interface SyncQueueItem {
  id: string
  operation: 'entry' | 'moments' | 'media'   // matches the 3 push functions 1:1
  path: string                                // e.g. "entries/2026-07-01.json" or "media/{id}.jpg"
  payload: string | Blob                      // JSON string for entry/moments, Blob for media
  created_at: string
  retries: number
}

interface MosaicDB extends DBSchema {
  entry: {
    key: string
    value: DailyEntry
  }
  moment: {
    key: string
    value: { date: string; moments: Moment[] }
  }
  fileIndex: {
    key: string
    value: { path: string; driveId: string }
  }
  syncQueue: {
    key: string
    value: SyncQueueItem
  }
  // v2: 256px thumbnails generated at capture (docs/11 D4) so list surfaces
  // render photos instantly and offline, without a Drive fetch per image.
  mediaThumb: {
    key: string
    value: { mediaId: string; blob: Blob }
  }
}

let dbInstance: IDBPDatabase<MosaicDB> | null = null

// A version bump (v1→v2→v3 so far) can only complete once every OTHER open
// connection to the 'mosaic' DB has closed. On mobile, Chrome/Android keeps
// backgrounded tabs and PWA instances alive far more aggressively than
// desktop — so a stale connection left over from before a deploy can sit
// there holding the old version open, and this device's upgrade transaction
// then blocks silently forever (no error, no timeout — indistinguishable
// from a hung "Setting up your Mosaic…" spinner). `blocking`/`blocked`
// below make each side release the lock instead of deadlocking; the
// timeout is a backstop so any hang still surfaces as a real error rather
// than an infinite wait.
const DB_OPEN_TIMEOUT_MS = 10000

export async function getDb(): Promise<IDBPDatabase<MosaicDB>> {
  if (dbInstance) return dbInstance

  const openPromise = openDB<MosaicDB>('mosaic', 3, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('entry', { keyPath: 'date' })
        db.createObjectStore('moment', { keyPath: 'date' })
        db.createObjectStore('fileIndex', { keyPath: 'path' })
        db.createObjectStore('syncQueue', { keyPath: 'id' })
      }
      if (oldVersion === 2) {
        // v2 thumbnails were 256px and rendered blurry stretched to card
        // width — drop them so they regenerate at the v3 size (800px) from
        // the full-res images on Drive on next view.
        db.deleteObjectStore('mediaThumb')
      }
      if (oldVersion < 3) {
        db.createObjectStore('mediaThumb', { keyPath: 'mediaId' })
      }
    },
    // Fires on THIS connection when a newer version tries to open elsewhere
    // (e.g. this same tab/PWA after a fresh deploy reloads it). Closing
    // immediately releases the lock so that other connection's upgrade can
    // proceed instead of both sides waiting on each other.
    blocking() {
      dbInstance?.close()
      dbInstance = null
    },
    // Fires on the NEW connection's open() request when it can't proceed
    // because another connection hasn't responded to `blocking` yet (e.g.
    // it's running old JS from before this fix). Nothing to do but log —
    // the timeout below is what keeps the caller from hanging.
    blocked() {
      console.warn('IndexedDB upgrade blocked by another open connection to "mosaic"')
    },
    terminated() {
      dbInstance = null
    },
  })

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Local storage is taking too long to open. Try fully closing Mosaic (swipe it away from recent apps) and reopening it.'))
    }, DB_OPEN_TIMEOUT_MS)
  })

  dbInstance = await Promise.race([openPromise, timeout])
  return dbInstance
}
