import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { createProfile, uploadResume } from '../api'
import { Sparkles, User, FileText, ChevronRight, Check } from 'lucide-react'

const DOMAINS = ['Data Analytics','Data Science','AI/ML Engineering','Software Development','Business Analysis','Product Management','Finance','Marketing','Other']
const LEVELS  = [
  { value: 'fresher',     label: 'Fresher',     desc: '0–1 yr',  emoji: '🌱' },
  { value: 'junior',      label: 'Junior',      desc: '1–3 yrs', emoji: '🚀' },
  { value: 'experienced', label: 'Experienced', desc: '3+ yrs',  emoji: '⚡' },
]

export default function Setup() {
  const navigate = useNavigate()
  const [step, setStep]   = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)
  const [form, setForm]   = useState({ name:'', domain:'Data Analytics', location:'', experience_level:'fresher', skills:'' })
  const [file, setFile]   = useState(null)
  const [parsedSkills, setParsedSkills] = useState([])

  const handleProfile = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setError(''); setLoading(true)
    try {
      const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean)
      const { data } = await createProfile({ ...form, skills })
      setUserId(data.user_id)
      localStorage.setItem('atlas_uid', data.user_id)
      localStorage.setItem('atlas_profile', JSON.stringify({ name: data.name, domain: form.domain, experience_level: form.experience_level }))
      setStep(1)
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create profile') }
    finally { setLoading(false) }
  }

  const handleResume = async (e) => {
    e.preventDefault()
    if (!file) { navigate('/dashboard'); return }
    setLoading(true)
    try {
      const { data } = await uploadResume(userId, file)
      setParsedSkills(data.parsed_skills || [])
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (err) { setError(err.response?.data?.detail || 'Upload failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#05050a' }}>
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'ambientPulse 10s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'ambientPulse 14s ease-in-out infinite reverse' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 40px rgba(99,102,241,0.45)', animation: 'float 4s ease-in-out infinite' }}
          >
            <Sparkles size={24} className="text-white" />
          </div>
          <h1
            className="text-3xl text-white mb-1"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}
          >
            Welcome to Atlas
          </h1>
          <p className="text-sm text-slate-500">Your AI-powered career operating system</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[{ icon: User, label: 'Profile' }, { icon: FileText, label: 'Resume' }].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i < step ? 'text-emerald-400' : i === step ? 'text-white' : 'text-slate-600'
                }`}
                style={i === step
                  ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 14px rgba(99,102,241,0.15)' }
                  : {}}
              >
                {i < step ? <Check size={11} className="text-emerald-400" /> : <s.icon size={11} />}
                {s.label}
              </div>
              {i < 1 && <ChevronRight size={11} className="text-slate-700" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: step === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: step === 0 ? -20 : 20 }}
            transition={{ duration: 0.28 }}
            className="card-elevated"
          >
            {step === 0 && (
              <form onSubmit={handleProfile} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Set up your profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Personalise your job feed, resume studio, and AI coaching</p>
                </div>
                <div>
                  <label className="mono-label mb-1.5 block">Full Name *</label>
                  <input className="input" placeholder="Umang Pawar" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mono-label mb-1.5 block">Target Domain</label>
                    <select 
                      className="input" 
                      value={form.domain} 
                      onChange={e => setForm({...form, domain: e.target.value})}
                      style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        color: 'white',
                        colorScheme: 'dark'
                    }}
                    >
                      {DOMAINS.map(d => <option key={d} value={d} style={{ background: '#0f0f17', color: 'white' }}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mono-label mb-1.5 block">Location</label>
                    <input className="input" placeholder="Pune, India" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="mono-label mb-2 block">Experience Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LEVELS.map(l => (
                      <button key={l.value} type="button" onClick={() => setForm({...form, experience_level: l.value})}
                        className={`p-2.5 rounded-xl text-center transition-all ${form.experience_level === l.value ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        style={form.experience_level === l.value
                          ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.32)' }
                          : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="text-lg mb-0.5">{l.emoji}</div>
                        <div className="text-xs font-semibold">{l.label}</div>
                        <div className="mono-label mt-0.5">{l.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mono-label mb-1.5 block">Skills <span className="text-slate-700">(comma separated)</span></label>
                  <input className="input" placeholder="Python, SQL, Power BI, Excel, Tableau" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? 'Setting up…' : <><span>Continue</span><ChevronRight size={14} /></>}
                </button>
              </form>
            )}

            {step === 1 && (
              <form onSubmit={handleResume} className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Upload your resume</h2>
                  <p className="text-xs text-slate-500 mt-0.5">PDF format. Used for ATS scoring and job matching.</p>
                </div>
                <div
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: file ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
                    background: file ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)',
                  }}
                  onClick={() => document.getElementById('resume-input').click()}
                  onMouseEnter={e => !file && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={e => !file && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                >
                  {file ? (
                    <div>
                      <Check size={28} className="mx-auto mb-2 text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-400">{file.name}</p>
                      <p className="mono-label mt-1">{(file.size/1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <FileText size={28} className="mx-auto mb-2 text-slate-600" />
                      <p className="text-sm text-slate-400">Click to upload PDF</p>
                      <p className="mono-label mt-1">Max 10MB</p>
                    </div>
                  )}
                  <input id="resume-input" type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </div>
                {parsedSkills.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
                  >
                    <p className="mono-label mb-2">Parsed skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedSkills.slice(0,12).map(s => <span key={s} className="badge-purple">{s}</span>)}
                    </div>
                  </motion.div>
                )}
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost flex-1 justify-center text-slate-500">Skip for now</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                    {loading ? 'Uploading…' : file ? 'Upload & Start' : 'Get Started'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
