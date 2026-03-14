const GROQ_KEY = 'ht_groq_key'
const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export function getGroqKey() { return localStorage.getItem(GROQ_KEY) || '' }
export function setGroqKey(k) { localStorage.setItem(GROQ_KEY, k) }

export async function generateInsights(payload) {
  const key = getGroqKey()
  if (!key) throw new Error('No Groq API key set. Add it in Settings.')

  const prompt = `You are a personal fitness coach analyzing health data. Provide insights in exactly this JSON format:
{
  "plateauDetection": "2-3 sentences about any plateaus detected in weight or workout progress",
  "weeklyProgressSummary": "2-3 sentences summarizing this week vs last week",
  "trainingRecommendations": "2-3 actionable training recommendations based on the data"
}

Data:
${JSON.stringify(payload, null, 2)}

Respond ONLY with the JSON object. No markdown, no extra text.`

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Groq API error: ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices[0].message.content.trim()
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { plateauDetection: text, weeklyProgressSummary: '', trainingRecommendations: '' }
  }
}
