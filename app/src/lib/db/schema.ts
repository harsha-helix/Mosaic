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

export async function getDb(): Promise<IDBPDatabase<MosaicDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<MosaicDB>('mosaic', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('entry', { keyPath: 'date' })
        db.createObjectStore('moment', { keyPath: 'date' })
        db.createObjectStore('fileIndex', { keyPath: 'path' })
        db.createObjectStore('syncQueue', { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        db.createObjectStore('mediaThumb', { keyPath: 'mediaId' })
      }
    },
  })
  return dbInstance
}
