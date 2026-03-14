export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-border rounded-xl p-4 shadow-sm ${onClick ? 'cursor-pointer hover:bg-surfaceHigh transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, accent = false }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs text-textSecond font-sans uppercase tracking-widest">{label}</span>
      <span className={`text-2xl font-sans font-semibold ${accent ? 'text-orange' : 'text-textPrimary'}`}>{value}</span>
      {sub && <span className="text-xs text-muted font-sans">{sub}</span>}
    </Card>
  )
}
