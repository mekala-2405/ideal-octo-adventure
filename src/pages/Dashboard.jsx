import { useEffect, useState } from 'react'
import { db } from '../db/database'
import { useApp } from '../context/AppContext'
import { useAutoBackup } from '../hooks/useAutoBackup'
import { StatCard } from '../components/Card'
import BackupIndicator from '../components/BackupIndicator'
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'

function getUnits() { return localStorage.getItem('ht_units') || 'kg' }

function calcStreak(workouts) {
  if (!workouts.length) return 0
  const days = [...new Set(workouts.map(w => w.date))].sort().reverse()
  let streak = 0
  let cursor = new Date(); cursor.setHours(0,0,0,0)
  for (const day of days) {
    const d = new Date(day); d.setHours(0,0,0,0)
    const diff = Math.round((cursor - d) / 86400000)
    if (diff === 0 || diff === streak) { streak++; cursor = d }
    else if (diff === streak + 1) { streak++; cursor = d }
    else break
  }
  return streak
}

function calcWeeklyVolume(workouts) {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0,0,0,0)
  return workouts
    .filter(w => new Date(w.date) >= weekAgo)
    .reduce((sum, w) => sum + (w.sets || []).reduce((s, set) => s + (set.reps * set.weight), 0), 0)
}

export default function Dashboard() {
  useAutoBackup()
  const { dataVersion } = useApp()
  const [workouts, setWorkouts] = useState([])
  const [metrics, setMetrics] = useState([])
  const [last7, setLast7] = useState([])
  const units = getUnits()

  useEffect(() => {
    async function load() {
      const [ws, ms] = await Promise.all([db.workouts.toArray(), db.metrics.orderBy('date').toArray()])
      setWorkouts(ws)
      setMetrics(ms)
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const hasWorkout = ws.some(w => w.date === dateStr)
        const metric = ms.find(m => m.date === dateStr)
        days.push({ date: dateStr, label: d.toLocaleDateString('en',{weekday:'short'}), hasWorkout, weight: metric?.weight || null })
      }
      setLast7(days)
    }
    load()
  }, [dataVersion])

  const streak = calcStreak(workouts)
  const volume = calcWeeklyVolume(workouts)
  const latestWeight = metrics.length ? metrics[metrics.length - 1].weight : null
  const weightData = metrics.slice(-30).map(m => ({ date: m.date, weight: m.weight }))

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-sans font-semibold text-textPrimary">Dashboard</h1>
          <p className="text-xs text-textSecond font-sans mt-0.5">{new Date().toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric'})}</p>
        </div>
        <BackupIndicator />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Streak" value={`${streak}d`} sub="consecutive days" accent />
        <StatCard label="Weekly Volume" value={volume > 999 ? `${(volume/1000).toFixed(1)}k` : volume} sub={units} />
        <StatCard label="Current Weight" value={latestWeight ? `${latestWeight}` : '—'} sub={latestWeight ? units : 'not logged'} />
        <StatCard label="Workouts" value={workouts.filter(w => { const d = new Date(w.date); const now = new Date(); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear() }).length} sub="this month" />
      </div>

      {weightData.length > 1 && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-4">
          <p className="text-xs text-textSecond uppercase tracking-widest mb-3 font-sans">Weight Trend</p>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={weightData}>
              <Line type="monotone" dataKey="weight" stroke="#e8743a" strokeWidth={2} dot={false} />
              <Tooltip contentStyle={{ background:'#242018', border:'1px solid #2e2a24', borderRadius:'8px', fontSize:'12px', color:'#e8e0d5' }} formatter={v => [`${v} ${units}`,'Weight']} labelFormatter={l => l} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-xs text-textSecond uppercase tracking-widest mb-3 font-sans">Last 7 Days</p>
        <div className="flex gap-2">
          {last7.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${day.hasWorkout ? 'bg-orangeMuted text-orange' : 'bg-surfaceHigh text-muted'}`}>
                {day.hasWorkout ? '✓' : '·'}
              </div>
              <span className="text-[9px] text-muted font-sans">{day.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
