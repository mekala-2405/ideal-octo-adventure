import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import Metrics from './pages/Metrics'
import Photos from './pages/Photos'
import Medications from './pages/Medications'
import Insights from './pages/Insights'
import Settings from './pages/Settings'
import { isFirstLaunch } from './services/auth'

function AppShell() {
  const { loggedIn } = useApp()

  if (isFirstLaunch()) return <SetupPage />
  if (!loggedIn) return <LoginPage />

  return (
    <div className="min-h-[100svh] min-h-dvh bg-background">
      <Routes>
        <Route path="/"            element={<Dashboard />} />
        <Route path="/workouts"    element={<Workouts />} />
        <Route path="/metrics"     element={<Metrics />} />
        <Route path="/photos"      element={<Photos />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/insights"    element={<Insights />} />
        <Route path="/settings"    element={<Settings />} />
        <Route path="*"            element={<Navigate to="/" />} />
      </Routes>
      <BottomNav />
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  )
}
