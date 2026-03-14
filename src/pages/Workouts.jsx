import { useState, useEffect, useCallback } from 'react'
import { db } from '../db/database'
import { useApp } from '../context/AppContext'
import Button from '../components/Button'
import { Textarea } from '../components/Input'
import Card from '../components/Card'
import SliderInput, { StepperInput } from '../components/SliderInput'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts'

const chartStyle = { background:'#242018', border:'1px solid #2e2a24', borderRadius:'8px', fontSize:'11px', color:'#e8e0d5' }
const getUnits = () => localStorage.getItem('ht_units') || 'kg'

const TEMPLATES = [
  { label: '5 × 5',  sets: Array(5).fill({ reps: 5,  weight: 60 }) },
  { label: '3 × 10', sets: Array(3).fill({ reps: 10, weight: 40 }) },
  { label: '4 × 8',  sets: Array(4).fill({ reps: 8,  weight: 50 }) },
  { label: '3 × 12', sets: Array(3).fill({ reps: 12, weight: 30 }) },
]

function defaultSet() { return { reps: 8, weight: 60 } }

function SetRow({ set, index, total, onChange, onRemove, onDuplicate }) {
  const units = getUnits()
  const maxWeight = units === 'lbs' ? 500 : 250

  return (
    <div className="bg-surfaceHigh border border-border rounded-xl p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted">SET {index + 1}</span>
        <div className="flex gap-3">
          <button onClick={onDuplicate} className="text-xs text-textSecond font-sans hover:text-textPrimary transition-colors">
            ⧉ copy
          </button>
          {total > 1 && (
            <button onClick={onRemove} className="text-xs text-error font-sans hover:opacity-100 opacity-60 transition-opacity">
              ✕ remove
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StepperInput
          label="Reps"
          value={set.reps}
          onChange={v => onChange('reps', v)}
          min={1} max={50}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-textSecond uppercase tracking-wider font-sans">Weight</span>
            <span className="text-base font-sans font-semibold text-textPrimary tabular-nums">
              {set.weight}<span className="text-xs text-muted ml-1 font-normal">{units}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onPointerDown={e => { e.preventDefault(); onChange('weight', Math.max(0, set.weight - 2.5)) }}
              className="w-9 h-9 flex-shrink-0 rounded-lg bg-border text-textPrimary text-base flex items-center justify-center active:opacity-70 select-none"
            >−</button>
            <input
              type="range"
              min={0} max={maxWeight} step={2.5}
              value={set.weight}
              onChange={e => onChange('weight', +e.target.value)}
              className="flex-1 h-2 appearance-none rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #e8743a ${(set.weight/maxWeight)*100}%, #2e2a24 ${(set.weight/maxWeight)*100}%)`
              }}
            />
            <button
              onPointerDown={e => { e.preventDefault(); onChange('weight', Math.min(maxWeight, set.weight + 2.5)) }}
              className="w-9 h-9 flex-shrink-0 rounded-lg bg-border text-textPrimary text-base flex items-center justify-center active:opacity-70 select-none"
            >+</button>
          </div>
          <div className="flex justify-between text-[10px] text-muted font-mono">
            <span>0</span><span>{maxWeight}{units}</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs text-muted font-mono">
          Volume: <span className="text-amber">{(set.reps * set.weight).toFixed(1)} {units}</span>
        </span>
      </div>
    </div>
  )
}

export default function Workouts() {
  const { addToast, bumpData, dataVersion } = useApp()
  const [tab, setTab] = useState('log')
  const [history, setHistory] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const units = getUnits()

  const [exerciseName, setExerciseName] = useState('')
  const [sets, setSets] = useState([defaultSet()])
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  useEffect(() => {
    db.workouts.orderBy('date').reverse().toArray().then(setHistory)
  }, [dataVersion])

  const exercises = [...new Set(history.map(w => w.exerciseName))].sort()

  // Auto-fill from last session when exercise is picked
  const handleExerciseChange = useCallback((name) => {
    setExerciseName(name)
    if (!name.trim()) return
    const last = history.find(w => w.exerciseName === name)
    if (last && last.sets?.length) {
      setSets(last.sets.map(s => ({ reps: s.reps, weight: s.weight })))
      addToast(`Loaded last session for ${name}`, 'info')
    }
  }, [history, addToast])

  function addSet() { setSets(s => [...s, { ...s[s.length - 1] }]) }
  function removeSet(i) { setSets(s => s.filter((_, idx) => idx !== i)) }
  function updateSet(i, field, val) { setSets(s => s.map((set, idx) => idx === i ? { ...set, [field]: val } : set)) }
  function duplicateSet(i) { setSets(s => { const n = [...s]; n.splice(i + 1, 0, { ...s[i] }); return n }) }

  function applyTemplate(tpl) {
    setSets(tpl.sets.map(s => ({ ...s })))
    setShowTemplates(false)
    addToast(`Template ${tpl.label} applied`, 'info')
  }

  async function saveWorkout() {
    if (!exerciseName.trim()) return addToast('Enter an exercise name', 'error')
    setSaving(true)
    await db.workouts.add({
      exerciseName: exerciseName.trim(),
      sets: sets.map(s => ({ reps: +s.reps, weight: +s.weight })),
      notes,
      date
    })
    bumpData()
    setExerciseName('')
    setSets([defaultSet()])
    setNotes('')
    addToast('Workout saved! 💪', 'success')
    setSaving(false)
  }

  async function deleteWorkout(id) {
    await db.workouts.delete(id)
    bumpData()
    addToast('Deleted', 'info')
  }

  const totalVolume = sets.reduce((s, set) => s + set.reps * set.weight, 0)

  const progressData = selectedExercise
    ? [...history.filter(w => w.exerciseName === selectedExercise)].reverse()
        .map(w => ({
          date: w.date,
          maxWeight: Math.max(...w.sets.map(s => s.weight)),
          volume: w.sets.reduce((s, set) => s + set.reps * set.weight, 0)
        }))
    : []

  const grouped = history.reduce((acc, w) => {
    acc[w.date] = acc[w.date] || []
    acc[w.date].push(w)
    return acc
  }, {})

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-sans font-semibold text-textPrimary mb-4">Workouts</h1>

      <div className="flex gap-2 mb-5">
        {['log', 'history', 'progress'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-sans capitalize transition-colors ${tab === t ? 'bg-orangeMuted text-orange border border-orange/30' : 'bg-surfaceHigh text-muted'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <div className="flex flex-col gap-4 animate-fade-in">

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-textSecond uppercase tracking-wider font-sans">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-surfaceHigh border border-border rounded-lg px-3 py-2.5 text-textPrimary text-sm font-sans focus:outline-none focus:border-orange transition-colors" />
          </div>

          {/* Exercise name with autocomplete */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-textSecond uppercase tracking-wider font-sans">Exercise Name</label>
            <input
              value={exerciseName}
              onChange={e => handleExerciseChange(e.target.value)}
              placeholder="e.g. Bench Press"
              list="exercises-list"
              className="bg-surfaceHigh border border-border rounded-lg px-3 py-2.5 text-textPrimary text-sm font-sans placeholder-muted focus:outline-none focus:border-orange transition-colors"
            />
            <datalist id="exercises-list">
              {exercises.map(e => <option key={e} value={e} />)}
            </datalist>
            {exercises.includes(exerciseName) && (
              <p className="text-[10px] text-muted font-sans">↑ Loaded with your last session weights</p>
            )}
          </div>

          {/* Templates */}
          <div>
            <button onClick={() => setShowTemplates(o => !o)}
              className="text-xs text-textSecond font-sans flex items-center gap-1.5 hover:text-textPrimary transition-colors">
              <span className={`transition-transform ${showTemplates ? 'rotate-90' : ''}`}>▶</span>
              Quick templates
            </button>
            {showTemplates && (
              <div className="grid grid-cols-4 gap-2 mt-2 animate-fade-in">
                {TEMPLATES.map(tpl => (
                  <button key={tpl.label} onClick={() => applyTemplate(tpl)}
                    className="bg-surfaceHigh border border-border rounded-lg py-2 text-xs font-mono text-textPrimary hover:border-orange hover:text-orange transition-colors">
                    {tpl.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sets */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-textSecond uppercase tracking-wider font-sans">
                Sets · <span className="text-amber normal-case">
                  {totalVolume > 0 ? `${totalVolume.toFixed(0)} ${units} total` : ''}
                </span>
              </span>
              <button onClick={addSet} className="text-orange text-xs font-sans hover:text-orangeHover transition-colors">+ Add Set</button>
            </div>

            {sets.map((set, i) => (
              <SetRow
                key={i}
                set={set}
                index={i}
                total={sets.length}
                onChange={(field, val) => updateSet(i, field, val)}
                onRemove={() => removeSet(i)}
                onDuplicate={() => duplicateSet(i)}
              />
            ))}
          </div>

          <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel? Any PRs?" rows={2} />

          <Button onClick={saveWorkout} loading={saving} className="w-full">
            Save Workout
          </Button>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🏋️</p>
              <p className="text-textSecond text-sm font-sans mb-3">No workouts logged yet.</p>
              <button onClick={() => setTab('log')}
                className="text-orange text-sm font-sans underline underline-offset-2">Log your first workout →</button>
            </div>
          )}
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([d, ws]) => (
            <Card key={d}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-textSecond font-sans">
                  {new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[10px] text-muted font-mono">
                  {ws.reduce((s, w) => s + w.sets.reduce((ss, set) => ss + set.reps * set.weight, 0), 0).toFixed(0)} {units} vol
                </p>
              </div>
              {ws.map(w => (
                <div key={w.id} className="flex items-start justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-textPrimary text-sm font-sans font-medium">{w.exerciseName}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {w.sets.map((s, i) => (
                        <span key={i} className="text-[10px] font-mono bg-surfaceHigh border border-border rounded px-1.5 py-0.5 text-textSecond">
                          {s.reps}×{s.weight}{units}
                        </span>
                      ))}
                    </div>
                    {w.notes && <p className="text-muted text-xs font-sans mt-1.5 italic">{w.notes}</p>}
                  </div>
                  <button onClick={() => deleteWorkout(w.id)} className="text-error text-xs font-sans ml-3 mt-0.5 opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">✕</button>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {/* ── PROGRESS TAB ── */}
      {tab === 'progress' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-textSecond uppercase tracking-wider font-sans">Select Exercise</label>
            <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}
              className="w-full bg-surfaceHigh border border-border rounded-lg px-3 py-2.5 text-textPrimary text-sm font-sans focus:outline-none focus:border-orange">
              <option value="">— choose exercise —</option>
              {exercises.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {!selectedExercise && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📈</p>
              <p className="text-textSecond text-sm font-sans">Select an exercise to see your progress over time.</p>
            </div>
          )}

          {progressData.length > 1 && (
            <>
              <Card>
                <p className="text-xs text-textSecond uppercase tracking-widest mb-3 font-sans">Max Weight ({units})</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={progressData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a89f94' }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#a89f94' }} width={30} />
                    <Tooltip contentStyle={chartStyle} formatter={v => [`${v} ${units}`, 'Max']} />
                    <Line type="monotone" dataKey="maxWeight" stroke="#e8743a" strokeWidth={2} dot={{ fill: '#e8743a', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <p className="text-xs text-textSecond uppercase tracking-widest mb-3 font-sans">Session Volume ({units})</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={progressData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a89f94' }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: '#a89f94' }} width={35} />
                    <Tooltip contentStyle={chartStyle} formatter={v => [`${v} ${units}`, 'Volume']} />
                    <Bar dataKey="volume" fill="#c4852a" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Personal bests */}
              <Card>
                <p className="text-xs text-textSecond uppercase tracking-widest mb-3 font-sans">Personal Bests</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Max Weight', value: `${Math.max(...progressData.map(p => p.maxWeight))} ${units}` },
                    { label: 'Max Volume', value: `${Math.max(...progressData.map(p => p.volume)).toFixed(0)} ${units}` },
                    { label: 'Sessions',   value: progressData.length },
                  ].map(stat => (
                    <div key={stat.label} className="bg-surfaceHigh rounded-lg p-2 text-center">
                      <p className="text-[10px] text-muted font-sans mb-1">{stat.label}</p>
                      <p className="text-sm font-semibold text-orange font-sans">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {selectedExercise && progressData.length <= 1 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🌱</p>
              <p className="text-textSecond text-sm font-sans">Log at least 2 sessions of <span className="text-textPrimary">{selectedExercise}</span> to see your progress chart.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
