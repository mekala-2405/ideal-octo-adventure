import { useState, useEffect, useRef } from 'react'
import { db } from '../db/database'
import { useApp } from '../context/AppContext'
import { isDriveConnected, uploadPhoto } from '../services/googleDrive'
import Button from '../components/Button'
import Card from '../components/Card'

async function compressImage(file, maxDim = 400) {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob) }, 'image/jpeg', 0.75)
    }
    img.src = url
  })
}

export default function Photos() {
  const { addToast, bumpData, dataVersion } = useApp()
  const [photos, setPhotos] = useState([])
  const [tab, setTab] = useState('gallery')
  const [uploading, setUploading] = useState(false)
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')
  const [compareImgA, setCompareImgA] = useState(null)
  const [compareImgB, setCompareImgB] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    db.photos.orderBy('date').reverse().toArray().then(setPhotos)
  }, [dataVersion])

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const thumbnail = await compressImage(file, 400)
      const date = new Date().toISOString().split('T')[0]
      let driveFileId = null

      if (isDriveConnected()) {
        try {
          driveFileId = await uploadPhoto(file, `${date}.jpg`)
        } catch (err) {
          addToast('Photo saved locally. Drive upload failed.', 'warning')
        }
      }

      await db.photos.add({ date, blob: thumbnail, driveFileId, syncedAt: driveFileId ? new Date().toISOString() : null })
      bumpData()
      addToast('Photo saved!', 'success')
    } catch (err) {
      addToast('Failed to save photo', 'error')
    }
    setUploading(false)
    e.target.value = ''
  }

  async function deletePhoto(id) {
    await db.photos.delete(id)
    bumpData()
    addToast('Deleted', 'info')
  }

  async function loadCompare() {
    if (!compareA || !compareB) return addToast('Select two dates', 'error')
    const pA = photos.find(p => p.date === compareA)
    const pB = photos.find(p => p.date === compareB)
    if (!pA || !pB) return addToast('No photo found for one of the dates', 'error')
    setCompareImgA(URL.createObjectURL(pA.blob))
    setCompareImgB(URL.createObjectURL(pB.blob))
  }

  const dates = [...new Set(photos.map(p => p.date))]

  return (
    <div className="pb-nav px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-sans font-semibold text-textPrimary">Progress Photos</h1>
        <button onClick={() => fileRef.current?.click()}
          className="bg-orange hover:bg-orangeHover text-background text-xs font-sans font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
          {uploading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/> : '📷'} Add Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
      </div>

      {!isDriveConnected() && (
        <div className="bg-orangeMuted border border-orange/20 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
          <span className="text-orange text-sm mt-0.5">⚠</span>
          <p className="text-xs text-textSecond font-sans">Photos are not backed up. Connect Google Drive in Settings to enable photo backup.</p>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {['gallery','compare'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-sans capitalize transition-colors ${tab===t ? 'bg-orangeMuted text-orange border border-orange/30' : 'bg-surfaceHigh text-muted'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'gallery' && (
        <div className="animate-fade-in">
          {photos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📸</p>
              <p className="text-textSecond text-sm font-sans">No photos yet. Tap "Add Photo" to start tracking your progress.</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => (
              <div key={p.id} className="relative aspect-square group">
                <img src={URL.createObjectURL(p.blob)} alt={p.date}
                  className="w-full h-full object-cover rounded-xl border border-border" />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] text-textPrimary font-mono">{p.date}</span>
                  <button onClick={() => deletePhoto(p.id)} className="text-error text-xs">✕ delete</button>
                </div>
                {!p.driveFileId && <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" title="Not backed up"/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'compare' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <Card>
            <p className="text-xs text-textSecond uppercase tracking-wider font-sans mb-3">Select Two Dates to Compare</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted font-sans block mb-1">Before</label>
                <select value={compareA} onChange={e => setCompareA(e.target.value)}
                  className="w-full bg-surfaceHigh border border-border rounded-lg px-2 py-2 text-textPrimary text-xs font-sans focus:outline-none focus:border-orange">
                  <option value="">— date —</option>
                  {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted font-sans block mb-1">After</label>
                <select value={compareB} onChange={e => setCompareB(e.target.value)}
                  className="w-full bg-surfaceHigh border border-border rounded-lg px-2 py-2 text-textPrimary text-xs font-sans focus:outline-none focus:border-orange">
                  <option value="">— date —</option>
                  {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={loadCompare} className="w-full" variant="secondary">Compare</Button>
          </Card>

          {compareImgA && compareImgB && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div>
                <p className="text-xs text-muted font-mono text-center mb-1">{compareA}</p>
                <img src={compareImgA} alt="before" className="w-full rounded-xl border border-border object-cover aspect-[3/4]" />
              </div>
              <div>
                <p className="text-xs text-orange font-mono text-center mb-1">{compareB}</p>
                <img src={compareImgB} alt="after" className="w-full rounded-xl border border-orange/30 object-cover aspect-[3/4]" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
