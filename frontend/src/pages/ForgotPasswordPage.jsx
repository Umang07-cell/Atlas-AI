import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { requestPasswordReset, confirmPasswordReset } from '../api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token')

  // If token is in URL, go straight to reset step
  const [step, setStep] = useState(tokenFromUrl ? 1 : 0) // 0=email, 1=new password, 2=done
  const [email, setEmail] = useState('')
  const [token, setToken] = useState(tokenFromUrl || '')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devToken, setDevToken] = useState('') // for development

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await requestPasswordReset(email)
      if (data.dev_token) setDevToken(data.dev_token) // dev mode
      setStep(1)
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a few minutes.')
      } else {
        // Always show generic message (security)
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#05050a' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 40px rgba(99,102,241,0.45)' }}>
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl text-white mb-1"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}>
            {step === 2 ? 'Password reset!' : 'Reset password'}
          </h1>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
          <AnimatePresence mode="wait">

            {/* Step 0 — enter email */}
            {step === 0 && (
              <motion.form key="email" onSubmit={handleRequestReset} className="space-y-4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
                <div>
                  <label className="mono-label mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type="email" className="input pl-9 w-full" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
                </button>
                <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors justify-center pt-1">
                  <ArrowLeft size={13} /> Back to login
                </Link>
              </motion.form>
            )}

            {/* Step 1 — enter token + new password */}
            {step === 1 && (
              <motion.form key="reset" onSubmit={handleConfirmReset} className="space-y-4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm text-slate-500">
                  Check your email for the reset link, then paste the token below.
                </p>
                {devToken && (
                  <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p className="text-indigo-400 font-mono mb-1">DEV MODE — Token:</p>
                    <p className="text-white font-mono break-all">{devToken}</p>
                    <button type="button" onClick={() => setToken(devToken)}
                      className="mt-2 text-indigo-400 hover:text-indigo-300 underline">Auto-fill</button>
                  </div>
                )}
                <div>
                  <label className="mono-label mb-1.5 block">Reset Token</label>
                  <input className="input w-full font-mono text-xs" placeholder="Paste token from email"
                    value={token} onChange={e => setToken(e.target.value)} required />
                </div>
                <div>
                  <label className="mono-label mb-1.5 block">New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                    <input type={showPw ? 'text' : 'password'} className="input pl-9 pr-9 w-full"
                      placeholder="Min. 8 characters" value={password}
                      onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Set New Password'}
                </button>
              </motion.form>
            )}

            {/* Step 2 — success */}
            {step === 2 && (
              <motion.div key="done" className="text-center space-y-4 py-4"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <CheckCircle size={48} className="mx-auto text-emerald-400" />
                <p className="text-sm text-slate-400">Your password has been updated successfully.</p>
                <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center">
                  Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
