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
  trashFile,
  getToken,
} from './client'
import type { DriveFileMeta } from './client'
import {
  getFileId,
  setFileId,
  getMediaFileId,
  getEntry,
  saveEntry,
  getMoments,
  saveMoments,
  getAllEntries,
  getAllMomentRecords,
  getPendingSyncItems,
  removeSyncItem,
  updateSyncItemRetries,
} from '../db/queries'
import type { SyncQueueItem } from '../db/schema'
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
 * Resolve duplicate meta.json files into one canonical copy (11 — D3).
 *
 * Duplicates exist because bootstrap used to decide "does meta.json exist?"
 * from the local IndexedDB index instead of the Drive listing — every device
 * with a cleared index created another copy. This repairs the damage and is
 * the single owner of the meta.json file-index entry.
 *
 * Canonical = oldest createdTime (preserves the true "when did I start
 * Mosaic" date). Settings (display_name / notifications) are merged in from
 * the most recently modified copy so the user's latest edits win. Extra
 * copies go to Drive trash (recoverable), never hard-deleted.
 *
 * Returns the canonical file ID, or null if no meta.json exists on Drive.
 */
export async function repairMeta(rootChildren: DriveFileMeta[]): Promise<string | null> {
  const metas = rootChildren
    .filter(f => f.name === 'meta.json')
    .sort((a, b) => (a.createdTime ?? '').localeCompare(b.createdTime ?? ''))

  if (metas.length === 0) return null

  const canonical = metas[0]
  await setFileId('meta.json', canonical.id)
  if (metas.length === 1) return canonical.id

  // Merge settings from the most recently modified copy into the canonical one
  try {
    const newest = [...metas].sort((a, b) =>
      (b.modifiedTime ?? '').localeCompare(a.modifiedTime ?? '')
    )[0]
    const [canonicalMeta, newestMeta] = await Promise.all([
      readFile<Meta>(canonical.id),
      newest.id === canonical.id ? Promise.resolve(null) : readFile<Meta>(newest.id),
    ])
    const merged: Meta = {
      ...canonicalMeta,
      ...(newestMeta ? {
        display_name: newestMeta.display_name,
        notifications: newestMeta.notifications,
        ...(newestMeta.fcm_token ? { fcm_token: newestMeta.fcm_token } : {}),
      } : {}),
      created_at: canonicalMeta.created_at, // never reset by a later bootstrap
      last_synced_at: new Date().toISOString(),
    }
    await writeFile('meta.json', merged, MOSAIC_FOLDER_ID ?? '', canonical.id)
  } catch {
    // Merge is best-effort — even if reading/merging fails, deduping below
    // still fixes the split-brain (all devices converge on the canonical ID).
  }

  // Trash the duplicates — best-effort, retried implicitly on next repair pass
  for (const dupe of metas.slice(1)) {
    try { await trashFile(dupe.id) } catch { /* next open retries */ }
  }
  return canonical.id
}

// In-flight guard: concurrent callers (app open + first push racing) must not
// run two bootstraps — that's exactly the race that duplicates files.
let _bootstrapInFlight: Promise<void> | null = null

/**
 * Find or create the Mosaic/ folder hierarchy in Drive and populate
 * the file index. Safe to call on a new device — searches Drive for
 * existing data first, and never creates a file that already exists on
 * Drive (existence is decided from the Drive listing, NOT the local
 * index — see docs/11 D2).
 */
export function bootstrapDrive(
  displayName: string,
  notifications: { morning_time: string; evening_time: string } = { morning_time: '08:00', evening_time: '21:00' }
): Promise<void> {
  if (_bootstrapInFlight) return _bootstrapInFlight
  _bootstrapInFlight = doBootstrap(displayName, notifications)
    .finally(() => { _bootstrapInFlight = null })
  return _bootstrapInFlight
}

async function doBootstrap(
  displayName: string,
  notifications: { morning_time: string; evening_time: string }
): Promise<void> {
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
      mosaicId = existing[0].id // oldest first — the original folder
    } else {
      mosaicId = await createFolder(ROOT_NAME, undefined, { mosaic: 'root' })
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

  // 3. Meta: decide existence from the Drive listing (step 2's `children`),
  //    never from the local index. Repair any duplicates while we're here.
  const canonicalMetaId = await repairMeta(children)
  if (!canonicalMetaId) {
    const meta: Meta = {
      version: '1',
      display_name: displayName,
      notifications,
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
  // Presence check (docs/11 D4): a queued retry may replay after an earlier
  // attempt actually succeeded (e.g. upload completed but the response was
  // lost to a dropped connection). Media is immutable once written, so if
  // the file is already indexed, don't create a duplicate.
  const existing = await getMediaFileId(momentId)
  if (existing) return existing
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
 * Bounded-concurrency batching for full-history pulls (docs/11 D6).
 * 5 files at a time is fast without bursting the Drive API, and the yield
 * between batches keeps a long sync from starving first paint / input
 * handling on a mid-range phone.
 */
const PULL_BATCH_SIZE = 5

async function inBatches<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
  for (let i = 0; i < items.length; i += PULL_BATCH_SIZE) {
    await Promise.all(items.slice(i, i + PULL_BATCH_SIZE).map(fn))
    await new Promise(r => setTimeout(r, 0)) // yield to the event loop
  }
}

/**
 * Pull all entries from Drive and merge into IndexedDB.
 * Returns count of entries that were updated or newly created.
 */
export async function pullAllEntries(): Promise<number> {
  if (!ENTRIES_FOLDER_ID) return 0
  const files = (await listFolder(ENTRIES_FOLDER_ID)).filter(f => f.name.endsWith('.json'))
  let count = 0
  await inBatches(files, async (file) => {
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
  })
  return count
}

/**
 * Pull all moments from Drive and merge into IndexedDB (union by id).
 * Returns count of new moments added.
 */
export async function pullAllMoments(): Promise<number> {
  if (!MOMENTS_FOLDER_ID) return 0
  const files = (await listFolder(MOMENTS_FOLDER_ID)).filter(f => f.name.endsWith('.json'))
  let count = 0
  await inBatches(files, async (file) => {
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
  })
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

  // Self-heal meta.json duplicates on every open (docs/11 D3) — one cheap
  // root listing; keeps the canonical meta ID indexed so this device reads
  // and writes the same file every other device does.
  if (MOSAIC_FOLDER_ID) {
    try {
      const rootChildren = await listFolder(MOSAIC_FOLDER_ID)
      await repairMeta(rootChildren)
    } catch { /* offline or transient — next open retries */ }
  }

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

// ─── Push all local data to Drive ─────────────────────────────────────────────

/**
 * Push all local IDB entries and moments to Drive.
 * Uses the existing file index — if a file already exists on Drive it updates it,
 * otherwise it creates it. Counterpart to syncFromDrive (which only pulls).
 */
export async function pushAllToDrive(): Promise<{ entries: number; moments: number }> {
  if (!ENTRIES_FOLDER_ID || !MOMENTS_FOLDER_ID) return { entries: 0, moments: 0 }

  const [allEntries, allMomentRecords] = await Promise.all([
    getAllEntries(),
    getAllMomentRecords(),
  ])

  let entries = 0
  for (const entry of allEntries) {
    await pushEntry(entry)
    entries++
  }

  let moments = 0
  for (const { date, moments: ms } of allMomentRecords) {
    if (ms.length === 0) continue
    await pushMoments(date, ms)
    moments += ms.length
  }

  return { entries, moments }
}

/**
 * Full bidirectional sync:
 * 1. Refresh file index so we know what's on Drive
 * 2. Pull from Drive and merge into local IDB
 * 3. Push all local data back to Drive (so Drive has the merged result)
 */
export async function fullSync(): Promise<{ pulled: { entries: number; moments: number }; pushed: { entries: number; moments: number } }> {
  await buildFileIndex()
  const pulled = await syncFromDrive()
  const pushed = await pushAllToDrive()
  return { pulled, pushed }
}

// ─── Retry queue ──────────────────────────────────────────────────────────────

const MAX_SYNC_RETRIES = 5

/**
 * Replay a single queued item via the matching push function.
 *
 * For 'entry'/'moments', push whatever IndexedDB holds *now* for that date —
 * not the stale JSON snapshot captured when the item was queued. Between
 * queuing and flushing, a hydrateToday()/periodic sync may have merged in
 * newer remote data (e.g. another device's evening section) and written
 * that merge back to IndexedDB. Replaying the old snapshot would overwrite
 * Drive with a whole-file write that doesn't include that merge, silently
 * losing it. The payload is only a fallback for the (rare) case the local
 * record has since been deleted.
 */
async function replaySyncItem(item: SyncQueueItem): Promise<void> {
  switch (item.operation) {
    case 'entry': {
      const date = item.path.replace('entries/', '').replace('.json', '')
      const current = await getEntry(date)
      const entry = current ?? (JSON.parse(item.payload as string) as DailyEntry)
      await pushEntry(entry)
      return
    }
    case 'moments': {
      const date = item.path.replace('moments/', '').replace('.json', '')
      const current = await getMoments(date)
      const moments = current.length > 0 ? current : (JSON.parse(item.payload as string) as Moment[])
      await pushMoments(date, moments)
      return
    }
    case 'media': {
      const filename = item.path.replace('media/', '')
      const dot = filename.lastIndexOf('.')
      const id = dot >= 0 ? filename.slice(0, dot) : filename
      const ext = dot >= 0 ? filename.slice(dot + 1) : 'jpg'
      await pushMedia(id, item.payload as Blob, ext)
      return
    }
  }
}

/**
 * Replay everything in the offline retry queue.
 * 1. Coalesce: group queued items by `path`, keep only the newest `created_at`
 *    per path (entry/moment pushes are whole-file overwrites, so stale
 *    intermediate versions are dropped, not replayed).
 * 2. Replay survivors oldest-first via the matching push function.
 * 3. On success, remove from the queue. On failure, bump `retries`;
 *    once `retries` reaches 5, drop the item (it's not retried forever).
 *
 * Safe to call repeatedly — a no-op when the queue is empty.
 */
export async function flushSyncQueue(): Promise<{ flushed: number; dropped: number }> {
  const items = await getPendingSyncItems()
  if (items.length === 0) return { flushed: 0, dropped: 0 }

  const newestByPath = new Map<string, SyncQueueItem>()
  for (const item of items) {
    const current = newestByPath.get(item.path)
    if (!current || item.created_at > current.created_at) {
      if (current) await removeSyncItem(current.id)
      newestByPath.set(item.path, item)
    } else {
      await removeSyncItem(item.id)
    }
  }

  const survivors = Array.from(newestByPath.values()).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  )

  let flushed = 0
  let dropped = 0

  for (const item of survivors) {
    try {
      await replaySyncItem(item)
      await removeSyncItem(item.id)
      flushed++
    } catch {
      const retries = item.retries + 1
      if (retries >= MAX_SYNC_RETRIES) {
        await removeSyncItem(item.id)
        dropped++
      } else {
        await updateSyncItemRetries(item.id, retries)
      }
    }
  }

  return { flushed, dropped }
}
