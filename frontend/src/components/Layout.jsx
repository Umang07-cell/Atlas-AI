import { useState, useEffect } from 'react'
import { getProfile, logoutApi, trackEvent } from '../api'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Briefcase, FileText, MessageSquare,
  Bot, Mic, ChevronRight, LogOut, Bug, Edit3, Menu, X,
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

/* ── Sidebar ── extracted as a top-level component so React never
   re-creates it on every Layout render (which would freeze AnimatePresence) */
function SidebarContent({ user, logout, setShowBugReport }) {
  const navigate = useNavigate()
  return (
    <>
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div style={{ position: 'relative', flexShrink: 0, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="14" fill="#8b5cf6" fillOpacity="0.15" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.4" />
              <circle cx="16" cy="16" r="8" stroke="#6366f1" strokeWidth="1.5" />
              <ellipse cx="16" cy="16" rx="8" ry="3" transform="rotate(45 16 16)" stroke="#7c3aed" strokeWidth="1.5" />
              <ellipse cx="16" cy="16" rx="8" ry="3" transform="rotate(-45 16 16)" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="16" cy="16" r="2.5" fill="#8b5cf6" />
            </svg>
            <div style={{
              position: 'absolute', inset: -6,
              background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 65%)',
              animation: 'none',
              zIndex: -1, borderRadius: '50%'
            }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: 'white', lineHeight: 1, margin: 0 }}>Atlas</h1>
            <p className="mono-label" style={{ marginTop: 3, color: 'rgba(120,190,255,0.4)', letterSpacing: '0.18em' }}>AI Career OS</p>
          </div>
        </div>
      </div>

      <div className="divider-glow mx-5 mb-3" />

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

      <div className="px-3 pb-2">
        <button
          onClick={() => { setShowBugReport(true); trackEvent('bug_report_opened') }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-400 transition-all"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Bug size={12} className="text-slate-700" />
          Report a Bug
        </button>
      </div>

      <div className="px-3 pb-4">
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-400 transition-all"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <Edit3 size={12} className="text-slate-700" />
          Edit Profile
        </button>
      </div>

      <div className="mx-3 mb-4 p-3 rounded-xl flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {(user?.name || 'U')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-300 truncate">{user?.name || 'User'}</p>
          <p className="mono-label truncate mt-0.5" style={{ color: 'rgba(120,190,255,0.4)' }}>{user?.domain || 'Career OS'}</p>
        </div>
        <button onClick={logout} title="Sign Out" className="text-slate-600 hover:text-red-400 transition-colors">
          <LogOut size={12} />
        </button>
      </div>
    </>
  )
}

/* ── Main Layout ── */
export default function Layout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('atlas_profile') || '{}'))
  const [showBugReport, setShowBugReport] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    const uid = localStorage.getItem('atlas_uid')
    if (!uid) return
    getProfile(parseInt(uid)).then(({ data }) => {
      const updated = { name: data.name, domain: data.domain, experience_level: data.experience_level }
      setUser(updated)
      localStorage.setItem('atlas_profile', JSON.stringify(updated))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('atlas_profile') || '{}'))
    }
    window.addEventListener('atlas_profile_updated', handleProfileUpdate)
    return () => window.removeEventListener('atlas_profile_updated', handleProfileUpdate)
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

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col relative"
        style={{ background: 'rgba(4,4,10,0.88)', backdropFilter: 'blur(22px)', borderRight: '1px solid rgba(255,255,255,0.06)', zIndex: 20 }}>
        <SidebarContent user={user} logout={logout} setShowBugReport={setShowBugReport} />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 safe-top"
        style={{ background: 'rgba(4,4,10,0.98)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#8b5cf6" fillOpacity="0.15" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="16" cy="16" r="8" stroke="#6366f1" strokeWidth="1.5" />
            <ellipse cx="16" cy="16" rx="8" ry="3" transform="rotate(45 16 16)" stroke="#7c3aed" strokeWidth="1.5" />
            <ellipse cx="16" cy="16" rx="8" ry="3" transform="rotate(-45 16 16)" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="2.5" fill="#8b5cf6" />
          </svg>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: 'white', margin: 0, marginTop: 2 }}>Atlas</h1>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white transition-colors p-1">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-60 flex flex-col z-50"
              style={{ background: 'rgba(4,4,10,0.99)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <SidebarContent user={user} logout={logout} setShowBugReport={setShowBugReport} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative md:pt-0 pt-14" style={{ zIndex: 10 }}>
        <PageTransition>
          <Outlet />
        </PageTransition>
        {!['/chat', '/interview', '/voice'].includes(location.pathname) && <VoiceButton />}
      </main>

      <AnimatePresence>
        {showBugReport && <BugReportModal onClose={() => setShowBugReport(false)} />}
      </AnimatePresence>
    </div>
  )
}