import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { isDriveConnected, backupData, getLastBackupTime, setLastBackupTime } from '../services/googleDrive'
import { exportAllData } from '../db/database'

export function useAutoBackup() {
  const { driveConnected, bumpData } = useApp()

  useEffect(() => {
    async function tryBackup() {
      if (!isDriveConnected()) return
      const last = getLastBackupTime()
      const stale = !last || (Date.now() - new Date(last).getTime()) > 24 * 3600000
      if (!stale) return
      try {
        const data = await exportAllData()
        await backupData(data)
        setLastBackupTime()
      } catch (e) {
        console.warn('Auto backup failed:', e)
      }
    }
    tryBackup()
  }, [driveConnected])

  useEffect(() => {
    async function onClose() {
      if (!isDriveConnected()) return
      try {
        const data = await exportAllData()
        await backupData(data)
      } catch {}
    }
    window.addEventListener('beforeunload', onClose)
    return () => window.removeEventListener('beforeunload', onClose)
  }, [])
}
