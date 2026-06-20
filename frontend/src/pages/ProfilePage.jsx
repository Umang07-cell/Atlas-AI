import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, MapPin, Briefcase, Zap, Save, X,
  Check, ChevronRight, AlertCircle, Eye, EyeOff,
  KeyRound, Upload, Trash2, Shield, Edit3,
} from 'lucide-react'
import {
  getProfile, updateProfile, uploadResume,
  changePassword, getUid,
} from '../api'

/* ── Constants ──────────────────────────────────────────────────────── */
const DOMAINS = [
  'Data Analytics', 'Data Science', 'AI/ML Engineering',
  'Software Development', 'Business Analysis', 'Product Management',
  'Finance', 'Marketing', 'Other',
]
const LEVELS = [
  { value: 'fresher',     label: 'Fresher',     desc: '0–1 yr',  emoji: '🌱' },
  { value: 'junior',      label: 'Junior',      desc: '1–3 yrs', emoji: '🚀' },
  { value: 'experienced', label: 'Experienced', desc: '3+ yrs',  emoji: '⚡' },
]

/* ── Reusable field wrapper ─────────────────────────────────────────── */
function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(120,190,255,0.5)' }}>{label}</label>
        {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/* ── Toast ──────────────────────────────────────────────────────────── */
function Toast({ msg, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  const colors = {
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#34d399' },
    error:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  text: '#f87171' },
  }
  const c = colors[type]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 18px', borderRadius: 12,
        background: c.bg, border: `1px solid ${c.border}`,
        backdropFilter: 'blur(18px)',
      }}
    >
      {type === 'success'
        ? <Check size={14} style={{ color: c.text }} />
        : <AlertCircle size={14} style={{ color: c.text }} />}
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: c.text }}>{msg}</span>
    </motion.div>
  )
}

/* ── Section card ───────────────────────────────────────────────────── */
function Section({ title, icon: Icon, children, accent = '#6366f1' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 16, padding: '22px 24px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${accent}18`, border: `1px solid ${accent}28`,
        }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </motion.div>
  )
}

/* ── Skill chip ─────────────────────────────────────────────────────── */
function SkillChip({ skill, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20,
      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
      background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
      color: '#a5b4fc',
    }}>
      {skill}
      <button
        type="button"
        onClick={() => onRemove(skill)}
        style={{ display: 'flex', alignItems: 'center', padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(165,180,252,0.5)', lineHeight: 1 }}
      >
        <X size={10} />
      </button>
    </span>
  )
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const navigate = useNavigate()
  const uid = getUid()

  /* profile state */
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  /* edit state */
  const [form, setForm] = useState({ name: '', location: '', domain: '', experience_level: 'fresher' })
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [profileDirty, setProfileDirty] = useState(false)

  /* password change */
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [showPw, setShowPw] = useState({ cur: false, new: false, con: false })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')

  /* resume */
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [hasResume, setHasResume] = useState(false)
  const fileRef = useRef()

  /* toast */
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type, key: Date.now() })

  /* ── Load profile ─────────────────────────────────────────────────── */
  useEffect(() => {
    getProfile(uid).then(({ data }) => {
      setProfile(data)
      setForm({
        name: data.name || '',
        location: data.location || '',
        domain: data.domain || 'Data Analytics',
        experience_level: data.experience_level || 'fresher',
      })
      setSkills(data.skills || [])
      setHasResume(data.has_resume || false)
    }).catch(() => {
      showToast('Failed to load profile', 'error')
    }).finally(() => setLoading(false))
  }, [uid])

  /* track dirty state */
  useEffect(() => {
    if (!profile) return
    const changed =
      form.name !== profile.name ||
      form.location !== (profile.location || '') ||
      form.domain !== profile.domain ||
      form.experience_level !== profile.experience_level ||
      JSON.stringify(skills) !== JSON.stringify(profile.skills || [])
    setProfileDirty(changed)
  }, [form, skills, profile])

  /* ── Skill helpers ────────────────────────────────────────────────── */
  const addSkill = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault()
      const s = skillInput.trim().replace(/,$/, '')
      if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
      setSkillInput('')
    }
  }
  const addSkillOnBlur = () => {
    const s = skillInput.trim().replace(/,$/, '')
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s])
    setSkillInput('')
  }
  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s))

  /* ── Save profile ─────────────────────────────────────────────────── */
  const saveProfile = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { showToast('Name cannot be empty', 'error'); return }
    setSaving(true)
    try {
      await updateProfile(uid, { ...form, skills })
      setProfile(prev => ({ ...prev, ...form, skills }))
      // sync localStorage so Layout picks it up
      localStorage.setItem('atlas_profile', JSON.stringify({ name: form.name, domain: form.domain, experience_level: form.experience_level }))
      window.dispatchEvent(new Event('atlas_profile_updated'))
      setProfileDirty(false)
      showToast('Profile updated')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Change password ──────────────────────────────────────────────── */
  const savePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.new_password !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    if (pwForm.new_password.length < 8) { setPwError('Minimum 8 characters'); return }
    setPwSaving(true)
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      setPwForm({ current_password: '', new_password: '', confirm: '' })
      showToast('Password changed')
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  /* ── Upload resume ────────────────────────────────────────────────── */
  const handleResumeUpload = async () => {
    if (!resumeFile) return
    setResumeUploading(true)
    try {
      const { data } = await uploadResume(uid, resumeFile)
      setHasResume(true)
      setResumeFile(null)
      showToast(`Resume uploaded · ${data.parsed_skills?.length || 0} skills parsed`)
    } catch (err) {
      showToast(err.response?.data?.detail || 'Upload failed', 'error')
    } finally {
      setResumeUploading(false)
    }
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)' }}>
          LOADING PROFILE…
        </div>
      </div>
    )
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)', fontSize: 13, color: 'white',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    outline: 'none', transition: 'border-color 0.2s',
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.25)',
          }}>
            <Edit3 size={15} style={{ color: '#818cf8' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 700, color: 'white', margin: 0, lineHeight: 1 }}>Edit Profile</h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(120,190,255,0.4)', margin: '4px 0 0', textTransform: 'uppercase' }}>
              {profile?.email}
            </p>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Personal Info ────────────────────────────────────────── */}
        <Section title="Personal Information" icon={User} accent="#6366f1">
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Full Name" hint="Required">
                <input
                  className="input"
                  style={inputStyle}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </Field>
              <Field label="Location" hint="Optional">
                <div style={{ position: 'relative' }}>
                  <MapPin size={12} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                  <input
                    className="input"
                    style={{ ...inputStyle, paddingLeft: 30 }}
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Pune, India"
                  />
                </div>
              </Field>
            </div>

            <Field label="Target Domain">
              <select
                className="input"
                style={{ ...inputStyle, background: 'rgba(255,255,255,0.04)', color: 'white', colorScheme: 'dark' }}
                value={form.domain}
                onChange={e => setForm({ ...form, domain: e.target.value })}
              >
                {DOMAINS.map(d => <option key={d} value={d} style={{ background: '#0f0f17', color: 'white' }}>{d}</option>)}
              </select>
            </Field>

            <Field label="Experience Level">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {LEVELS.map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setForm({ ...form, experience_level: l.value })}
                    style={{
                      padding: '10px 6px', borderRadius: 10, textAlign: 'center',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      background: form.experience_level === l.value ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.02)',
                      boxShadow: form.experience_level === l.value ? 'inset 0 0 0 1px rgba(99,102,241,0.32)' : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                      color: form.experience_level === l.value ? 'white' : 'rgba(255,255,255,0.38)',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{l.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{l.label}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, marginTop: 2, color: form.experience_level === l.value ? 'rgba(165,180,252,0.7)' : 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>{l.desc}</div>
                  </button>
                ))}
              </div>
            </Field>

            {/* Skills */}
            <Field label="Skills" hint="Enter key, comma, or blur to add">
              <div style={{
                minHeight: 44, padding: '8px 10px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
              }}>
                {skills.map(s => <SkillChip key={s} skill={s} onRemove={removeSkill} />)}
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={addSkill}
                  onBlur={addSkillOnBlur}
                  placeholder={skills.length === 0 ? 'Python, SQL, Tableau…' : ''}
                  style={{
                    border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: 'var(--font-sans)', fontSize: 12, color: 'white',
                    minWidth: 120, flex: 1,
                  }}
                />
              </div>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <button
                type="submit"
                disabled={saving || !profileDirty}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 20px', borderRadius: 10, border: 'none', cursor: profileDirty ? 'pointer' : 'default',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                  background: profileDirty ? 'rgba(99,102,241,0.85)' : 'rgba(255,255,255,0.05)',
                  color: profileDirty ? 'white' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.2s',
                  boxShadow: profileDirty ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {saving ? 'Saving…' : <><Save size={13} /> Save Changes</>}
              </button>
            </div>
          </form>
        </Section>

        {/* ── Resume ──────────────────────────────────────────────── */}
        <Section title="Resume" icon={Upload} accent="#0ea5e9">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {hasResume && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)',
              }}>
                <Check size={14} style={{ color: '#34d399' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#6ee7b7' }}>Active resume on file</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(52,211,153,0.4)', marginLeft: 'auto' }}>ACTIVE</span>
              </div>
            )}

            <div
              style={{
                border: `2px dashed ${resumeFile ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12, padding: '24px 18px', textAlign: 'center', cursor: 'pointer',
                background: resumeFile ? 'rgba(99,102,241,0.05)' : 'transparent', transition: 'all 0.2s',
              }}
              onClick={() => fileRef.current?.click()}
            >
              {resumeFile ? (
                <>
                  <Check size={22} style={{ color: '#34d399', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#34d399', margin: '0 0 3px', fontFamily: 'var(--font-sans)' }}>{resumeFile.name}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(52,211,153,0.5)', margin: 0 }}>{(resumeFile.size / 1024).toFixed(1)} KB · Click to change</p>
                </>
              ) : (
                <>
                  <Upload size={22} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 3px', fontFamily: 'var(--font-sans)' }}>
                    {hasResume ? 'Upload a new resume to replace the current one' : 'Click to upload your resume (PDF)'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.18)', margin: 0 }}>PDF · Max 10MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0] || null)} />
            </div>

            {resumeFile && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setResumeFile(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-sans)', fontSize: 12, cursor: 'pointer' }}
                >
                  <Trash2 size={12} /> Clear
                </button>
                <button
                  type="button"
                  onClick={handleResumeUpload}
                  disabled={resumeUploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, border: 'none', background: 'rgba(14,165,233,0.75)', color: 'white', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(14,165,233,0.25)' }}
                >
                  {resumeUploading ? 'Uploading…' : <><Upload size={12} /> Upload Resume</>}
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* ── Change Password ──────────────────────────────────────── */}
        <Section title="Change Password" icon={Shield} accent="#f59e0b">
          <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'current_password', label: 'Current Password', showKey: 'cur' },
              { key: 'new_password',     label: 'New Password',     showKey: 'new' },
              { key: 'confirm',          label: 'Confirm New Password', showKey: 'con' },
            ].map(({ key, label, showKey }) => (
              <Field key={key} label={label}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw[showKey] ? 'text' : 'password'}
                    className="input"
                    style={{ ...inputStyle, paddingRight: 38 }}
                    value={pwForm[key]}
                    onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                    placeholder="••••••••"
                    autoComplete={key === 'current_password' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(prev => ({ ...prev, [showKey]: !prev[showKey] }))}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    {showPw[showKey] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </Field>
            ))}

            {pwError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <AlertCircle size={12} style={{ color: '#f87171' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#f87171' }}>{pwError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={pwSaving || !pwForm.current_password || !pwForm.new_password || !pwForm.confirm}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 20px', borderRadius: 10, border: 'none',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                  background: (pwForm.current_password && pwForm.new_password && pwForm.confirm)
                    ? 'rgba(245,158,11,0.8)' : 'rgba(255,255,255,0.05)',
                  color: (pwForm.current_password && pwForm.new_password && pwForm.confirm) ? 'white' : 'rgba(255,255,255,0.2)',
                  cursor: (pwForm.current_password && pwForm.new_password && pwForm.confirm) ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  boxShadow: (pwForm.current_password && pwForm.new_password && pwForm.confirm)
                    ? '0 4px 16px rgba(245,158,11,0.25)' : 'none',
                }}
              >
                {pwSaving ? 'Updating…' : <><KeyRound size={13} /> Update Password</>}
              </button>
            </div>
          </form>
        </Section>

      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}