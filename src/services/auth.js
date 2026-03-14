import bcrypt from 'bcryptjs'

const CREDS_KEY = 'ht_credentials'
const SESSION_KEY = 'ht_session'

export function isFirstLaunch() {
  return !localStorage.getItem(CREDS_KEY)
}

export async function setupCredentials(username, password) {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  localStorage.setItem(CREDS_KEY, JSON.stringify({ username, hash }))
}

export async function login(username, password) {
  const raw = localStorage.getItem(CREDS_KEY)
  if (!raw) return false
  const { username: storedUser, hash } = JSON.parse(raw)
  if (username !== storedUser) return false
  const match = await bcrypt.compare(password, hash)
  if (match) sessionStorage.setItem(SESSION_KEY, '1')
  return match
}

export function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function getUsername() {
  const raw = localStorage.getItem(CREDS_KEY)
  if (!raw) return ''
  return JSON.parse(raw).username
}

export async function changePassword(currentPassword, newPassword) {
  const raw = localStorage.getItem(CREDS_KEY)
  if (!raw) return false
  const { username, hash } = JSON.parse(raw)
  const match = await bcrypt.compare(currentPassword, hash)
  if (!match) return false
  const salt = await bcrypt.genSalt(10)
  const newHash = await bcrypt.hash(newPassword, salt)
  localStorage.setItem(CREDS_KEY, JSON.stringify({ username, hash: newHash }))
  return true
}
