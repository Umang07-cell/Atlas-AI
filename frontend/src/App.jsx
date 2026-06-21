import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { trackEvent } from './api'
import { initSession } from './utils/session'
import Layout from './components/Layout'

// Eager — needed immediately on first paint
import Landing from './pages/Landing'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Setup from './pages/Setup'

// Lazy — only loaded when user navigates to that page
const Dashboard    = lazy(() => import('./pages/Dashboard'))
const JobFeed      = lazy(() => import('./pages/JobFeed'))
const ResumeStudio = lazy(() => import('./pages/ResumeStudio'))
const InterviewPrep = lazy(() => import('./pages/InterviewPrep'))
const ChatPage     = lazy(() => import('./pages/ChatPage'))
const VoiceMode    = lazy(() => import('./pages/VoiceMode'))
const ProfilePage  = lazy(() => import('./pages/ProfilePage'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1 }}>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

/** Require a valid JWT token in localStorage */
function RequireAuth({ children }) {
  const token = localStorage.getItem('atlas_token')
  const uid   = localStorage.getItem('atlas_uid')
  return (token && uid) ? children : <Navigate to="/login" replace />
}

/** Track page views on route change */
function PageTracker() {
  const location = useLocation()
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname })
  }, [location.pathname])
  return null
}

export default function App() {
  useEffect(() => { initSession() }, [])

  return (
    <BrowserRouter>
      <PageTracker />
      <Routes>
        {/* Landing — smart redirect (inside Landing itself) */}
        <Route path="/"               element={<Landing />} />

        {/* Public auth routes */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/signup"          element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Legacy setup route (kept for backward compat) */}
        <Route path="/setup" element={<Setup />} />

        {/* Protected app */}
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="dashboard"  element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
          <Route path="jobs"       element={<Suspense fallback={<PageLoader />}><JobFeed /></Suspense>} />
          <Route path="resume"     element={<Suspense fallback={<PageLoader />}><ResumeStudio /></Suspense>} />
          <Route path="interview"  element={<Suspense fallback={<PageLoader />}><InterviewPrep /></Suspense>} />
          <Route path="chat"       element={<Suspense fallback={<PageLoader />}><ChatPage /></Suspense>} />
          <Route path="voice"      element={<Suspense fallback={<PageLoader />}><VoiceMode /></Suspense>} />
          <Route path="profile"    element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
        </Route>

        {/* Unknown routes → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}