import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import JobFeed from './pages/JobFeed'
import ResumeStudio from './pages/ResumeStudio'
import InterviewPrep from './pages/InterviewPrep'
import ChatPage from './pages/ChatPage'
import VoiceMode from './pages/VoiceMode'
import Layout from './components/Layout'
import { trackEvent } from './api'
import { initSession } from './utils/session'

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
        {/* Public auth routes */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/signup"          element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Legacy setup route (kept for backward compat) */}
        <Route path="/setup" element={<Setup />} />

        {/* Protected app */}
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index                 element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"      element={<Dashboard />} />
          <Route path="jobs"           element={<JobFeed />} />
          <Route path="resume"         element={<ResumeStudio />} />
          <Route path="interview"      element={<InterviewPrep />} />
          <Route path="chat"           element={<ChatPage />} />
          <Route path="voice"          element={<VoiceMode />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
