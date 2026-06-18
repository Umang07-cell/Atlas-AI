import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, Eye, EyeOff, User, FileText, Check, ChevronRight } from 'lucide-react'
import { signup, uploadResume } from '../api'
import { trackEvent } from '../api'
import { initSession } from '../utils/session'

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
  const [step, setStep] = useState(0) // 0=credentials, 1=profile, 2=resume
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [userId, setUserId] = useState(null)
  const [file, setFile] = useState(null)
  const [parsedSkills, setParsedSkills] = useState([])

  const [creds, setCreds] = useState({ email: '', password: '', name: '' })
  const [profile, setProfile] = useState({
    domain: 'Software Development',
    location: '',
    experience_level: 'fresher',
    skills: '',
  })

  const handleCredentials = async (e) => {
    e.preventDefault()
    if (!creds.name.trim() || !creds.email || !creds.password) return
    setError(''); setLoading(true)
    try {
      const { data } = await signup({
        name: creds.name.trim(),
        email: creds.email,
        password: creds.password,
        domain: profile.domain,
        location: profile.location,
        experience_level: profile.experience_level,
      })
      localStorage.setItem('atlas_token', data.token)
      localStorage.setItem('atlas_uid', data.user_id)
      localStorage.setItem('atlas_profile', JSON.stringify({
        name: data.name,
        domain: data.domain,
        experience_level: data.experience_level,
      }))
      initSession()
      setUserId(data.user_id)
      setStep(1)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.detail?.[0]?.msg || 'Signup failed'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally { setLoading(false) }
  }

  const handleProfile = (e) => {
    e.preventDefault()
    setStep(2)
  }

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#05050a' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 40px rgba(99,102,241,0.45)' }}>
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-3xl text-white mb-1"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}>
            {step === 0 ? 'Create your account' : step === 1 ? 'Your profile' : 'Upload resume'}
          </h1>
          <p className="text-sm text-slate-500">
            {step === 0 ? 'Join Atlas and accelerate your career' : step === 1 ? 'Tell us about yourself' : 'Optional — helps with job matching'}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0,1,2].map(i => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === step ? 24 : 8, background: i <= step ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
          <AnimatePresence mode="wait">
            {/* Step 0 — credentials */}
            {step === 0 && (
              <motion.form key="creds" onSubmit={handleCredentials} className="space-y-4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div>
                  <label className="mono-label mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type="text" className="input pl-9 w-full" placeholder="Umang Sharma"
                      value={creds.name} onChange={e => setCreds({...creds, name: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="mono-label mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type="email" className="input pl-9 w-full" placeholder="you@example.com"
                      value={creds.email} onChange={e => setCreds({...creds, email: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="mono-label mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type={showPw ? 'text' : 'password'} className="input pl-9 pr-9 w-full" placeholder="Min. 8 characters"
                      value={creds.password} onChange={e => setCreds({...creds, password: e.target.value})} required />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {creds.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300"
                            style={{ background: i < passwordStrength
                              ? passwordStrength === 1 ? '#ef4444' : passwordStrength === 2 ? '#f59e0b' : '#10b981'
                              : 'rgba(255,255,255,0.08)' }} />
                        ))}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {PASSWORD_RULES.map(r => (
                          <span key={r.label} className={`text-xs flex items-center gap-1.5 transition-colors ${r.test(creds.password) ? 'text-emerald-400' : 'text-slate-600'}`}>
                            <Check size={10} className={r.test(creds.password) ? 'opacity-100' : 'opacity-0'} />
                            {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {error && <p className="text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading || passwordStrength < 1} className="btn-primary w-full justify-center gap-2">
                  {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</> : <><span>Continue</span><ChevronRight size={14} /></>}
                </button>
                <p className="text-center text-sm text-slate-500 pt-1">
                  Already have an account?{' '}
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Sign in</Link>
                </p>
              </motion.form>
            )}

            {/* Step 1 — profile details */}
            {step === 1 && (
              <motion.form key="profile" onSubmit={handleProfile} className="space-y-4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="mono-label mb-1.5 block">Domain</label>
                    <select className="input w-full" value={profile.domain} onChange={e => setProfile({...profile, domain: e.target.value})}
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'white', colorScheme: 'dark' }}>
                      {DOMAINS.map(d => <option key={d} value={d} style={{ background: '#0f0f17', color: 'white' }}>{d}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="mono-label mb-1.5 block">Location</label>
                    <input className="input w-full" placeholder="Nagpur, India"
                      value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="mono-label mb-2 block">Experience Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LEVELS.map(l => (
                      <button key={l.value} type="button" onClick={() => setProfile({...profile, experience_level: l.value})}
                        className={`p-2.5 rounded-xl text-center transition-all ${profile.experience_level === l.value ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        style={profile.experience_level === l.value
                          ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.32)' }
                          : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-lg mb-0.5">{l.emoji}</div>
                        <div className="text-xs font-semibold">{l.label}</div>
                        <div className="mono-label mt-0.5">{l.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mono-label mb-1.5 block">Skills <span className="text-slate-700">(comma separated)</span></label>
                  <input className="input w-full" placeholder="Python, SQL, React, Excel"
                    value={profile.skills} onChange={e => setProfile({...profile, skills: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary w-full justify-center gap-2">
                  <span>Continue</span><ChevronRight size={14} />
                </button>
              </motion.form>
            )}

            {/* Step 2 — resume */}
            {step === 2 && (
              <motion.form key="resume" onSubmit={handleResume} className="space-y-4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                  style={{ borderColor: file ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)', background: file ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)' }}
                  onClick={() => document.getElementById('resume-input-signup').click()}>
                  {file ? (
                    <div><Check size={28} className="mx-auto mb-2 text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-400">{file.name}</p>
                      <p className="mono-label mt-1">{(file.size/1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div><FileText size={28} className="mx-auto mb-2 text-slate-600" />
                      <p className="text-sm text-slate-400">Click to upload PDF</p>
                      <p className="mono-label mt-1">Max 10MB</p>
                    </div>
                  )}
                  <input id="resume-input-signup" type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </div>
                {parsedSkills.length > 0 && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <p className="mono-label mb-2">Parsed skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedSkills.slice(0,12).map(s => <span key={s} className="badge-purple">{s}</span>)}
                    </div>
                  </div>
                )}
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost flex-1 justify-center text-slate-500">Skip for now</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                    {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading…</span>
                      : file ? 'Upload & Start' : 'Get Started'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
