import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, X, Send, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { submitBugReport } from '../api'

const SEVERITIES = [
  { value: 'low',      label: 'Low',      color: '#64748b', desc: 'Minor issue' },
  { value: 'medium',   label: 'Medium',   color: '#f59e0b', desc: 'Affects workflow' },
  { value: 'high',     label: 'High',     color: '#f97316', desc: 'Blocking me' },
  { value: 'critical', label: 'Critical', color: '#ef4444', desc: 'App unusable' },
]

const CATEGORIES = ['ui', 'api', 'data', 'performance', 'other']

export default function BugReportModal({ onClose }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    category: 'general',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) return
    setError(''); setLoading(true)
    try {
      await submitBugReport({
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
        category: form.category,
        extra_data: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      })
      setDone(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{ background: '#0a0a12', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Bug size={15} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Report a Bug</h3>
              <p className="text-xs text-slate-600">Help us improve Atlas</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-6 space-y-3">
              <CheckCircle size={40} className="mx-auto text-emerald-400" />
              <p className="text-sm font-medium text-white">Bug reported!</p>
              <p className="text-xs text-slate-500">Thank you for helping us improve.</p>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="mono-label mb-1.5 block">What went wrong?</label>
                <input className="input w-full" placeholder="Brief description of the issue"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>

              {/* Severity */}
              <div>
                <label className="mono-label mb-2 block">Severity</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SEVERITIES.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setForm({...form, severity: s.value})}
                      className="p-2 rounded-lg text-center text-xs transition-all"
                      style={form.severity === s.value
                        ? { background: `${s.color}20`, border: `1px solid ${s.color}50`, color: s.color }
                        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
                      <div className="font-semibold">{s.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="mono-label mb-1.5 block">Category</label>
                <select className="input w-full capitalize"
                  value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'white', colorScheme: 'dark' }}>
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0f0f17' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mono-label mb-1.5 block">Details</label>
                <textarea className="input w-full resize-none" rows={3}
                  placeholder="Steps to reproduce, what you expected vs what happened…"
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} />{error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="btn-ghost flex-1 justify-center text-slate-500 text-sm">Cancel</button>
                <button type="submit" disabled={loading}
                  className="btn-primary flex-1 justify-center gap-2 text-sm">
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Send size={13} /><span>Submit</span></>}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
