const TOKEN_KEY = 'ht_drive_token'
const TOKEN_META_KEY = 'ht_drive_meta'
const LAST_BACKUP_KEY = 'ht_last_backup'
const FOLDER_NAME = 'Personal Health Tracker'
const PHOTOS_FOLDER = 'photos'

let folderId = null
let photosFolderId = null

export function getDriveToken() { return localStorage.getItem(TOKEN_KEY) }
export function getDriveMeta() {
  const raw = localStorage.getItem(TOKEN_META_KEY)
  return raw ? JSON.parse(raw) : null
}
export function getLastBackupTime() { return localStorage.getItem(LAST_BACKUP_KEY) }
export function setLastBackupTime() { localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString()) }

export function isDriveConnected() {
  const token = getDriveToken()
  const meta = getDriveMeta()
  if (!token || !meta) return false
  return Date.now() < meta.expiresAt
}

export function initGoogleIdentity(clientId, callback) {
  return new Promise((resolve) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response) => {
        if (response.access_token) {
          localStorage.setItem(TOKEN_KEY, response.access_token)
          localStorage.setItem(TOKEN_META_KEY, JSON.stringify({
            expiresAt: Date.now() + (response.expires_in * 1000),
            email: response.email || 'Connected'
          }))
          folderId = null
          photosFolderId = null
          if (callback) callback(true)
        }
      }
    })
    resolve(client)
  })
}

export function disconnectDrive() {
  const token = getDriveToken()
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token)
  }
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_META_KEY)
  folderId = null
  photosFolderId = null
}

async function driveRequest(url, options = {}) {
  const token = getDriveToken()
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, ...options.headers }
  })
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`)
  return res.json()
}

async function getOrCreateFolder(name, parentId = null) {
  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const search = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`)
  if (search.files?.length) return search.files[0].id

  const meta = { name, mimeType: 'application/vnd.google-apps.folder', ...(parentId ? { parents: [parentId] } : {}) }
  const created = await driveRequest('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meta)
  })
  return created.id
}

async function ensureFolders() {
  if (!folderId) folderId = await getOrCreateFolder(FOLDER_NAME)
  if (!photosFolderId) photosFolderId = await getOrCreateFolder(PHOTOS_FOLDER, folderId)
}

export async function backupData(data) {
  await ensureFolders()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })

  const q = `name='health-tracker-backup.json' and '${folderId}' in parents and trashed=false`
  const search = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`)
  const existingId = search.files?.[0]?.id

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(
    existingId ? {} : { name: 'health-tracker-backup.json', parents: [folderId] }
  )], { type: 'application/json' }))
  form.append('file', blob)

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
  const method = existingId ? 'PATCH' : 'POST'

  await fetch(url, { method, headers: { 'Authorization': `Bearer ${getDriveToken()}` }, body: form })
  setLastBackupTime()
}

export async function uploadPhoto(blob, filename) {
  await ensureFolders()
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ name: filename, parents: [photosFolderId] })], { type: 'application/json' }))
  form.append('file', blob)
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${getDriveToken()}` },
    body: form
  })
  if (!res.ok) throw new Error('Photo upload failed')
  const data = await res.json()
  return data.id
}

export async function restoreFromDrive() {
  if (!folderId) folderId = await getOrCreateFolder(FOLDER_NAME)
  const q = `name='health-tracker-backup.json' and '${folderId}' in parents and trashed=false`
  const search = await driveRequest(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`)
  if (!search.files?.length) throw new Error('No backup found in Google Drive')
  const fileId = search.files[0].id
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${getDriveToken()}` }
  })
  if (!res.ok) throw new Error('Failed to download backup')
  return res.json()
}
