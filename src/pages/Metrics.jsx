import { useState, useEffect } from 'react'
import { db } from '../db/database'
import { useApp } from '../context/AppContext'
import Button from '../components/Button'
import Card from '../components/Card'
import SliderInput from '../components/SliderInput'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'

const getUnits  = () => localStorage.getItem('ht_units')   || 'kg'
const getMeasure = () => localStorage.getItem('ht_measure') || 'cm'
const chartStyle = { background:'#242018', border:'1px solid #2e2a24', borderRadius:'8px', fontSize:'11px', color:'#e8e0d5' }

export default function Metrics() {
  const { addToast, bumpData, dataVersion } = useApp()
  const [records, setRecords] = useState([])
  const [tab, setTab]         = useState('log')
  const units  = getUnits()
  const measure = getMeasure()

  // Slider ranges vary by unit
  const weightMax  = units   === 'lbs' ? 400  : 200
  const weightStep = units   === 'lbs' ? 0.5  : 0.1
  const waistMax   = measure === 'in'  ? 60   : 150
  const waistStep  = measure === 'in'  ? 0.5  : 0.5

  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0])
  const [weight,  setWeight]  = useState(units === 'lbs' ? 160 : 75)
  const [bodyFat, setBodyFat] = useState(20)
  const [waist,   setWaist]   = useState(measure === 'in' ? 32 : 82)
  const [logBf,   setLogBf]   = useState(false)
  const [logWaist,setLogWaist]= useState(false)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    db.metrics.orderBy('date').toArray().then(rows => {
      setRecords(rows)
      // Pre-fill sliders with last entry
      if (rows.length) {
        const last = rows[rows.length - 1]
        if (last.weight)  setWeight(last.weight)
        if (last.bodyFat) { setBodyFat(last.bodyFat); setLogBf(true) }
        if (last.waist)   { setWaist(last.waist);     setLogWaist(true) }
      }
    })
  }, [dataVersion])

  async function save() {
    setSaving(true)
    const existing = await db.metrics.where('date').equals(date).first()
    const data = {
      date,
      weight:  weight,
      bodyFat: logBf    ? bodyFat : null,
      waist:   logWaist ? waist   : null,
    }
    if (existing) await db.metrics.update(existing.id, data)
    else          await db.metrics.add(data)
    bumpData()
    addToast('Metrics saved! ✓', 'success')
    setSaving(false)
  }

  async function deleteRecord(id) {
    await db.metrics.delete(id)
    bumpData()
    addToast('Deleted', 'info')
  }

  // Weekly averages
  const weeklyAvgs = []
  for (let i = 7; i >= 0; i--) {
    const end   = new Date(); end.setDate(end.getDate() - i * 7); end.setHours(23,59,59)
    const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0,0,0)
    const week  = records.filter(r => { const d = new Date(r.date+'T12:00:00'); return d >= start && d <= end })
    if (week.length) {
      const avg = (week.reduce((s,r) => s+r.weight, 0) / week.length).toFixed(1)
      weeklyAvgs.push({ week: `W${8-i}`, avg: +avg, entries: week.length })
    }
  }

  // Trend: simple linear regression to show direction
  const trendArrow = () => {
    if (records.length < 3) return null
    const recent = records.slice(-7)
    const first  = recent[0].weight
    const last   = recent[recent.length-1].weight
    const diff   = (last - first).toFixed(1)
    if (Math.abs(diff) < 0.2) return { arrow: '→', color: 'text-textSecond', label: 'Stable' }
    if (diff < 0) return { arrow: '↓', color: 'text-success', label: `${Math.abs(diff)} ${units} down (7d)` }
    return { arrow: '↑', color: 'text-amber', label: `${diff} ${units} up (7d)` }
  }
  const trend = trendArrow()

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-sans font-semibold text-textPrimary mb-4">Body Metrics</h1>

      <div className="flex gap-2 mb-5">
        {['log','charts','history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-sans capitalize transition-colors ${tab===t ? 'bg-orangeMuted text-orange border border-orange/30' : 'bg-surfaceHigh text-muted'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <div className="flex flex-col gap-5 animate-fade-in">

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-textSecond uppercase tracking-wider font-sans">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-surfaceHigh border border-border rounded-lg px-3 py-2.5 text-textPrimary text-sm font-sans focus:outline-none focus:border-orange transition-colors" />
          </div>

          {/* Weight slider */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <SliderInput
              label={`Body Weight`}
              value={weight}
              onChange={setWeight}
              min={units === 'lbs' ? 60 : 30}
              max={weightMax}
              step={weightStep}
              unit={units}
            />
          </div>

          {/* Body fat toggle + slider */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-textPrimary font-sans font-medium">Body Fat %</span>
              <button onClick={() => setLogBf(o => !o)}
                className={`relative w-10 h-5 rounded-full transition-colors ${logBf ? 'bg-orange' : 'bg-border'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${logBf ? 'translate-x-5' : 'translate-x-0.5'}`}/>
              </button>
            </div>
            {logBf ? (
              <SliderInput
                value={bodyFat}
                onChange={setBodyFat}
                min={3} max={50} step={0.1}
                unit="%"
              />
            ) : (
              <p className="text-xs text-muted font-sans">Toggle on to log body fat percentage</p>
            )}
          </div>

          {/* Waist toggle + slider */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-textPrimary font-sans font-medium">Waist Measurement</span>
              <button onClick={() => setLogWaist(o => !o)}
                className={`relative w-10 h-5 rounded-full transition-colors ${logWaist ? 'bg-orange' : 'bg-border'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${logWaist ? 'translate-x-5' : 'translate-x-0.5'}`}/>
              </button>
            </div>
            {logWaist ? (
              <SliderInput
                value={waist}
                onChange={setWaist}
                min={measure === 'in' ? 20 : 50}
                max={waistMax}
                step={waistStep}
                unit={measure}
              />
            ) : (
              <p className="text-xs text-muted font-sans">Toggle on to log waist measurement</p>
            )}
          </div>

          {trend && (
            <div className="flex items-center gap-2 bg-surfaceHigh border border-border rounded-xl px-4 py-3">
              <span className={`text-xl ${trend.color}`}>{trend.arrow}</span>
              <span className="text-xs text-textSecond font-sans">{trend.label}</span>
            </div>
          )}

          <Button onClick={save} loading={saving} className="w-full">Save Today's Metrics</Button>
        </div>
      )}

      {/* ── CHARTS TAB ── */}
      {tab === 'charts' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {records.length < 2 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">📊</p>
              <p className="text-textSecond text-sm font-sans mb-3">Log at least 2 days to see your trends.</p>
              <button onClick={() => setTab('log')} className="text-orange text-sm font-sans underline underline-offset-2">Log today's metrics →</button>
            </div>
          ) : (
            <>
              <Card>
                <p className="text-xs text-textSecond uppercase tracking-widest mb-1 font-sans">Weight Trend ({units})</p>
                {trend && <p className={`text-xs mb-3 font-sans ${trend.color}`}>{trend.arrow} {trend.label}</p>}
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={records}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2e2a24" />
                    <XAxis dataKey="date" tick={{fontSize:9,fill:'#a89f94'}} tickFormatter={d=>d.slice(5)} interval="preserveStartEnd" />
                    <YAxis tick={{fontSize:10,fill:'#a89f94'}} width={35} domain={['auto','auto']} />
                    <Tooltip contentStyle={chartStyle} formatter={v=>[`${v} ${units}`,'Weight']} />
                    <Line type="monotone" dataKey="weight" stroke="#e8743a" strokeWidth={2} dot={false} activeDot={{r:4, fill:'#e8743a'}} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {records.some(r => r.bodyFat) && (
                <Card>
                  <p className="text-xs text-textSecond uppercase tracking-widest mb-3 font-sans">Body Fat %</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={records.filter(r => r.bodyFat)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e2a24" />
                      <XAxis dataKey="date" tick={{fontSize:9,fill:'#a89f94'}} tickFormatter={d=>d.slice(5)} interval="preserveStartEnd" />
                      <YAxis tick={{fontSize:10,fill:'#a89f94'}} width={30} domain={['auto','auto']} />
                      <Tooltip contentStyle={chartStyle} formatter={v=>[`${v}%`,'Body Fat']} />
                      <Line type="monotone" dataKey="bodyFat" stroke="#c4852a" strokeWidth={2} dot={false} activeDot={{r:4,fill:'#c4852a'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {weeklyAvgs.length > 1 && (
                <Card>
                  <p className="text-xs text-textSecond uppercase tracking-widest mb-3 font-sans">Weekly Averages</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-sans">
                      <thead>
                        <tr className="text-muted">
                          <th className="text-left py-1.5">Week</th>
                          <th className="text-right py-1.5">Avg Weight</th>
                          <th className="text-right py-1.5">Entries</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyAvgs.map((w, i) => {
                          const prev = weeklyAvgs[i-1]
                          const delta = prev ? (w.avg - prev.avg).toFixed(1) : null
                          return (
                            <tr key={w.week} className="border-t border-border">
                              <td className="py-2 text-textSecond">{w.week}</td>
                              <td className="py-2 text-right text-textPrimary font-mono">
                                {w.avg} {units}
                                {delta !== null && (
                                  <span className={`ml-2 text-[10px] ${+delta < 0 ? 'text-success' : +delta > 0 ? 'text-amber' : 'text-muted'}`}>
                                    {+delta > 0 ? '+' : ''}{delta}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-right text-muted">{w.entries}d</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="flex flex-col gap-2 animate-fade-in">
          {records.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">⚖️</p>
              <p className="text-textSecond text-sm font-sans">No metrics logged yet.</p>
            </div>
          )}
          {[...records].reverse().map(r => (
            <div key={r.id} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
              <div>
                <p className="text-xs text-textSecond font-sans">
                  {new Date(r.date+'T12:00:00').toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-textPrimary text-sm font-mono">{r.weight}{units}</span>
                  {r.bodyFat && <span className="text-[11px] bg-surfaceHigh border border-border rounded px-1.5 py-0.5 text-textSecond font-mono">{r.bodyFat}% bf</span>}
                  {r.waist   && <span className="text-[11px] bg-surfaceHigh border border-border rounded px-1.5 py-0.5 text-textSecond font-mono">{r.waist}{measure}</span>}
                </div>
              </div>
              <button onClick={() => deleteRecord(r.id)} className="text-error text-xs opacity-40 hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
