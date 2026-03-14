import Dexie from 'dexie'

export const db = new Dexie('HealthTrackerDB')

db.version(1).stores({
  workouts:    '++id, date, exerciseName',
  metrics:     '++id, date',
  photos:      '++id, date, driveFileId, syncedAt',
  medications: '++id, name, time, active',
  insights:    '++id, generatedAt',
  settings:    'key'
})

export async function exportAllData() {
  const [workouts, metrics, medications, insights] = await Promise.all([
    db.workouts.toArray(),
    db.metrics.toArray(),
    db.medications.toArray(),
    db.insights.toArray(),
  ])
  const photos = await db.photos.toArray()
  const photosNoBlob = photos.map(({ blob, ...rest }) => rest)
  return { workouts, metrics, medications, insights, photos: photosNoBlob, exportedAt: new Date().toISOString() }
}

export async function importAllData(data) {
  await db.transaction('rw', db.workouts, db.metrics, db.medications, db.insights, async () => {
    if (data.workouts)    { await db.workouts.clear();    await db.workouts.bulkAdd(data.workouts) }
    if (data.metrics)     { await db.metrics.clear();     await db.metrics.bulkAdd(data.metrics) }
    if (data.medications) { await db.medications.clear(); await db.medications.bulkAdd(data.medications) }
    if (data.insights)    { await db.insights.clear();    await db.insights.bulkAdd(data.insights) }
  })
}
