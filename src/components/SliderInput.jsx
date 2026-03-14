import { useRef } from 'react'

/**
 * SliderInput — a styled range slider with big value display and ±  fine-tune buttons.
 * Props: label, value, onChange(num), min, max, step, unit
 */
export default function SliderInput({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }) {
  const pct = Math.round(((value - min) / (max - min)) * 100)

  function nudge(delta) {
    const next = Math.min(max, Math.max(min, +value + delta))
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-textSecond uppercase tracking-wider font-sans">{label}</span>
          <span className="text-lg font-sans font-semibold text-textPrimary tabular-nums">
            {value}<span className="text-xs text-muted ml-1 font-normal">{unit}</span>
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* minus */}
        <button
          onPointerDown={e => { e.preventDefault(); nudge(-step) }}
          className="w-9 h-9 flex-shrink-0 rounded-lg bg-surfaceHigh border border-border text-textPrimary text-lg font-sans leading-none flex items-center justify-center active:bg-border transition-colors select-none"
        >−</button>

        {/* slider track */}
        <div className="relative flex-1 h-8 flex items-center">
          <div className="absolute inset-x-0 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-orange rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(+e.target.value)}
            className="absolute inset-x-0 w-full opacity-0 h-8 cursor-pointer"
          />
          {/* custom thumb */}
          <div
            className="absolute w-5 h-5 bg-orange rounded-full border-2 border-background shadow-lg pointer-events-none transition-all"
            style={{ left: `calc(${pct}% - 10px)` }}
          />
        </div>

        {/* plus */}
        <button
          onPointerDown={e => { e.preventDefault(); nudge(step) }}
          className="w-9 h-9 flex-shrink-0 rounded-lg bg-surfaceHigh border border-border text-textPrimary text-lg font-sans leading-none flex items-center justify-center active:bg-border transition-colors select-none"
        >+</button>
      </div>

      <div className="flex justify-between text-[10px] text-muted font-mono px-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

/**
 * StepperInput — compact −/value/+ for reps (integers, small range)
 */
export function StepperInput({ label, value, onChange, min = 1, max = 50 }) {
  function nudge(delta) {
    onChange(Math.min(max, Math.max(min, +value + delta)))
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs text-textSecond uppercase tracking-wider font-sans">{label}</span>}
      <div className="flex items-center bg-surfaceHigh border border-border rounded-lg overflow-hidden h-11">
        <button
          onPointerDown={e => { e.preventDefault(); nudge(-1) }}
          className="w-11 h-full flex items-center justify-center text-textPrimary text-xl font-sans border-r border-border active:bg-border transition-colors select-none flex-shrink-0"
        >−</button>
        <span className="flex-1 text-center text-textPrimary font-sans font-semibold text-base tabular-nums select-none">
          {value}
        </span>
        <button
          onPointerDown={e => { e.preventDefault(); nudge(1) }}
          className="w-11 h-full flex items-center justify-center text-textPrimary text-xl font-sans border-l border-border active:bg-border transition-colors select-none flex-shrink-0"
        >+</button>
      </div>
    </div>
  )
}
