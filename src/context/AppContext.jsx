import { createContext, useContext, useState, useCallback } from 'react'
import { isLoggedIn, logout as authLogout } from '../services/auth'
import { isDriveConnected, getLastBackupTime } from '../services/googleDrive'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [driveConnected, setDriveConnected] = useState(isDriveConnected())
  const [lastBackup, setLastBackup] = useState(getLastBackupTime())
  const [toasts, setToasts] = useState([])
  const [dataVersion, setDataVersion] = useState(0)

  const refreshDriveStatus = useCallback(() => {
    setDriveConnected(isDriveConnected())
    setLastBackup(getLastBackupTime())
  }, [])

  const bumpData = useCallback(() => setDataVersion(v => v + 1), [])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setLoggedIn(false)
  }, [])

  return (
    <AppContext.Provider value={{ loggedIn, setLoggedIn, driveConnected, refreshDriveStatus, lastBackup, setLastBackup, toasts, addToast, dataVersion, bumpData, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() { return useContext(AppContext) }
