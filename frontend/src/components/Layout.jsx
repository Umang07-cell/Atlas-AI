import { useState, useEffect } from 'react'
import { getProfile, logoutApi, trackEvent } from '../api'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, FileText, MessageSquare,
  Bot, Mic, ChevronRight, LogOut, Bug,
} from 'lucide-react'
import VoiceButton from './VoiceButton'
import OrbBackground from './OrbBackground'
import PageTransition from './PageTransition'
import BugReportModal from './BugReportModal'
import { clearSession } from '../utils/session'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',     mono: 'HOME' },
  { to: '/jobs',      icon: Briefcase,       label: 'Job Feed',       mono: 'JOBS' },
  { to: '/resume',    icon: FileText,        label: 'Resume Studio',  mono: 'RESUME' },
  { to: '/interview', icon: MessageSquare,   label: 'Mock Interview', mono: 'INTV' },
  { to: '/chat',      icon: Bot,             label: 'ATLAS Chat',     mono: 'CHAT' },
]

export default function Layout() {
  const navigate  = useNavigate()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('atlas_profile') || '{}'))
  const [showBugReport, setShowBugReport] = useState(false)
  const initial = (user.name || 'U')[0].toUpperCase()

  useEffect(() => {
    const uid = localStorage.getItem('atlas_uid')
    if (!uid) return
    getProfile(parseInt(uid)).then(({ data }) => {
      const updated = { name: data.name, domain: data.domain, experience_level: data.experience_level }
      setUser(updated)
      localStorage.setItem('atlas_profile', JSON.stringify(updated))
    }).catch(() => {})
  }, [])

  const logout = async () => {
    trackEvent('logout')
    try { await logoutApi() } catch (_) {}
    clearSession()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <OrbBackground />

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col relative"
        style={{ background: 'rgba(4,4,10,0.88)', backdropFilter: 'blur(22px)', borderRight: '1px solid rgba(255,255,255,0.06)', zIndex: 20 }}>

        {/* ── Premium Logo ─────────────────────────────────────── */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {/* Diamond icon with glow */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 38, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(140,210,255,0.25)',
                transform: 'rotate(45deg)',
                background: 'rgba(100,180,255,0.06)',
                boxShadow: '0 0 20px rgba(100,190,255,0.14), inset 0 0 10px rgba(100,190,255,0.04)',
              }}>
                <span style={{
                  transform: 'rotate(-45deg)',
                  fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 16, lineHeight: 1,
                  background: 'linear-gradient(135deg, #c8eeff, #a0c4ff)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>A</span>
              </div>
              {/* Glow pulse */}
              <div style={{
                position: 'absolute', inset: -4,
                border: '1px solid rgba(120,190,255,0.1)',
                transform: 'rotate(45deg)',
                borderRadius: 2,
                animation: 'ambientPulse 4s ease-in-out infinite',
              }} />
            </div>

            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: 'white', lineHeight: 1, margin: 0 }}>Atlas</h1>
              <p className="mono-label" style={{ marginTop: 3, color: 'rgba(120,190,255,0.4)', letterSpacing: '0.18em' }}>AI Career OS</p>
            </div>
          </div>
        </div>

        <div className="divider-glow mx-5 mb-3" />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1">
          {NAV.map(({ to, icon: Icon, label, mono }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-200'}`}
              style={({ isActive }) => isActive
                ? { background: 'rgba(99,102,241,0.12)', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)' }
                : {}}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId="sidebar-pill"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: 'linear-gradient(180deg, #7eb8ff, #6366f1)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }} />
                  )}
                  <Icon size={15} className={`shrink-0 transition-colors ${isActive ? 'text-blue-300' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  <span className="flex-1 font-medium">{label}</span>
                  <span className="mono-label opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: 8 }}>{mono}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Voice mode */}
        <div className="px-3 py-3">
          <NavLink to="/voice"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive ? 'text-emerald-300' : 'text-slate-600 hover:text-slate-300'}`}
            style={({ isActive }) => isActive
              ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }
              : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Mic size={13} className="text-emerald-500" />
            Voice Mode
            <ChevronRight size={11} className="ml-auto opacity-40" />
          </NavLink>
        </div>

        {/* Bug report */}
        <div className="px-3 pb-2">
          <button onClick={() => { setShowBugReport(true); trackEvent('bug_report_opened') }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-400 transition-all"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <Bug size={12} className="text-slate-700" />
            Report a Bug
          </button>
        </div>

        {/* User chip */}
        <div className="mx-3 mb-4 p-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-300 truncate">{user.name || 'User'}</p>
            <p className="mono-label truncate mt-0.5" style={{ color: 'rgba(120,190,255,0.4)' }}>{user.domain || 'Career OS'}</p>
          </div>
          <button onClick={logout} title="Sign Out"
            className="text-slate-600 hover:text-red-400 transition-colors">
            <LogOut size={12} />
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative" style={{ zIndex: 10 }}>
        <PageTransition>
          <Outlet />
        </PageTransition>
        <VoiceButton />
      </main>

      <AnimatePresence>
        {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}
      </AnimatePresence>
    </div>
  )
}
