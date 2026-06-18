/**
 * api/index.js — Single axios instance with auth interceptor.
 * client.js is now redundant — all calls go through this file.
 *
 * uid() throws a clear error if atlas_uid is missing or invalid,
 * so API calls fail immediately with a readable message instead of
 * sending NaN/null to the backend.
 */

import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || '/api/v1'

console.log('API KEY LOADED:', import.meta.env.VITE_API_KEY)
console.log('API URL LOADED:', BASE)

const api = axios.create({ baseURL: BASE })

// Auth interceptor — attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlas_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-API-Key'] = import.meta.env.VITE_API_KEY
  return config
})

// 401 handler — clear storage and redirect to setup
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('atlas_token')
      localStorage.removeItem('atlas_uid')
      window.location.href = '/setup'
    }
    return Promise.reject(err)
  }
)

/**
 * Returns a validated integer user ID from localStorage.
 * Throws a readable error if missing or corrupt — prevents NaN reaching backend.
 */
export const getUid = () => {
  const raw = localStorage.getItem('atlas_uid')
  const parsed = parseInt(raw, 10)
  if (!raw || isNaN(parsed) || parsed <= 0) {
    throw new Error('User session not found. Please complete setup first.')
  }
  return parsed
}

// Profile
export const createProfile  = (data)           => api.post('/profile/create', data)
export const getProfile     = (userId)          => api.get(`/profile/${userId}`)
export const updateProfile  = (userId, data)    => api.put(`/profile/${userId}`, data)
export const uploadResume   = (userId, file)    => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`/profile/${userId}/resume`, fd)
}

// Jobs
export const getJobFeed     = (params = {})     => api.get('/jobs/feed',    { params: { user_id: getUid(), ...params } })
export const getJobMatches  = ()                => api.get('/jobs/matches', { params: { user_id: getUid() } })
export const getTop3Jobs    = ()                => api.get('/jobs/top3',    { params: { user_id: getUid() } })
export const scrapeJobs     = ()                => api.post('/jobs/scrape', null, { params: { user_id: getUid() } })

// Resume
export const tailorResume   = (jd_text)         => api.post('/resume/tailor', { user_id: getUid(), jd_text })

// Interview
export const startInterview         = (data)                  => api.post('/interview/start', data)
export const sendInterviewMessage   = (data)                  => api.post('/interview/message', data)
export const endInterview           = (data)                  => api.post('/interview/end', data)
export const getInterviewSession    = (sessionId, userId)     => api.get(`/interview/session/${sessionId}`, { params: { user_id: userId } })
export const listInterviewSessions  = (userId)                => api.get('/interview/sessions', { params: { user_id: userId } })

// Chat
export const sendChatMessage  = (userId, message) => api.post('/chat/send',    { user_id: userId, message })
export const getChatHistory   = (userId)           => api.get('/chat/history',  { params: { user_id: userId } })
export const clearChatHistory = (userId)           => api.delete('/chat/history', { params: { user_id: userId } })

// Voice
export const transcribeAudio = (audioBlob, userId) => {
  const fd = new FormData()
  fd.append('audio', audioBlob, 'recording.webm')
  return api.post('/voice/transcribe', fd, { params: { user_id: userId } })
}
export const transcribeInterviewAudio = (audioBlob, userId) => {
  const fd = new FormData()
  fd.append('audio', audioBlob, 'recording.webm')
  return api.post('/voice/transcribe/interview', fd, { params: { user_id: userId } })
}
export const speakText = (text) => api.post('/voice/speak', { text }, { responseType: 'blob' })

export default api