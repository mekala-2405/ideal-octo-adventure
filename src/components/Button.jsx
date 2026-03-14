export default function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  const variants = {
    primary:     'bg-orange hover:bg-orangeHover text-background font-semibold',
    secondary:   'bg-surfaceHigh border border-border hover:bg-border text-textPrimary',
    destructive: 'bg-error hover:opacity-80 text-textPrimary',
    ghost:       'text-textSecond hover:bg-surfaceHigh hover:text-textPrimary',
  }
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>}
      {children}
    </button>
  )
}
