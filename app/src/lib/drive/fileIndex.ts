/**
 * Manages the Drive file index: a map of logical path → Drive file ID.
 * Stored in IndexedDB. Populated by walking the Mosaic/ folder on first load.
 */

import { listFolder } from './client'
import { getAllFileIds, setFileId } from '../db/queries'

export let MOSAIC_FOLDER_ID: string | null = null
export let ENTRIES_FOLDER_ID: string | null = null
export let MOMENTS_FOLDER_ID: string | null = null
export let MEDIA_FOLDER_ID: string | null = null

export function setFolderIds(ids: {
  mosaic: string
  entries: string
  moments: string
  media: string
}) {
  MOSAIC_FOLDER_ID = ids.mosaic
  ENTRIES_FOLDER_ID = ids.entries
  MOMENTS_FOLDER_ID = ids.moments
  MEDIA_FOLDER_ID = ids.media
}

/** Load the file index from IndexedDB into memory */
export async function loadFileIndex(): Promise<Record<string, string>> {
  return getAllFileIds()
}

/**
 * Walk the Mosaic Drive folder and populate the IndexedDB file index.
 * Called once after auth when we have folder IDs.
 */
export async function buildFileIndex(): Promise<void> {
  if (!ENTRIES_FOLDER_ID || !MOMENTS_FOLDER_ID || !MEDIA_FOLDER_ID) return

  const [entryFiles, momentFiles, mediaFiles] = await Promise.all([
    listFolder(ENTRIES_FOLDER_ID),
    listFolder(MOMENTS_FOLDER_ID),
    listFolder(MEDIA_FOLDER_ID),
  ])

  const writes: Promise<void>[] = []

  for (const f of entryFiles) {
    writes.push(setFileId(`entries/${f.name}`, f.id))
  }
  for (const f of momentFiles) {
    writes.push(setFileId(`moments/${f.name}`, f.id))
  }
  for (const f of mediaFiles) {
    writes.push(setFileId(`media/${f.name}`, f.id))
  }

  await Promise.all(writes)
}

export function resetFolderIds() {
  MOSAIC_FOLDER_ID = null
  ENTRIES_FOLDER_ID = null
  MOMENTS_FOLDER_ID = null
  MEDIA_FOLDER_ID = null
}
