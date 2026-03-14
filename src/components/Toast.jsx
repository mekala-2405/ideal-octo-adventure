import { useApp } from '../context/AppContext'

const icons = {
  info:    '◆',
  success: '✓',
  error:   '✕',
  warning: '⚠',
}
const borders = {
  info:    'border-orange',
  success: 'border-success',
  error:   'border-error',
  warning: 'border-warning',
}

export default function Toast() {
  const { toasts } = useApp()
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 bg-surfaceHigh border-l-4 ${borders[t.type] || borders.info} px-4 py-3 rounded-lg shadow-xl text-textPrimary text-sm font-sans min-w-[220px] max-w-xs animate-slide-in`}>
          <span className="text-orange font-mono text-xs">{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
