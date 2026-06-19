import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { requestPasswordReset, confirmPasswordReset } from '../api'
import VortexCanvas from '../components/VortexCanvas'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')

  const [step, setStep] = useState(tokenFromUrl ? 1 : 0)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(tokenFromUrl || '')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devToken, setDevToken] = useState('')

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await requestPasswordReset(email)
      if (data.dev_token) setDevToken(data.dev_token)
      setStep(1)
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a few minutes.')
      } else {
        setStep(1)
      }
    } finally { setLoading(false) }
  }

  const handleConfirmReset = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError(''); setLoading(true)
    try {
      await confirmPasswordReset(token, password)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The token may have expired.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000005', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Vortex bg */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <VortexCanvas />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,5,0.72) 55%, rgba(0,0,5,0.97) 75%)',
        }} />
      </div>

      {/* Nav */}
      <div style={{ position: 'relative', zIndex: 10, padding: '20px 32px' }}>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(140,210,255,0.28)', transform: 'rotate(45deg)', background: 'rgba(100,180,255,0.06)', flexShrink: 0 }}>
            <span style={{ transform: 'rotate(-45deg)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg, #c8eeff, #a0c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>A</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: 'white', lineHeight: 1 }}>Atlas</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(120,190,255,0.4)', marginTop: 2 }}>AI Career OS</div>
          </div>
        </Link>
      </div>

      {/* Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: 'white', margin: '0 0 6px' }}>
              {step === 2 ? 'Password reset!' : 'Reset password'}
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.32)', margin: 0 }}>
              {step === 0 ? "We'll send you a reset link" : step === 1 ? 'Enter your token and new password' : 'All done'}
            </p>
          </div>

          <div style={{ borderRadius: 18, padding: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(18px)' }}>
            <AnimatePresence mode="wait">

              {step === 0 && (
                <motion.form key="email" onSubmit={handleRequestReset}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0 }}>Enter your email and we'll send you a reset link.</p>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)' }} />
                      <input type="email" className="input" placeholder="you@example.com" style={{ paddingLeft: 36 }}
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} /> : 'Send Reset Link'}
                  </button>
                  <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', justifyContent: 'center' }}>
                    <ArrowLeft size={12} /> Back to login
                  </Link>
                </motion.form>
              )}

              {step === 1 && (
                <motion.form key="reset" onSubmit={handleConfirmReset}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0 }}>Check your email for the reset link, then paste the token below.</p>
                  {devToken && (
                    <div style={{ borderRadius: 10, padding: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#818cf8', marginBottom: 4 }}>DEV MODE — Token:</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'white', wordBreak: 'break-all', margin: '0 0 8px' }}>{devToken}</p>
                      <button type="button" onClick={() => setToken(devToken)} style={{ fontSize: 11, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Auto-fill</button>
                    </div>
                  )}
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Reset Token</label>
                    <input className="input" placeholder="Paste token from email" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      value={token} onChange={e => setToken(e.target.value)} required />
                  </div>
                  <div>
                    <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)' }} />
                      <input type={showPw ? 'text' : 'password'} className="input" placeholder="Min. 8 characters" style={{ paddingLeft: 36, paddingRight: 36 }}
                        value={password} onChange={e => setPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', padding: 0 }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{error}</p>}
                  <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {loading ? <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} /> : 'Set New Password'}
                  </button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.div key="done" style={{ textAlign: 'center', padding: '16px 0' }}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <CheckCircle size={46} style={{ color: '#34d399', margin: '0 auto 14px' }} />
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>Your password has been updated successfully.</p>
                  <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Sign In</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
