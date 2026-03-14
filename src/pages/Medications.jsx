import { useState, useEffect, useRef } from 'react'
import { db } from '../db/database'
import { useApp } from '../context/AppContext'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'

function checkMissed(meds) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const missed = []
  for (const med of meds) {
    if (!med.active) continue
    const [h, m] = med.time.split(':').map(Number)
    const medTime = new Date(); medTime.setHours(h, m, 0, 0)
    const lastTaken = localStorage.getItem(`ht_taken_${med.id}_${today}`)
    if (!lastTaken && medTime < now) missed.push(med)
  }
  return missed
}

export default function Medications() {
  const { addToast, bumpData, dataVersion } = useApp()
  const [meds, setMeds] = useState([])
  const [missed, setMissed] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [time, setTime] = useState('08:00')
  const [saving, setSaving] = useState(false)
  const timersRef = useRef([])

  useEffect(() => {
    db.medications.where('active').equals(1).toArray().then(ms => {
      setMeds(ms)
      setMissed(checkMissed(ms))
      scheduleReminders(ms)
    })
    return () => timersRef.current.forEach(clearTimeout)
  }, [dataVersion])

  function scheduleReminders(medications) {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (Notification.permission !== 'granted') return
    const now = new Date()
    for (const med of medications) {
      if (!med.active) continue
      const [h, m] = med.time.split(':').map(Number)
      const target = new Date(); target.setHours(h, m, 0, 0)
      if (target <= now) target.setDate(target.getDate() + 1)
      const delay = target - now
      const t = setTimeout(() => {
        new Notification(`💊 ${med.name}`, { body: `Time to take ${med.dosage}`, icon: '/icons/icon-192.png' })
      }, delay)
      timersRef.current.push(t)
    }
  }

  async function requestNotifPermission() {
    const perm = await Notification.requestPermission()
    if (perm === 'granted') { addToast('Notifications enabled', 'success'); scheduleReminders(meds) }
    else addToast('Notifications blocked. Check browser settings.', 'warning')
  }

  async function saveMed() {
    if (!name.trim() || !dosage.trim()) return addToast('Fill in all fields', 'error')
    setSaving(true)
    await db.medications.add({ name: name.trim(), dosage: dosage.trim(), time, active: 1 })
    bumpData(); setName(''); setDosage(''); setTime('08:00'); setShowAdd(false)
    addToast('Medication added', 'success')
    setSaving(false)
  }

  async function deleteMed(id) {
    await db.medications.delete(id)
    bumpData()
    addToast('Removed', 'info')
  }

  function markTaken(med) {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`ht_taken_${med.id}_${today}`, '1')
    setMissed(m => m.filter(x => x.id !== med.id))
    addToast(`${med.name} marked as taken ✓`, 'success')
  }

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-sans font-semibold text-textPrimary">Medications</h1>
        <button onClick={() => setShowAdd(o => !o)}
          className="bg-orange hover:bg-orangeHover text-background text-xs font-sans font-semibold px-3 py-2 rounded-lg transition-colors">
          + Add
        </button>
      </div>

      {Notification.permission === 'default' && (
        <button onClick={requestNotifPermission}
          className="w-full bg-orangeMuted border border-orange/20 rounded-xl px-4 py-3 mb-4 text-left">
          <p className="text-xs text-orange font-sans font-medium">Enable Notifications</p>
          <p className="text-xs text-textSecond font-sans mt-0.5">Tap to allow medication reminders while the app is open.</p>
        </button>
      )}

      {missed.length > 0 && (
        <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-error font-sans font-medium mb-2">⚠ Missed doses today</p>
          {missed.map(med => (
            <div key={med.id} className="flex items-center justify-between py-1">
              <span className="text-xs text-textSecond font-sans">{med.name} — {med.dosage} at {med.time}</span>
              <button onClick={() => markTaken(med)} className="text-xs text-success font-sans">Mark taken</button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Card className="mb-4 animate-fade-in">
          <p className="text-xs text-textSecond uppercase tracking-wider font-sans mb-3">New Medication</p>
          <div className="flex flex-col gap-3">
            <Input label="Medication Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Vitamin D" />
            <Input label="Dosage" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 1000 IU" />
            <Input label="Reminder Time" type="time" value={time} onChange={e => setTime(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={saveMed} loading={saving} className="flex-1">Save</Button>
              <Button onClick={() => setShowAdd(false)} variant="secondary" className="flex-1">Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {meds.length === 0 && !showAdd && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💊</p>
            <p className="text-textSecond text-sm font-sans">No medications added. Tap + Add to get started.</p>
          </div>
        )}
        {meds.map(med => {
          const today = new Date().toISOString().split('T')[0]
          const taken = !!localStorage.getItem(`ht_taken_${med.id}_${today}`)
          return (
            <div key={med.id} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${taken ? 'bg-success' : 'bg-orange'}`}/>
                <div>
                  <p className="text-textPrimary text-sm font-sans font-medium">{med.name}</p>
                  <p className="text-textSecond text-xs font-sans">{med.dosage} · {med.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!taken && <button onClick={() => markTaken(med)} className="text-xs text-success font-sans">✓ Take</button>}
                {taken && <span className="text-xs text-success font-sans">Taken</span>}
                <button onClick={() => deleteMed(med.id)} className="text-error text-xs opacity-60 hover:opacity-100">✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
