import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, FileText, Check, ChevronRight } from 'lucide-react'
import { signup, uploadResume } from '../api'
import { trackEvent } from '../api'
import { initSession } from '../utils/session'
import VortexCanvas from '../components/VortexCanvas'

const DOMAINS = ['Data Analytics','Data Science','AI/ML Engineering','Software Development','Business Analysis','Product Management','Finance','Marketing','Other']
const LEVELS  = [
  { value: 'fresher',     label: 'Fresher',     desc: '0–1 yr',  emoji: '🌱' },
  { value: 'junior',      label: 'Junior',      desc: '1–3 yrs', emoji: '🚀' },
  { value: 'experienced', label: 'Experienced', desc: '3+ yrs',  emoji: '⚡' },
]
const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a number',     test: (p) => /\d/.test(p) },
  { label: 'Contains a letter',     test: (p) => /[a-zA-Z]/.test(p) },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [userId, setUserId] = useState(null)
  const [file, setFile] = useState(null)
  const [parsedSkills, setParsedSkills] = useState([])

  const [creds, setCreds] = useState({ email: '', password: '', name: '' })
  const [profile, setProfile] = useState({ domain: 'Software Development', location: '', experience_level: 'fresher', skills: '' })

  const handleCredentials = async (e) => {
    e.preventDefault()
    if (!creds.name.trim() || !creds.email || !creds.password) return
    setError(''); setLoading(true)
    try {
      const { data } = await signup({
        name: creds.name.trim(), email: creds.email, password: creds.password,
        domain: profile.domain, location: profile.location, experience_level: profile.experience_level,
      })
      localStorage.setItem('atlas_token', data.token)
      localStorage.setItem('atlas_uid', data.user_id)
      localStorage.setItem('atlas_profile', JSON.stringify({ name: data.name, domain: data.domain, experience_level: data.experience_level }))
      initSession()
      setUserId(data.user_id)
      setStep(1)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.detail?.[0]?.msg || 'Signup failed'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally { setLoading(false) }
  }

  const handleProfile = (e) => { e.preventDefault(); setStep(2) }

  const handleResume = async (e) => {
    e.preventDefault()
    if (!file) { trackEvent('signup_complete', { skipped_resume: true }); navigate('/dashboard'); return }
    setLoading(true)
    try {
      const { data } = await uploadResume(userId, file)
      setParsedSkills(data.parsed_skills || [])
      trackEvent('signup_complete', { skipped_resume: false })
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally { setLoading(false) }
  }

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(creds.password)).length
  const stepLabels = ['Account', 'Profile', 'Resume']

  return (
    <div style={{ minHeight: '100vh', background: '#000005', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Vortex bg ─────────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <VortexCanvas />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, transparent 25%, rgba(0,0,5,0.72) 50%, rgba(0,0,5,0.97) 72%)',
        }} />
      </div>

      {/* ── Top nav ───────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(140,210,255,0.28)', transform: 'rotate(45deg)', background: 'rgba(100,180,255,0.06)', boxShadow: '0 0 18px rgba(100,190,255,0.15)', flexShrink: 0 }}>
            <span style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg, #c8eeff, #a0c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: 'white', lineHeight: 1 }}>Atlas</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(120,190,255,0.4)', marginTop: 2 }}>AI Career OS</div>
          </div>
        </Link>
        <Link to="/login" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
          Already have an account? <span style={{ color: '#7eb8ff' }}>Sign in</span>
        </Link>
      </div>

      {/* ── Form ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: 'white', margin: '0 0 6px' }}>
              {step === 0 ? 'Create your account' : step === 1 ? 'Your profile' : 'Upload resume'}
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.32)', margin: 0 }}>
              {step === 0 ? 'Join Atlas and accelerate your career' : step === 1 ? 'Tell us about yourself' : 'Optional — helps with job matching'}
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 22 }}>
            {stepLabels.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    background: i < step ? '#6366f1' : i === step ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                    border: i <= step ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color: i <= step ? 'white' : 'rgba(255,255,255,0.25)',
                    transition: 'all 0.3s',
                  }}>
                    {i < step ? <Check size={10} /> : i + 1}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: i === step ? 'rgba(155,185,255,0.7)' : 'rgba(255,255,255,0.2)' }}>{label}</span>
                </div>
                {i < 2 && <div style={{ width: 20, height: 1, background: i < step ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)' }} />}
              </div>
            ))}
          </div>

          {/* Card */}
          <div style={{ borderRadius: 18, padding: '26px 26px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(18px)' }}>
            <AnimatePresence mode="wait">

              {/* Step 0 — credentials */}
              {step === 0 && (
                <motion.form key="creds" onSubmit={handleCredentials}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)' }} />
                      <input type="text" className="input" placeholder="Umang Pawar" style={{ paddingLeft: 36 }}
                        value={creds.name} onChange={e => setCreds({...creds, name: e.target.value})} required />
                    </div>
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)' }} />
                      <input type="email" className="input" placeholder="you@example.com" style={{ paddingLeft: 36 }}
                        value={creds.email} onChange={e => setCreds({...creds, email: e.target.value})} required />
                    </div>
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)' }} />
                      <input type={showPw ? 'text' : 'password'} className="input" placeholder="Min. 8 characters" style={{ paddingLeft: 36, paddingRight: 36 }}
                        value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} required />
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', padding: 0 }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {creds.password && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                          {[0,1,2].map(i => (
                            <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, transition: 'background 0.3s',
                              background: i < passwordStrength ? passwordStrength === 1 ? '#ef4444' : passwordStrength === 2 ? '#f59e0b' : '#10b981' : 'rgba(255,255,255,0.08)' }} />
                          ))}
                        </div>
                        {PASSWORD_RULES.map(r => (
                          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Check size={9} style={{ color: r.test(creds.password) ? '#10b981' : 'transparent' }} />
                            <span style={{ fontSize: 10, color: r.test(creds.password) ? '#10b981' : 'rgba(255,255,255,0.25)' }}>{r.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {error && <p style={{ fontSize: 11, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '7px 10px', margin: 0 }}>{error}</p>}
                  <button type="submit" disabled={loading || passwordStrength < 1} className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                    {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />Creating…</span>
                      : <><span>Continue</span><ChevronRight size={13} /></>}
                  </button>
                </motion.form>
              )}

              {/* Step 1 — profile */}
              {step === 1 && (
                <motion.form key="profile" onSubmit={handleProfile}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Domain</label>
                    <select className="input" value={profile.domain} onChange={e => setProfile({...profile, domain: e.target.value})}
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'white', colorScheme: 'dark', width: '100%' }}>
                      {DOMAINS.map(d => <option key={d} value={d} style={{ background: '#0f0f17', color: 'white' }}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Location</label>
                    <input className="input" placeholder="Nagpur, India" style={{ width: '100%' }}
                      value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} />
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 8 }}>Experience Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {LEVELS.map(l => (
                        <button key={l.value} type="button" onClick={() => setProfile({...profile, experience_level: l.value})}
                          style={{ padding: '10px 8px', borderRadius: 10, textAlign: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: profile.experience_level === l.value ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.02)',
                            boxShadow: profile.experience_level === l.value ? 'inset 0 0 0 1px rgba(99,102,241,0.32)' : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                            color: profile.experience_level === l.value ? 'white' : 'rgba(255,255,255,0.4)' }}>
                          <div style={{ fontSize: 18, marginBottom: 3 }}>{l.emoji}</div>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{l.label}</div>
                          <div className="mono-label" style={{ marginTop: 2 }}>{l.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Skills <span style={{ color: 'rgba(255,255,255,0.2)' }}>(comma separated)</span></label>
                    <input className="input" placeholder="Python, SQL, React, Excel" style={{ width: '100%' }}
                      value={profile.skills} onChange={e => setProfile({...profile, skills: e.target.value})} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
                    <span>Continue</span><ChevronRight size={13} />
                  </button>
                </motion.form>
              )}

              {/* Step 2 — resume */}
              {step === 2 && (
                <motion.form key="resume" onSubmit={handleResume}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div
                    style={{ border: `2px dashed ${file ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: file ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)', transition: 'all 0.2s' }}
                    onClick={() => document.getElementById('resume-input-signup').click()}>
                    {file ? (
                      <><Check size={26} style={{ color: '#10b981', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#10b981', margin: '0 0 4px' }}>{file.name}</p>
                        <p className="mono-label">{(file.size/1024).toFixed(1)} KB</p></>
                    ) : (
                      <><FileText size={26} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Click to upload PDF</p>
                        <p className="mono-label">Max 10MB</p></>
                    )}
                    <input id="resume-input-signup" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                  </div>
                  {parsedSkills.length > 0 && (
                    <div style={{ borderRadius: 10, padding: 12, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <p className="mono-label" style={{ marginBottom: 8 }}>Parsed skills</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {parsedSkills.slice(0,12).map(s => <span key={s} className="badge-purple">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{error}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', color: 'rgba(255,255,255,0.35)' }}>Skip for now</button>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />Uploading…</span>
                        : file ? 'Upload & Start' : 'Get Started'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
