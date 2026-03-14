import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { changePassword, getUsername } from '../services/auth'
import { getGroqKey, setGroqKey } from '../services/groq'
import { isDriveConnected, getDriveMeta, disconnectDrive, backupData, restoreFromDrive } from '../services/googleDrive'
import { exportAllData, importAllData } from '../db/database'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

const GOOGLE_CLIENT_ID_KEY = 'ht_gclient_id'

export default function Settings() {
  const { addToast, refreshDriveStatus, driveConnected, logout } = useApp()
  const [groqKey, setGroqKeyState] = useState(getGroqKey())
  const [units, setUnits] = useState(localStorage.getItem('ht_units') || 'kg')
  const [measure, setMeasure] = useState(localStorage.getItem('ht_measure') || 'cm')
  const [clientId, setClientId] = useState(localStorage.getItem(GOOGLE_CLIENT_ID_KEY) || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [driveLoading, setDriveLoading] = useState(false)
  const driveMeta = getDriveMeta()

  function saveGroqKey() {
    setGroqKey(groqKey.trim())
    addToast('Groq API key saved', 'success')
  }

  function saveUnits() {
    localStorage.setItem('ht_units', units)
    localStorage.setItem('ht_measure', measure)
    addToast('Units saved', 'success')
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw) return addToast('Fill in all fields', 'error')
    if (newPw.length < 6) return addToast('New password must be at least 6 characters', 'error')
    if (newPw !== confirmPw) return addToast('Passwords do not match', 'error')
    setPwLoading(true)
    const ok = await changePassword(currentPw, newPw)
    setPwLoading(false)
    if (ok) { setCurrentPw(''); setNewPw(''); setConfirmPw(''); addToast('Password changed', 'success') }
    else addToast('Current password incorrect', 'error')
  }

  async function connectDrive() {
    if (!clientId.trim()) return addToast('Enter your Google Client ID first', 'error')
    localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim())
    setDriveLoading(true)
    try {
      if (!window.google?.accounts?.oauth2) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        await new Promise((res, rej) => { script.onload = res; script.onerror = rej; document.head.appendChild(script) })
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.access_token) {
            localStorage.setItem('ht_drive_token', response.access_token)
            localStorage.setItem('ht_drive_meta', JSON.stringify({ expiresAt: Date.now() + response.expires_in * 1000, email: 'Connected' }))
            refreshDriveStatus()
            addToast('Google Drive connected!', 'success')
          } else {
            addToast('Drive connection failed', 'error')
          }
          setDriveLoading(false)
        }
      })
      client.requestAccessToken()
    } catch (err) {
      setDriveLoading(false)
      addToast('Failed to load Google Sign-In', 'error')
    }
  }

  function handleDisconnectDrive() {
    disconnectDrive()
    refreshDriveStatus()
    addToast('Google Drive disconnected', 'info')
  }

  async function handleManualBackup() {
    setBackupLoading(true)
    try {
      const data = await exportAllData()
      if (driveConnected) {
        await backupData(data)
        refreshDriveStatus()
        addToast('Backed up to Google Drive', 'success')
      } else {
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `health-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        addToast('Backup downloaded', 'success')
      }
    } catch (err) {
      addToast('Backup failed: ' + err.message, 'error')
    }
    setBackupLoading(false)
  }

  async function handleRestoreFromDrive() {
    if (!confirm('This will overwrite all your local data. Continue?')) return
    setRestoreLoading(true)
    try {
      const data = await restoreFromDrive()
      await importAllData(data)
      addToast('Data restored from Google Drive', 'success')
    } catch (err) {
      addToast('Restore failed: ' + err.message, 'error')
    }
    setRestoreLoading(false)
  }

  function handleImportFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      if (!confirm('This will overwrite all your local data. Continue?')) return
      try {
        const data = JSON.parse(ev.target.result)
        await importAllData(data)
        addToast('Data imported successfully', 'success')
      } catch {
        addToast('Invalid backup file', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const SectionTitle = ({ children }) => (
    <p className="text-xs text-textSecond uppercase tracking-widest font-sans mb-3 mt-6 first:mt-0">{children}</p>
  )

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-sans font-semibold text-textPrimary mb-6">Settings</h1>

      <SectionTitle>Google Drive Backup</SectionTitle>
      <Card className="mb-3">
        {driveConnected ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textPrimary font-sans font-medium">Connected</p>
              <p className="text-xs text-success font-sans mt-0.5">● Google Drive active</p>
            </div>
            <Button onClick={handleDisconnectDrive} variant="destructive" className="text-xs py-1.5 px-3">Disconnect</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="border-l-4 border-amber pl-3">
              <p className="text-xs text-textSecond font-sans">Requires a Google Cloud OAuth Client ID. See README for setup instructions (free, 5 mins).</p>
            </div>
            <Input label="Google OAuth Client ID" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="123....apps.googleusercontent.com" />
            <Button onClick={connectDrive} loading={driveLoading} className="w-full">Connect Google Drive</Button>
          </div>
        )}
      </Card>

      <SectionTitle>AI Insights</SectionTitle>
      <Card className="mb-3">
        <div className="flex flex-col gap-3">
          <div className="border-l-4 border-orange pl-3">
            <p className="text-xs text-textSecond font-sans">Free at <span className="text-orange">console.groq.com</span> — create an account and generate an API key.</p>
          </div>
          <Input label="Groq API Key" value={groqKey} onChange={e => setGroqKeyState(e.target.value)} placeholder="gsk_..." type="password" />
          <Button onClick={saveGroqKey} variant="secondary" className="w-full">Save Key</Button>
        </div>
      </Card>

      <SectionTitle>Units</SectionTitle>
      <Card className="mb-3">
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="units" value="kg" checked={units==='kg'} onChange={e => setUnits(e.target.value)} className="accent-orange" />
            <span className="text-sm text-textPrimary font-sans">kg</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="units" value="lbs" checked={units==='lbs'} onChange={e => setUnits(e.target.value)} className="accent-orange" />
            <span className="text-sm text-textPrimary font-sans">lbs</span>
          </label>
        </div>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="measure" value="cm" checked={measure==='cm'} onChange={e => setMeasure(e.target.value)} className="accent-orange" />
            <span className="text-sm text-textPrimary font-sans">cm</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="measure" value="inches" checked={measure==='inches'} onChange={e => setMeasure(e.target.value)} className="accent-orange" />
            <span className="text-sm text-textPrimary font-sans">inches</span>
          </label>
        </div>
        <Button onClick={saveUnits} variant="secondary" className="w-full">Save Units</Button>
      </Card>

      <SectionTitle>Data Backup</SectionTitle>
      <Card className="mb-3">
        <div className="flex flex-col gap-2">
          <Button onClick={handleManualBackup} loading={backupLoading} variant="secondary" className="w-full">
            {driveConnected ? '☁ Backup to Drive Now' : '⬇ Download Backup JSON'}
          </Button>
          {driveConnected && (
            <Button onClick={handleRestoreFromDrive} loading={restoreLoading} variant="secondary" className="w-full">
              ☁ Restore from Drive
            </Button>
          )}
          <label className="flex items-center justify-center gap-2 w-full bg-surfaceHigh border border-border hover:bg-border text-textPrimary rounded-lg px-4 py-2.5 text-sm font-sans cursor-pointer transition-colors">
            📂 Import from JSON file
            <input type="file" accept=".json" className="hidden" onChange={handleImportFile} />
          </label>
        </div>
      </Card>

      <SectionTitle>Change Password</SectionTitle>
      <Card className="mb-3">
        <div className="flex flex-col gap-3">
          <Input label="Current Password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
          <Input label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
          <Input label="Confirm New Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
          <Button onClick={handleChangePassword} loading={pwLoading} variant="secondary" className="w-full">Change Password</Button>
        </div>
      </Card>

      <SectionTitle>Install on iPhone</SectionTitle>
      <Card className="mb-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <p className="text-sm text-textPrimary font-sans font-medium mb-1">Add to Home Screen</p>
            <p className="text-xs text-textSecond font-sans leading-relaxed">
              In Safari, tap the <span className="text-orange">Share</span> button (rectangle with arrow) at the bottom of your screen, then tap <span className="text-orange">"Add to Home Screen"</span>. The app will behave like a native app.
            </p>
          </div>
        </div>
      </Card>

      <SectionTitle>Account</SectionTitle>
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-textPrimary font-sans">{getUsername()}</p>
            <p className="text-xs text-textSecond font-sans mt-0.5">Logged in on this device</p>
          </div>
          <Button onClick={logout} variant="ghost" className="text-xs">Log out</Button>
        </div>
      </Card>
    </div>
  )
}
