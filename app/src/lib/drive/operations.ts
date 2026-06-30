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
  getToken,
} from './client'
import {
  getFileId,
  setFileId,
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
 */
export async function bootstrapDrive(displayName: string): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  // 1. Find or create root folder
  let mosaicId = await getFileId('__mosaic_root__')
  if (!mosaicId) {
    mosaicId = await createFolder(ROOT_NAME)
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

  // 4. Build file index from Drive
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
