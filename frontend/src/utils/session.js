export function initSession() {
  if (!localStorage.getItem('atlas_session_id')) {
    localStorage.setItem('atlas_session_id', crypto.randomUUID())
  }
}

export function getSessionId() {
  return localStorage.getItem('atlas_session_id')
}

export function clearSession() {
  localStorage.removeItem('atlas_session_id')
  localStorage.removeItem('atlas_token')
  localStorage.removeItem('atlas_uid')
  localStorage.removeItem('atlas_profile')
}