export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-textSecond font-sans uppercase tracking-wider">{label}</label>}
      <input
        className={`bg-surfaceHigh border border-border rounded-lg px-3 py-2.5 text-textPrimary text-sm font-sans placeholder-muted focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/40 transition-colors ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-textSecond font-sans uppercase tracking-wider">{label}</label>}
      <textarea
        className={`bg-surfaceHigh border border-border rounded-lg px-3 py-2.5 text-textPrimary text-sm font-sans placeholder-muted focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange/40 transition-colors resize-none ${className}`}
        {...props}
      />
    </div>
  )
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-textSecond font-sans uppercase tracking-wider">{label}</label>}
      <select
        className={`bg-surfaceHigh border border-border rounded-lg px-3 py-2.5 text-textPrimary text-sm font-sans focus:outline-none focus:border-orange transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
