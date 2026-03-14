import { useState, useEffect } from 'react'
import { db } from '../db/database'
import { generateInsights, getGroqKey } from '../services/groq'
import { useApp } from '../context/AppContext'
import Button from '../components/Button'
import Card from '../components/Card'

const LAST_INSIGHTS_KEY = 'ht_last_insights'

function loadCachedInsights() {
  const raw = localStorage.getItem(LAST_INSIGHTS_KEY)
  return raw ? JSON.parse(raw) : null
}

export default function Insights() {
  const { addToast } = useApp()
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState(loadCachedInsights())
  const hasKey = !!getGroqKey()

  async function generate() {
    if (!hasKey) return addToast('Add your Groq API key in Settings first', 'error')
    setLoading(true)
    try {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
      const cutoffStr = cutoff.toISOString().split('T')[0]

      const [workouts, metrics] = await Promise.all([
        db.workouts.where('date').aboveOrEqual(cutoffStr).toArray(),
        db.metrics.where('date').aboveOrEqual(cutoffStr).toArray()
      ])

      const recentWorkouts = workouts.map(w => ({
        date: w.date, exercise: w.exerciseName,
        volume: w.sets.reduce((s,set) => s + set.reps * set.weight, 0),
        maxWeight: Math.max(...w.sets.map(s => s.weight))
      }))

      const weightTrend = metrics.map(m => ({ date: m.date, weight: m.weight, bodyFat: m.bodyFat }))

      // Weekly volumes last 8 weeks
      const weeklyVolume = []
      for (let i = 7; i >= 0; i--) {
        const end = new Date(); end.setDate(end.getDate() - i * 7)
        const start = new Date(end); start.setDate(start.getDate() - 6)
        const startStr = start.toISOString().split('T')[0]
        const endStr = end.toISOString().split('T')[0]
        const vol = workouts.filter(w => w.date >= startStr && w.date <= endStr)
          .reduce((s,w) => s + w.sets.reduce((ss,set) => ss + set.reps * set.weight, 0), 0)
        weeklyVolume.push({ week: startStr, volume: vol })
      }

      const result = await generateInsights({ recentWorkouts, weightTrend, weeklyVolume })
      const withTime = { ...result, generatedAt: new Date().toISOString() }
      setInsights(withTime)
      localStorage.setItem(LAST_INSIGHTS_KEY, JSON.stringify(withTime))
      await db.insights.add(withTime)
      addToast('Insights generated!', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to generate insights', 'error')
    }
    setLoading(false)
  }

  const sections = [
    { key: 'plateauDetection',       title: 'Plateau Detection',         icon: '📊' },
    { key: 'weeklyProgressSummary',  title: 'Weekly Progress Summary',   icon: '📈' },
    { key: 'trainingRecommendations',title: 'Training Recommendations',   icon: '💡' },
  ]

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-sans font-semibold text-textPrimary">AI Insights</h1>
        {insights?.generatedAt && (
          <span className="text-[10px] text-muted font-mono">
            {new Date(insights.generatedAt).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
          </span>
        )}
      </div>
      <p className="text-textSecond text-xs font-sans mb-5">Powered by Groq · Llama 3 70B · Only text data is sent</p>

      {!hasKey && (
        <div className="bg-orangeMuted border border-orange/20 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-orange font-sans font-medium">No API Key</p>
          <p className="text-xs text-textSecond font-sans mt-1">Add your Groq API key in Settings → AI Insights to enable this feature. Groq is free at console.groq.com</p>
        </div>
      )}

      <Button onClick={generate} loading={loading} className="w-full mb-6" disabled={!hasKey}>
        {loading ? 'Analysing your data...' : '✨ Generate Insights'}
      </Button>

      {insights && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {sections.map(s => insights[s.key] && (
            <div key={s.key} className="bg-surfaceHigh border-l-4 border-orange rounded-r-xl px-4 py-4">
              <p className="text-xs text-textSecond uppercase tracking-widest font-sans mb-2" style={{fontVariant:'small-caps'}}>
                {s.icon} {s.title}
              </p>
              <p className="text-textPrimary text-sm font-serif leading-relaxed">{insights[s.key]}</p>
            </div>
          ))}
        </div>
      )}

      {!insights && !loading && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🤖</p>
          <p className="text-textSecond text-sm font-sans">Hit "Generate Insights" to get a personalised analysis of your training and progress.</p>
        </div>
      )}
    </div>
  )
}
