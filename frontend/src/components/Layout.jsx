import { useState, useEffect } from 'react'
import { getProfile } from '../api'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, FileText, MessageSquare,
  Bot, Mic, Settings, Sparkles, ChevronRight,
} from 'lucide-react'
import VoiceButton from './VoiceButton'
import OrbBackground from './OrbBackground'
import PageTransition from './PageTransition'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',      mono: 'HOME' },
  { to: '/jobs',      icon: Briefcase,       label: 'Job Feed',        mono: 'JOBS' },
  { to: '/resume',    icon: FileText,        label: 'Resume Studio',   mono: 'RESUME' },
  { to: '/interview', icon: MessageSquare,   label: 'Mock Interview',  mono: 'INTV' },
  { to: '/chat',      icon: Bot,             label: 'ATLAS Chat',      mono: 'CHAT' },
]

export default function Layout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('atlas_profile') || '{}'))
  const initial   = (user.name || 'U')[0].toUpperCase()
  
useEffect(() => {
  const uid = localStorage.getItem('atlas_uid')
  if (!uid) return
  getProfile(parseInt(uid)).then(({ data }) => {
    const updated = { name: data.name, domain: data.domain, experience_level: data.experience_level }
    setUser(updated)
    localStorage.setItem('atlas_profile', JSON.stringify(updated))
  }).catch(() => {})
}, [])

  const logout = () => {
    localStorage.removeItem('atlas_uid')
    localStorage.removeItem('atlas_profile')
    navigate('/setup')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Ambient background — behind everything */}
      <OrbBackground />

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="w-60 shrink-0 flex flex-col relative"
        style={{
          background: 'rgba(5,5,10,0.85)',
          backdropFilter: 'blur(18px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          zIndex: 20,
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {/* V1-style diamond logo */}
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{
                border: '1px solid rgba(255,255,255,0.18)',
                transform: 'rotate(45deg)',
                background: 'rgba(255,255,255,0.04)',
                flexShrink: 0,
              }}
            >
              <span
                className="text-xs font-bold text-white"
                style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
              >A</span>
            </div>
            <div>
              <h1
                className="text-base text-white leading-tight"
                style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}
              >Atlas</h1>
              <p className="mono-label mt-0.5">AI Career OS</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-glow mx-5 mb-3" />

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1">
          {NAV.map(({ to, icon: Icon, label, mono }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-200'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: 'rgba(99,102,241,0.13)',
                      boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.22)',
                    }
                  : {}
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active accent line */}
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: 'linear-gradient(180deg, #6366f1, #8b5cf6)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    />
                  )}
                  <Icon
                    size={15}
                    className={`shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}
                  />
                  <span className="flex-1 font-medium">{label}</span>
                  <span
                    className="mono-label opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ fontSize: 8 }}
                  >
                    {mono}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Voice mode shortcut */}
        <div className="px-3 py-3">
          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive ? 'text-emerald-300' : 'text-slate-600 hover:text-slate-300'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }
                : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }
            }
          >
            <Mic size={13} className="text-emerald-500" />
            Voice Mode
            <ChevronRight size={11} className="ml-auto opacity-40" />
          </NavLink>
        </div>

        {/* User profile chip */}
        <div
          className="mx-3 mb-4 p-3 rounded-xl flex items-center gap-3"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{user.name || 'User'}</p>
            <p className="mono-label truncate mt-0.5">{user.domain || 'Data Analytics'}</p>
          </div>
          <button
            onClick={logout}
            title="Change Profile"
            className="text-slate-600 hover:text-slate-400 transition-colors"
          >
            <Settings size={12} />
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto relative"
        style={{ zIndex: 10 }}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
        <VoiceButton />
      </main>
    </div>
  )
}
