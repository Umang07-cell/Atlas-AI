import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { createProfile, uploadResume } from '../api'
import { User, FileText, ChevronRight, Check } from 'lucide-react'
import VortexCanvas from '../components/VortexCanvas'

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
    <div style={{ minHeight: '100vh', background: '#000005', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Vortex bg */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <VortexCanvas />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, transparent 28%, rgba(0,0,5,0.75) 52%, rgba(0,0,5,0.97) 70%)',
        }} />
      </div>

      {/* Logo top */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(140,210,255,0.28)', transform: 'rotate(45deg)', background: 'rgba(100,180,255,0.06)', boxShadow: '0 0 18px rgba(100,190,255,0.15)', flexShrink: 0 }}>
            <span style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg, #c8eeff, #a0c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: 'white', lineHeight: 1 }}>Atlas</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(120,190,255,0.4)', marginTop: 2 }}>AI Career OS</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 440 }}
        >
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: 'white', margin: '0 0 6px' }}>Welcome to Atlas</h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.32)', margin: 0 }}>Your AI-powered career operating system</p>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 22 }}>
            {[{ icon: User, label: 'Profile' }, { icon: FileText, label: 'Resume' }].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
                  fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, transition: 'all 0.3s',
                  color: i < step ? '#34d399' : i === step ? 'white' : 'rgba(255,255,255,0.25)',
                  background: i === step ? 'rgba(99,102,241,0.16)' : 'transparent',
                  border: i === step ? '1px solid rgba(99,102,241,0.28)' : '1px solid transparent',
                }}>
                  {i < step ? <Check size={11} style={{ color: '#34d399' }} /> : <s.icon size={11} />}
                  {s.label}
                </div>
                {i < 1 && <ChevronRight size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />}
              </div>
            ))}
          </div>

          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: step === 0 ? -20 : 20 }}
              transition={{ duration: 0.28 }}
              style={{ borderRadius: 18, padding: '26px 26px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(18px)' }}
            >
              {step === 0 && (
                <form onSubmit={handleProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>Set up your profile</h2>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Personalise your job feed, resume studio, and AI coaching</p>
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Full Name *</label>
                    <input className="input" placeholder="Umang Pawar" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Target Domain</label>
                      <select className="input" value={form.domain} onChange={e => setForm({...form, domain: e.target.value})}
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'white', colorScheme: 'dark', width: '100%' }}>
                        {DOMAINS.map(d => <option key={d} value={d} style={{ background: '#0f0f17', color: 'white' }}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Location</label>
                      <input className="input" placeholder="Pune, India" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 8 }}>Experience Level</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {LEVELS.map(l => (
                        <button key={l.value} type="button" onClick={() => setForm({...form, experience_level: l.value})}
                          style={{ padding: '10px 6px', borderRadius: 10, textAlign: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                            background: form.experience_level === l.value ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.02)',
                            boxShadow: form.experience_level === l.value ? 'inset 0 0 0 1px rgba(99,102,241,0.32)' : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                            color: form.experience_level === l.value ? 'white' : 'rgba(255,255,255,0.38)' }}>
                          <div style={{ fontSize: 18, marginBottom: 3 }}>{l.emoji}</div>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{l.label}</div>
                          <div className="mono-label" style={{ marginTop: 2 }}>{l.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Skills <span style={{ color: 'rgba(255,255,255,0.2)' }}>(comma separated)</span></label>
                    <input className="input" placeholder="Python, SQL, Power BI, Excel, Tableau" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} />
                  </div>
                  {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? 'Setting up…' : <><span>Continue</span><ChevronRight size={14} /></>}
                  </button>
                </form>
              )}

              {step === 1 && (
                <form onSubmit={handleResume} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 4px' }}>Upload your resume</h2>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>PDF format. Used for ATS scoring and job matching.</p>
                  </div>
                  <div
                    style={{ border: `2px dashed ${file ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: file ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)', transition: 'all 0.2s' }}
                    onClick={() => document.getElementById('resume-input').click()}
                    onMouseEnter={e => !file && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                    onMouseLeave={e => !file && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  >
                    {file ? (
                      <><Check size={26} style={{ color: '#34d399', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#34d399', margin: '0 0 4px' }}>{file.name}</p>
                        <p className="mono-label">{(file.size/1024).toFixed(1)} KB</p></>
                    ) : (
                      <><FileText size={26} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>Click to upload PDF</p>
                        <p className="mono-label">Max 10MB</p></>
                    )}
                    <input id="resume-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                  </div>
                  {parsedSkills.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ borderRadius: 10, padding: 12, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <p className="mono-label" style={{ marginBottom: 8 }}>Parsed skills</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {parsedSkills.slice(0,12).map(s => <span key={s} className="badge-purple">{s}</span>)}
                      </div>
                    </motion.div>
                  )}
                  {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{error}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => navigate('/dashboard')} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', color: 'rgba(255,255,255,0.35)' }}>Skip for now</button>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                      {loading ? 'Uploading…' : file ? 'Upload & Start' : 'Get Started'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
