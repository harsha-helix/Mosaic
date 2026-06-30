import { openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { DailyEntry, Moment } from '../../types'

interface SyncQueueItem {
  id: string
  operation: 'write' | 'upload'
  path: string
  payload: string
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
}

let dbInstance: IDBPDatabase<MosaicDB> | null = null

export async function getDb(): Promise<IDBPDatabase<MosaicDB>> {
  if (dbInstance) return dbInstance
  dbInstance = await openDB<MosaicDB>('mosaic', 1, {
    upgrade(db) {
      db.createObjectStore('entry', { keyPath: 'date' })
      db.createObjectStore('moment', { keyPath: 'date' })
      db.createObjectStore('fileIndex', { keyPath: 'path' })
      db.createObjectStore('syncQueue', { keyPath: 'id' })
    },
  })
  return dbInstance
}
