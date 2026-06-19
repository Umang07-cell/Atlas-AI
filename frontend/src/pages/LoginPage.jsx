import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { login } from '../api'
import { trackEvent } from '../api'
import { initSession } from '../utils/session'
import VortexCanvas from '../components/VortexCanvas'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return
    setError(''); setLoading(true)
    try {
      const { data } = await login({ email: form.email, password: form.password })
      localStorage.setItem('atlas_token', data.token)
      localStorage.setItem('atlas_uid', data.user_id)
      localStorage.setItem('atlas_profile', JSON.stringify({
        name: data.name,
        domain: data.domain,
        experience_level: data.experience_level,
      }))
      initSession()
      trackEvent('login', { method: 'email' })
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed'
      setError(msg)
      if (err.response?.status === 429) setError('Too many attempts. Please wait a few minutes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000005', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── Vortex background ─────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <VortexCanvas />
        {/* Fade — vortex visible at top, fades to dark below */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, transparent 30%, rgba(0,0,5,0.7) 55%, rgba(0,0,5,0.97) 75%)',
        }} />
      </div>

      {/* ── Top nav ───────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(140,210,255,0.28)', transform: 'rotate(45deg)',
            background: 'rgba(100,180,255,0.06)',
            boxShadow: '0 0 18px rgba(100,190,255,0.15)',
            flexShrink: 0,
          }}>
            <span style={{
              transform: 'rotate(-45deg)', fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontWeight: 700, fontSize: 14,
              background: 'linear-gradient(135deg, #c8eeff, #a0c8ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>A</span>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 16, color: 'white', lineHeight: 1 }}>Atlas</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(120,190,255,0.4)', marginTop: 2 }}>AI Career OS</div>
          </div>
        </Link>
        <Link to="/signup" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', padding: '7px 16px', borderRadius: 8 }}>
          No account? <span style={{ color: '#7eb8ff' }}>Sign up</span>
        </Link>
      </div>

      {/* ── Form — centered in lower 65% ──────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px', position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 30, color: 'white', margin: '0 0 6px' }}>
              Welcome back
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              Sign in to your Atlas account
            </p>
          </div>

          {/* Card */}
          <div style={{ borderRadius: 18, padding: '28px 28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(18px)' }}>
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label className="mono-label" style={{ display: 'block', marginBottom: 6 }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)' }} />
                  <input
                    type="email" className="input" placeholder="you@example.com"
                    style={{ paddingLeft: 36 }}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    autoComplete="email" required
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="mono-label">Password</label>
                  <Link to="/forgot-password" style={{ fontSize: 11, color: '#7eb8ff', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)' }} />
                  <input
                    type={showPw ? 'text' : 'password'} className="input" placeholder="••••••••"
                    style={{ paddingLeft: 36, paddingRight: 36 }}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password" required
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', padding: 0 }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                  {error}
                </motion.p>
              )}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />
                    Signing in…
                  </span>
                ) : (
                  <><LogIn size={14} /><span>Sign In</span></>
                )}
              </button>
            </form>

            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: '#7eb8ff', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
