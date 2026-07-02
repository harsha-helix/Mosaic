/**
 * Google Drive API v3 client.
 * Auth token is stored in memory (never persisted) and refreshed via GIS.
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const SCOPE = 'https://www.googleapis.com/auth/drive.file'

// Token management

let _accessToken: string | null = null
let _tokenClient: google.accounts.oauth2.TokenClient | null = null

export function initAuth(clientId: string): void {
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: (response) => {
      if (response.error) { console.error('GIS auth error', response.error); return }
      _accessToken = response.access_token
    },
  })
}

export function signIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!_tokenClient) { reject(new Error('Auth not initialised')); return }
    _tokenClient.callback = (response) => {
      if (response.error) { reject(new Error(response.error)); return }
      _accessToken = response.access_token
      resolve(_accessToken)
    }
    if (_accessToken) {
      _tokenClient.requestAccessToken({ prompt: 'none' })
    } else {
      _tokenClient.requestAccessToken({ prompt: 'select_account' })
    }
  })
}

export function getToken(): string | null { return _accessToken }
export function isSignedIn(): boolean { return _accessToken !== null }

// Drive helpers

const DRIVE_REQUEST_TIMEOUT_MS = 15000

async function driveRequest(
  method: string,
  url: string,
  body?: BodyInit,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  if (!_accessToken) throw new Error('Not authenticated')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DRIVE_REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: { Authorization: 'Bearer ' + _accessToken, ...extraHeaders },
      body,
      signal: controller.signal,
    })
  } catch (e) {
    // A flaky mobile connection or captive portal can leave a fetch pending
    // forever with no error and no response — AbortController turns that
    // into a real, catchable failure instead of a silent hang.
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Drive request timed out — check your connection')
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
  if (res.status === 401) { _accessToken = null; throw new Error('Token expired') }
  if (!res.ok) { const text = await res.text(); throw new Error('Drive API error ' + res.status + ': ' + text) }
  return res
}

// File operations

export async function readFile<T>(fileId: string): Promise<T> {
  const res = await driveRequest('GET', DRIVE_API + '/files/' + fileId + '?alt=media')
  return res.json() as Promise<T>
}

export async function readFileBytes(fileId: string): Promise<Blob> {
  const res = await driveRequest('GET', DRIVE_API + '/files/' + fileId + '?alt=media')
  return res.blob()
}

export interface DriveFileMeta {
  id: string
  name: string
  createdTime?: string
  modifiedTime?: string
}

export async function listFolder(folderId: string): Promise<DriveFileMeta[]> {
  const query = encodeURIComponent("'" + folderId + "' in parents and trashed = false")
  const fields = encodeURIComponent('nextPageToken,files(id,name,createdTime,modifiedTime)')
  const files: DriveFileMeta[] = []
  let pageToken: string | undefined
  // Page through the full listing — a single un-looped pageSize=1000 request
  // silently drops files once a folder crosses 1000 items (08 Known Issues).
  do {
    const url = DRIVE_API + '/files?q=' + query + '&fields=' + fields + '&pageSize=1000'
      + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '')
    const res = await driveRequest('GET', url)
    const data = (await res.json()) as { files: DriveFileMeta[]; nextPageToken?: string }
    files.push(...data.files)
    pageToken = data.nextPageToken
  } while (pageToken)
  return files
}

/** Move a file to Drive's trash (recoverable for ~30 days, not a hard delete). */
export async function trashFile(fileId: string): Promise<void> {
  await driveRequest(
    'PATCH',
    DRIVE_API + '/files/' + fileId,
    new Blob([JSON.stringify({ trashed: true })], { type: 'application/json' }),
    { 'Content-Type': 'application/json' }
  )
}

export async function writeFile(
  name: string,
  content: unknown,
  folderId: string,
  existingFileId?: string
): Promise<string> {
  const json = JSON.stringify(content, null, 2)
  const blob = new Blob([json], { type: 'application/json' })

  if (existingFileId) {
    await driveRequest(
      'PATCH',
      UPLOAD_API + '/files/' + existingFileId + '?uploadType=media',
      blob,
      { 'Content-Type': 'application/json' }
    )
    return existingFileId
  }

  const metadata = JSON.stringify({ name, parents: [folderId] })
  const form = new FormData()
  form.append('metadata', new Blob([metadata], { type: 'application/json' }))
  form.append('file', blob)
  const res = await driveRequest('POST', UPLOAD_API + '/files?uploadType=multipart', form)
  const data = (await res.json()) as { id: string }
  return data.id
}

export async function uploadMedia(name: string, blob: Blob, folderId: string): Promise<string> {
  const metadata = JSON.stringify({ name, parents: [folderId] })
  const form = new FormData()
  form.append('metadata', new Blob([metadata], { type: 'application/json' }))
  form.append('file', blob)
  const res = await driveRequest('POST', UPLOAD_API + '/files?uploadType=multipart', form)
  const data = (await res.json()) as { id: string }
  return data.id
}

export async function createFolder(name: string, parentId?: string, appProperties?: Record<string, string>): Promise<string> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) metadata.parents = [parentId]
  if (appProperties) metadata.appProperties = appProperties
  const res = await driveRequest(
    'POST',
    DRIVE_API + '/files',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    { 'Content-Type': 'application/json' }
  )
  const data = (await res.json()) as { id: string }
  return data.id
}

/**
 * Search Drive for folders matching a name.
 * NOTE: with drive.file scope, the q= name filter silently returns empty results.
 * We must list all app-accessible files and filter client-side instead.
 */
export async function searchFolder(name: string): Promise<Array<{ id: string; name: string }>> {
  const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType)')
  const matches: Array<{ id: string; name: string }> = []
  let pageToken: string | undefined
  // Paged: without the loop this stops seeing the root folder once the app
  // has created >1000 files total — bootstrap would then create a SECOND
  // Mosaic/ folder (the folder-level version of the meta.json dupe bug).
  do {
    const url = DRIVE_API + '/files?fields=' + fields + '&pageSize=1000&orderBy=createdTime'
      + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '')
    const res = await driveRequest('GET', url)
    const data = (await res.json()) as {
      files: Array<{ id: string; name: string; mimeType: string }>
      nextPageToken?: string
    }
    matches.push(...data.files.filter(
      f => f.name === name && f.mimeType === 'application/vnd.google-apps.folder'
    ))
    pageToken = data.nextPageToken
  } while (pageToken)
  // orderBy=createdTime → matches[0] is the oldest (original) folder
  return matches
}

const SILENT_SIGNIN_TIMEOUT_MS = 8000

/**
 * Re-acquire a token silently. Never shows a popup. Resolves even on failure.
 *
 * GIS's `prompt: 'none'` flow depends on a hidden iframe round-trip with
 * accounts.google.com. On mobile browsers this can simply never call back —
 * no error, no success, just silence — most often because third-party
 * storage/cookie access for that iframe is blocked. Without a timeout, every
 * caller that does `await silentSignIn()` (app open, the online-reconnect
 * handler, the three push sites, the Settings "Sync with Drive" button)
 * would then hang forever, which looks exactly like "sync doesn't work" —
 * no error is ever shown, the UI just never finishes. Bounding the wait
 * turns a silent hang into a bounded, observable no-token state that the
 * existing `driveIsSignedIn()` checks and push/catch paths already handle.
 */
export function silentSignIn(): Promise<void> {
  return new Promise((resolve) => {
    if (!_tokenClient) { resolve(); return }
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(settle, SILENT_SIGNIN_TIMEOUT_MS)
    _tokenClient.callback = (response) => {
      if (!response.error) _accessToken = response.access_token
      settle()
    }
    _tokenClient.requestAccessToken({ prompt: 'none' })
  })
}
