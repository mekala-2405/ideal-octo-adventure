import { useState } from 'react'
import { setupCredentials } from '../services/auth'
import { useApp } from '../context/AppContext'
import Button from '../components/Button'
import Input from '../components/Input'

export default function SetupPage() {
  const { setLoggedIn } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSetup() {
    setError('')
    if (!username.trim()) return setError('Username is required')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    await setupCredentials(username.trim(), password)
    setLoading(false)
    setLoggedIn(true)
  }

  return (
    <div className="min-h-[100svh] min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏋️</div>
          <h1 className="text-2xl font-sans font-semibold text-textPrimary mb-1">Welcome</h1>
          <p className="text-textSecond text-sm font-sans">Set up your personal health tracker</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="border-l-4 border-orange pl-3 mb-2">
            <p className="text-xs text-textSecond font-sans">First time setup — create your login credentials. These are stored only on this device.</p>
          </div>
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="yourname" autoCapitalize="none" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSetup()} />
          {error && <p className="text-xs text-error font-sans">{error}</p>}
          <Button onClick={handleSetup} loading={loading} className="mt-2 w-full">Create Account</Button>
        </div>
      </div>
    </div>
  )
}
