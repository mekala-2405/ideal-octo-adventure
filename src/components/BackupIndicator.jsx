import { useApp } from '../context/AppContext'

function timeAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function BackupIndicator() {
  const { driveConnected, lastBackup } = useApp()
  const ago = timeAgo(lastBackup)
  const stale = lastBackup && (Date.now() - new Date(lastBackup).getTime()) > 48 * 3600000

  if (!driveConnected) return (
    <span className="text-[10px] text-muted font-mono flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-muted inline-block"/>no backup
    </span>
  )

  return (
    <span className={`text-[10px] font-mono flex items-center gap-1 ${stale ? 'text-warning' : 'text-success'}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${stale ? 'bg-warning' : 'bg-success'}`}/>
      {stale ? '⚠ ' : ''}backed up {ago}
    </span>
  )
}
