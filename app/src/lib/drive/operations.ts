/**
 * High-level Drive operations that combine the client + file index.
 * These are the functions the rest of the app should use.
 */

import {
  readFile,
  writeFile,
  uploadMedia as uploadMediaFile,
  createFolder,
  listFolder,
  searchFolder,
  getToken,
} from './client'
import {
  getFileId,
  setFileId,
  getEntry,
  saveEntry,
  getMoments,
  saveMoments,
} from '../db/queries'
import {
  setFolderIds,
  buildFileIndex,
  ENTRIES_FOLDER_ID,
  MOMENTS_FOLDER_ID,
  MEDIA_FOLDER_ID,
  MOSAIC_FOLDER_ID,
} from './fileIndex'
import type { DailyEntry, Moment, Meta } from '../../types'

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const ROOT_NAME = 'Mosaic'

/**
 * Find or create the Mosaic/ folder hierarchy in Drive and populate
 * the file index from IndexedDB + the Drive listing.
 * Safe to call on a new device — searches Drive for existing data first.
 */
export async function bootstrapDrive(displayName: string): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  // 1. Find or create root folder — search Drive first for cross-device support
  let mosaicId = await getFileId('__mosaic_root__')
  if (mosaicId) {
    // Verify the stored ID still exists on Drive — it may have been deleted
    try {
      await listFolder(mosaicId)
    } catch {
      // Stale ID (404 or other error) — fall through to search/create
      mosaicId = undefined
      await setFileId('__mosaic_root__', '')
    }
  }
  if (!mosaicId) {
    const existing = await searchFolder(ROOT_NAME)
    if (existing.length > 0) {
      mosaicId = existing[0].id
    } else {
      mosaicId = await createFolder(ROOT_NAME)
    }
    await setFileId('__mosaic_root__', mosaicId)
  }

  // 2. Find or create subfolders
  const children = await listFolder(mosaicId)
  const findOrCreate = async (name: string): Promise<string> => {
    const found = children.find(f => f.name === name)
    if (found) return found.id
    const newId = await createFolder(name, mosaicId!)
    return newId
  }

  const [entriesId, momentsId, mediaId] = await Promise.all([
    findOrCreate('entries'),
    findOrCreate('moments'),
    findOrCreate('media'),
  ])

  setFolderIds({ mosaic: mosaicId, entries: entriesId, moments: momentsId, media: mediaId })
  await setFileId('__entries_folder__', entriesId)
  await setFileId('__moments_folder__', momentsId)
  await setFileId('__media_folder__', mediaId)

  // 3. Find or create meta.json
  const existingMeta = await getFileId('meta.json')
  if (!existingMeta) {
    const meta: Meta = {
      version: '1',
      display_name: displayName,
      notifications: { morning_time: '08:00', evening_time: '21:00' },
      created_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    }
    const metaId = await writeFile('meta.json', meta, mosaicId)
    await setFileId('meta.json', metaId)
  }

  // 4. Build file index from Drive listing
  await buildFileIndex()
}

// ─── Entry operations ─────────────────────────────────────────────────────────

export async function fetchEntry(date: string): Promise<DailyEntry | null> {
  const path = 'entries/' + date + '.json'
  const fileId = await getFileId(path)
  if (!fileId) return null
  try {
    return await readFile<DailyEntry>(fileId)
  } catch {
    return null
  }
}

export async function pushEntry(entry: DailyEntry): Promise<void> {
  if (!ENTRIES_FOLDER_ID) throw new Error('Drive not bootstrapped')
  const path = 'entries/' + entry.date + '.json'
  const existingId = await getFileId(path)
  const newId = await writeFile(entry.date + '.json', entry, ENTRIES_FOLDER_ID, existingId)
  await setFileId(path, newId)
}

// ─── Moment operations ────────────────────────────────────────────────────────

export async function fetchMoments(date: string): Promise<Moment[]> {
  const path = 'moments/' + date + '.json'
  const fileId = await getFileId(path)
  if (!fileId) return []
  try {
    return await readFile<Moment[]>(fileId)
  } catch {
    return []
  }
}

export async function pushMoments(date: string, moments: Moment[]): Promise<void> {
  if (!MOMENTS_FOLDER_ID) throw new Error('Drive not bootstrapped')
  const path = 'moments/' + date + '.json'
  const existingId = await getFileId(path)
  const newId = await writeFile(date + '.json', moments, MOMENTS_FOLDER_ID, existingId)
  await setFileId(path, newId)
}

// ─── Media operations ─────────────────────────────────────────────────────────

export async function pushMedia(momentId: string, blob: Blob, ext: string): Promise<string> {
  if (!MEDIA_FOLDER_ID) throw new Error('Drive not bootstrapped')
  const name = momentId + '.' + ext
  const id = await uploadMediaFile(name, blob, MEDIA_FOLDER_ID)
  await setFileId('media/' + name, id)
  return id
}

// ─── Meta operations ──────────────────────────────────────────────────────────

export async function fetchMeta(): Promise<Meta | null> {
  const fileId = await getFileId('meta.json')
  if (!fileId) return null
  try {
    return await readFile<Meta>(fileId)
  } catch {
    return null
  }
}

export async function pushMeta(meta: Meta): Promise<void> {
  if (!MOSAIC_FOLDER_ID) throw new Error('Drive not bootstrapped')
  const existingId = await getFileId('meta.json')
  const updated = { ...meta, last_synced_at: new Date().toISOString() }
  const newId = await writeFile('meta.json', updated, MOSAIC_FOLDER_ID, existingId)
  await setFileId('meta.json', newId)
}

// ─── Cross-device sync ────────────────────────────────────────────────────────

/**
 * Merge two DailyEntry records: take the more recently submitted section from each.
 * Morning and evening are merged independently so partial edits from two devices combine.
 */
function mergeEntry(local: DailyEntry | undefined, remote: DailyEntry): DailyEntry {
  if (!local) return remote
  const merged: DailyEntry = { ...local }
  if (remote.morning?.submitted_at && remote.morning.submitted_at > (local.morning?.submitted_at ?? '')) {
    merged.morning = remote.morning
  }
  if (remote.evening?.submitted_at && remote.evening.submitted_at > (local.evening?.submitted_at ?? '')) {
    merged.evening = remote.evening
  }
  return merged
}

/**
 * Pull all entries from Drive and merge into IndexedDB.
 * Returns count of entries that were updated or newly created.
 */
export async function pullAllEntries(): Promise<number> {
  if (!ENTRIES_FOLDER_ID) return 0
  const files = await listFolder(ENTRIES_FOLDER_ID)
  let count = 0
  for (const file of files) {
    if (!file.name.endsWith('.json')) continue
    try {
      const date = file.name.replace('.json', '')
      const [local, remote] = await Promise.all([
        getEntry(date),
        readFile<DailyEntry>(file.id),
      ])
      const merged = mergeEntry(local, remote)
      if (JSON.stringify(merged) !== JSON.stringify(local)) {
        await saveEntry(merged)
        count++
      }
    } catch {
      // Skip files that fail to download or parse
    }
  }
  return count
}

/**
 * Pull all moments from Drive and merge into IndexedDB (union by id).
 * Returns count of new moments added.
 */
export async function pullAllMoments(): Promise<number> {
  if (!MOMENTS_FOLDER_ID) return 0
  const files = await listFolder(MOMENTS_FOLDER_ID)
  let count = 0
  for (const file of files) {
    if (!file.name.endsWith('.json')) continue
    try {
      const date = file.name.replace('.json', '')
      const [local, remote] = await Promise.all([
        getMoments(date),
        readFile<Moment[]>(file.id),
      ])
      const localIds = new Set(local.map(m => m.id))
      const newMoments = remote.filter(m => !localIds.has(m.id))
      if (newMoments.length > 0) {
        const merged = [...local, ...newMoments].sort((a, b) =>
          a.captured_at.localeCompare(b.captured_at)
        )
        await saveMoments(date, merged)
        count += newMoments.length
      }
    } catch {
      // Skip files that fail to download or parse
    }
  }
  return count
}

/**
 * Full sync from Drive: pull all entries + moments and merge into IndexedDB.
 * Safe to call on first load on a new device or after a period offline.
 * Expensive — avoid calling on every app load. Use hydrateToday() instead.
 */
export async function syncFromDrive(): Promise<{ entries: number; moments: number }> {
  const [entries, moments] = await Promise.all([
    pullAllEntries(),
    pullAllMoments(),
  ])
  return { entries, moments }
}

/**
 * Lightweight hydration for a returning session.
 * 1. Refreshes the in-memory file index (3 folder listings = 3 API calls)
 * 2. Fetches today's entry + moments from Drive and merges into IndexedDB
 * 3. Returns the merged values so the caller can update the UI store
 *
 * Only touches today's files — safe to call on every app load.
 */
export async function hydrateToday(date: string): Promise<{
  entry: DailyEntry | null
  moments: Moment[]
}> {
  if (!ENTRIES_FOLDER_ID || !MOMENTS_FOLDER_ID || !MEDIA_FOLDER_ID) {
    return { entry: null, moments: [] }
  }

  // Refresh file index so cross-device files are discoverable
  await buildFileIndex()

  // Fetch today from Drive (returns null/[] if file doesn't exist yet)
  const [remoteEntry, remoteMoments] = await Promise.all([
    fetchEntry(date),
    fetchMoments(date),
  ])

  // Merge remote entry with whatever is already in IDB
  let finalEntry: DailyEntry | null = null
  if (remoteEntry) {
    const localEntry = await getEntry(date)
    const merged = mergeEntry(localEntry, remoteEntry)
    // Only write back if something changed
    if (JSON.stringify(merged) !== JSON.stringify(localEntry)) {
      await saveEntry(merged)
    }
    finalEntry = merged
  }

  // Merge remote moments with local by id (union)
  let finalMoments: Moment[] = []
  if (remoteMoments.length > 0) {
    const localMoments = await getMoments(date)
    const localIds = new Set(localMoments.map(m => m.id))
    const newMoments = remoteMoments.filter(m => !localIds.has(m.id))
    if (newMoments.length > 0) {
      finalMoments = [...localMoments, ...newMoments].sort((a, b) =>
        a.captured_at.localeCompare(b.captured_at)
      )
      await saveMoments(date, finalMoments)
    } else {
      finalMoments = localMoments
    }
  }

  return { entry: finalEntry, moments: finalMoments }
}
