import { getDb } from './schema'
import type { SyncQueueItem } from './schema'
import type { DailyEntry, Moment } from '../../types'

// ── Entries ──────────────────────────────────────────────────────────────────

export async function getEntry(date: string): Promise<DailyEntry | undefined> {
  const db = await getDb()
  return db.get('entry', date)
}

export async function saveEntry(entry: DailyEntry): Promise<void> {
  const db = await getDb()
  await db.put('entry', entry)
}

export async function getAllEntries(): Promise<DailyEntry[]> {
  const db = await getDb()
  return db.getAll('entry')
}

/**
 * Date-bounded entry query (docs/11 D6): render paths must never load full
 * history. Dates are YYYY-MM-DD strings, so lexicographic key range = date range.
 */
export async function getEntriesInRange(startDate: string, endDate: string): Promise<DailyEntry[]> {
  const db = await getDb()
  return db.getAll('entry', IDBKeyRange.bound(startDate, endDate))
}

// ── Moments ───────────────────────────────────────────────────────────────────

export async function getMoments(date: string): Promise<Moment[]> {
  const db = await getDb()
  const record = await db.get('moment', date)
  return record?.moments ?? []
}

export async function saveMoments(date: string, moments: Moment[]): Promise<void> {
  const db = await getDb()
  await db.put('moment', { date, moments })
}

export async function appendMoment(date: string, moment: Moment): Promise<Moment[]> {
  const existing = await getMoments(date)
  const updated = [...existing, moment]
  await saveMoments(date, updated)
  return updated
}

// Patches an already-saved moment in place (used by capture's quick-log
// "add note" follow-up — edits the just-saved body-type moment instead of
// appending a duplicate). No-op if the id isn't found.
export async function updateMoment(date: string, id: string, patch: Partial<Moment>): Promise<Moment[]> {
  const existing = await getMoments(date)
  const updated = existing.map(m => (m.id === id ? { ...m, ...patch } : m))
  await saveMoments(date, updated)
  return updated
}

// ── File Index ────────────────────────────────────────────────────────────────

export async function getFileId(path: string): Promise<string | undefined> {
  const db = await getDb()
  const record = await db.get('fileIndex', path)
  return record?.driveId
}

export async function setFileId(path: string, driveId: string): Promise<void> {
  const db = await getDb()
  await db.put('fileIndex', { path, driveId })
}

export async function getAllFileIds(): Promise<Record<string, string>> {
  const db = await getDb()
  const all = await db.getAll('fileIndex')
  return Object.fromEntries(all.map(r => [r.path, r.driveId]))
}

/**
 * Resolve a moment's media_id to its Drive file ID.
 * The file index key is `media/{id}.{ext}` — the extension isn't stored on
 * the Moment itself, so we look up by prefix instead of exact path.
 */
export async function getMediaFileId(mediaId: string): Promise<string | undefined> {
  const all = await getAllFileIds()
  const prefix = 'media/' + mediaId + '.'
  const key = Object.keys(all).find(k => k.startsWith(prefix))
  return key ? all[key] : undefined
}

// ── Media thumbnails ──────────────────────────────────────────────────────────

export async function saveThumbnail(mediaId: string, blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put('mediaThumb', { mediaId, blob })
}

export async function getThumbnail(mediaId: string): Promise<Blob | undefined> {
  const db = await getDb()
  const record = await db.get('mediaThumb', mediaId)
  return record?.blob
}

// ── Sync Queue ────────────────────────────────────────────────────────────────

export async function enqueueSyncItem(
  operation: SyncQueueItem['operation'],
  path: string,
  payload: string | Blob
): Promise<void> {
  const db = await getDb()
  await db.put('syncQueue', {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    operation,
    path,
    payload,
    created_at: new Date().toISOString(),
    retries: 0,
  })
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDb()
  return db.getAll('syncQueue')
}

export async function removeSyncItem(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('syncQueue', id)
}

export async function updateSyncItemRetries(id: string, retries: number): Promise<void> {
  const db = await getDb()
  const item = await db.get('syncQueue', id)
  if (!item) return
  await db.put('syncQueue', { ...item, retries })
}

export async function getAllMoments(): Promise<Moment[]> {
  const db = await getDb()
  const all = await db.getAll('moment')
  return all.flatMap(r => r.moments)
}

/**
 * Newest moment matching a predicate, walking days newest-first via a
 * reverse cursor and stopping at the first hit (docs/11 D6) — Home's "last
 * beautiful thing" card needs one moment, not the full history in memory.
 */
export async function getLatestMomentWhere(predicate: (m: Moment) => boolean): Promise<Moment | null> {
  const db = await getDb()
  let cursor = await db.transaction('moment').store.openCursor(null, 'prev')
  while (cursor) {
    const match = [...cursor.value.moments]
      .sort((a, b) => b.captured_at.localeCompare(a.captured_at))
      .find(predicate)
    if (match) return match
    cursor = await cursor.continue()
  }
  return null
}

export async function clearFileIndex(): Promise<void> {
  const db = await getDb()
  await db.clear('fileIndex')
}

export async function getAllMomentRecords(): Promise<Array<{ date: string; moments: Moment[] }>> {
  const db = await getDb()
  return db.getAll('moment')
}
