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

async function driveRequest(
  method: string,
  url: string,
  body?: BodyInit,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  if (!_accessToken) throw new Error('Not authenticated')
  const res = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + _accessToken, ...extraHeaders },
    body,
  })
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

export async function listFolder(folderId: string): Promise<Array<{ id: string; name: string }>> {
  const query = encodeURIComponent("'" + folderId + "' in parents and trashed = false")
  const fields = encodeURIComponent('files(id,name)')
  const res = await driveRequest('GET', DRIVE_API + '/files?q=' + query + '&fields=' + fields + '&pageSize=1000')
  const data = (await res.json()) as { files: Array<{ id: string; name: string }> }
  return data.files
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

export async function createFolder(name: string, parentId?: string): Promise<string> {
  const metadata: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) metadata.parents = [parentId]
  const res = await driveRequest(
    'POST',
    DRIVE_API + '/files',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    { 'Content-Type': 'application/json' }
  )
  const data = (await res.json()) as { id: string }
  return data.id
}

/** Re-acquire a token silently on reload. Never shows a popup. Resolves even on failure. */
export function silentSignIn(): Promise<void> {
  return new Promise((resolve) => {
    if (!_tokenClient) { resolve(); return }
    _tokenClient.callback = (response) => {
      if (!response.error) _accessToken = response.access_token
      resolve()
    }
    _tokenClient.requestAccessToken({ prompt: 'none' })
  })
}
