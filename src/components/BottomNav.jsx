import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { to: '/',          label: 'Dashboard', icon: <GridIcon /> },
  { to: '/workouts',  label: 'Workouts',  icon: <DumbbellIcon /> },
  { to: '/metrics',   label: 'Metrics',   icon: <ChartIcon /> },
  { to: '/photos',    label: 'Photos',    icon: <CameraIcon /> },
  { to: '/more',      label: 'More',      icon: <MenuIcon />, isMore: true },
]

function GridIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
}
function DumbbellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path d="M6 6v12M18 6v12M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12v6H6z"/></svg>
}
function ChartIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
}
function CameraIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
}
function MenuIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
}

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-16 right-2 bg-surfaceHigh border border-border rounded-xl shadow-2xl overflow-hidden w-48" onClick={e => e.stopPropagation()}>
            {[
              { to: '/medications', label: 'Medications', emoji: '💊' },
              { to: '/insights',    label: 'AI Insights',  emoji: '🤖' },
              { to: '/settings',    label: 'Settings',     emoji: '⚙️' },
            ].map(item => (
              <button key={item.to} onClick={() => { navigate(item.to); setMoreOpen(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-textPrimary hover:bg-border text-sm font-sans transition-colors">
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(item =>
            item.isMore ? (
              <button key="more" onClick={() => setMoreOpen(o => !o)}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${moreOpen ? 'text-orange' : 'text-muted'}`}>
                {item.icon}
                <span className="text-[10px] font-sans">{item.label}</span>
              </button>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${isActive ? 'text-orange' : 'text-muted'}`
                }>
                {item.icon}
                <span className="text-[10px] font-sans">{item.label}</span>
              </NavLink>
            )
          )}
        </div>
      </nav>
    </>
  )
}
