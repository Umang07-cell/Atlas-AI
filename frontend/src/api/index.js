/**
 * api/index.js — Single axios instance with auth interceptor.
 */

import axios from 'axios'

const BASE = 'https://atlas-backend-vak7.onrender.com/api/v1'
const api = axios.create({ baseURL: BASE })

// Auth interceptor — attach token + API key on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlas_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-API-Key'] = import.meta.env.VITE_API_KEY
  return config
})

// 401 handler — clear storage and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('atlas_token')
      localStorage.removeItem('atlas_uid')
      localStorage.removeItem('atlas_profile')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const getUid = () => {
  const raw = localStorage.getItem('atlas_uid')
  const parsed = parseInt(raw, 10)
  if (!raw || isNaN(parsed) || parsed <= 0) {
    throw new Error('User session not found. Please log in first.')
  }
  return parsed
}

// ── Auth ──────────────────────────────────────────────────────────────
export const signup               = (data)        => api.post('/auth/signup', data)
export const login                = (data)        => api.post('/auth/login', data)
export const logoutApi            = ()            => api.post('/auth/logout')
export const getMe                = ()            => api.get('/auth/me')
export const requestPasswordReset = (email)       => api.post('/auth/password-reset/request', { email })
export const confirmPasswordReset = (token, new_password) =>
  api.post('/auth/password-reset/confirm', { token, new_password })
export const changePassword       = (data)        => api.post('/auth/change-password', data)

// ── Profile ───────────────────────────────────────────────────────────
export const createProfile  = (data)        => api.post('/profile/create', data)
export const getProfile     = (userId)      => api.get(`/profile/${userId}`)
export const updateProfile  = (userId, data)=> api.put(`/profile/${userId}`, data)
export const uploadResume   = (userId, file)=> {
  const fd = new FormData(); fd.append('file', file)
  return api.post(`/profile/${userId}/resume`, fd)
}

// ── Jobs ──────────────────────────────────────────────────────────────
export const getJobFeed    = (params = {}) => api.get('/jobs/feed',    { params: { user_id: getUid(), ...params } })
export const getJobMatches = ()            => api.get('/jobs/matches', { params: { user_id: getUid() } })
export const getTop3Jobs   = ()            => api.get('/jobs/top3',    { params: { user_id: getUid() } })
export const scrapeJobs    = ()            => api.post('/jobs/scrape', null, { params: { user_id: getUid() } })

// ── Resume ────────────────────────────────────────────────────────────
export const tailorResume  = (jd_text) => api.post('/resume/tailor', { user_id: getUid(), jd_text })

// ── Interview ─────────────────────────────────────────────────────────
export const startInterview        = (data)               => api.post('/interview/start', data)
export const sendInterviewMessage  = (data)               => api.post('/interview/message', data)
export const endInterview          = (data)               => api.post('/interview/end', data)
export const getInterviewSession   = (sid, uid)           => api.get(`/interview/session/${sid}`, { params: { user_id: uid } })
export const listInterviewSessions = (uid)                => api.get('/interview/sessions', { params: { user_id: uid } })

// ── Chat ──────────────────────────────────────────────────────────────
export const sendChatMessage  = (uid, message) => api.post('/chat/send',    { user_id: uid, message })
export const getChatHistory   = (uid)          => api.get('/chat/history',  { params: { user_id: uid } })
export const clearChatHistory = (uid)          => api.delete('/chat/history', { params: { user_id: uid } })

// ── Voice ─────────────────────────────────────────────────────────────
export const transcribeAudio = (blob, uid) => {
  const fd = new FormData(); fd.append('audio', blob, 'recording.webm')
  return api.post('/voice/transcribe', fd, { params: { user_id: uid } })
}
export const transcribeInterviewAudio = (blob, uid) => {
  const fd = new FormData(); fd.append('audio', blob, 'recording.webm')
  return api.post('/voice/transcribe/interview', fd, { params: { user_id: uid } })
}
export const speakText = (text) => api.post('/voice/speak', { text }, { responseType: 'blob' })

// ── Analytics (fire-and-forget) ───────────────────────────────────────
export const trackEvent = (eventType, eventData = {}, page = null) => {
  const uid = parseInt(localStorage.getItem('atlas_uid'), 10) || null
  return api.post('/analytics/track', {
    user_id: uid,
    event_type: eventType,
    event_data: eventData,
    page: page || window.location.pathname,
    session_id: localStorage.getItem('atlas_session_id'),
  }).catch(() => {})
}

export const submitBugReport = (data) => {
  const uid = parseInt(localStorage.getItem('atlas_uid'), 10) || null
  return api.post('/analytics/bug-report', {
    ...data,
    user_id: uid,
    page: data.page || window.location.pathname,
  })
}

export default api
