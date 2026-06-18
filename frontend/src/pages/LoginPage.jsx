import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { login } from '../api'
import { trackEvent } from '../api'
import { initSession } from '../utils/session'

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#05050a' }}>
      {/* Ambient glows */}
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
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 40px rgba(99,102,241,0.45)' }}
          >
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-3xl text-white mb-1"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}>
            Welcome back
          </h1>
          <p className="text-sm text-slate-500">Sign in to your Atlas account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 space-y-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="mono-label mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type="email"
                  className="input pl-9 w-full"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="mono-label">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pl-9 pr-9 w-full"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center gap-2 mt-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <><LogIn size={15} /><span>Sign In</span></>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
