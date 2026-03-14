import { useState } from 'react'
import { login, getUsername } from '../services/auth'
import { useApp } from '../context/AppContext'
import Button from '../components/Button'
import Input from '../components/Input'

export default function LoginPage() {
  const { setLoggedIn } = useApp()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const username = getUsername()

  async function handleLogin() {
    setError('')
    if (!password) return setError('Enter your password')
    setLoading(true)
    const ok = await login(username, password)
    setLoading(false)
    if (ok) setLoggedIn(true)
    else setError('Incorrect password')
  }

  return (
    <div className="min-h-[100svh] min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏋️</div>
          <h1 className="text-2xl font-sans font-semibold text-textPrimary mb-1">Welcome back</h1>
          <p className="text-textSecond text-sm font-sans">{username}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoFocus
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <p className="text-xs text-error font-sans">{error}</p>}
          <Button onClick={handleLogin} loading={loading} className="w-full">Unlock</Button>
        </div>
      </div>
    </div>
  )
}
