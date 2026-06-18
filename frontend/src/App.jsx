import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import JobFeed from './pages/JobFeed'
import ResumeStudio from './pages/ResumeStudio'
import InterviewPrep from './pages/InterviewPrep'
import ChatPage from './pages/ChatPage'
import VoiceMode from './pages/VoiceMode'
import Layout from './components/Layout'

function RequireProfile({ children }) {
  const uid = localStorage.getItem('atlas_uid')
  return uid ? children : <Navigate to="/setup" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="/" element={<RequireProfile><Layout /></RequireProfile>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs"      element={<JobFeed />} />
          <Route path="resume"    element={<ResumeStudio />} />
          <Route path="interview" element={<InterviewPrep />} />
          <Route path="chat"      element={<ChatPage />} />
          <Route path="voice"     element={<VoiceMode />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
