import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { tailorResume, getUid } from '../api'
import { Wand2, Copy, Check, Download, FileText, ChevronRight, Sparkles, Zap } from 'lucide-react'
import ATSMeter from '../components/ATSMeter'

export default function ResumeStudio() {
  const [jd, setJd]         = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [tab, setTab]       = useState('resume')
  const [copied, setCopied] = useState(false)

  const analyze = async () => {
    if (!jd.trim()) return

    // Guard: validate uid before making any network call
    let uid
    try {
      uid = getUid()
    } catch (e) {
      setError(e.message)
      return
    }

    setError(''); setLoading(true); setResult(null)
    try {
      const { data } = await tailorResume(jd)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Make sure you have uploaded a resume in your profile.')
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    const text = tab === 'resume' ? result?.tailored_resume : result?.cover_letter
    if (text) { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  const download = () => {
    const text = tab === 'resume' ? result?.tailored_resume : result?.cover_letter
    const filename = tab === 'resume' ? 'tailored_resume.txt' : 'cover_letter.txt'
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      {false ? (
        <div className="mb-7">
          <p className="mono-label mb-1.5 flex items-center gap-1.5">
            <Sparkles size={10} className="text-indigo-400" /> ATS Optimizer
          </p>
          <h1 className="text-2xl text-white mb-1" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}>
            Resume Studio
          </h1>
          <p className="text-xs text-slate-500">Paste a JD → ATS score + 1-page tailored resume + cover letter</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="mb-7"
        >
          <p className="mono-label mb-1.5 flex items-center gap-1.5">
            <Sparkles size={10} className="text-indigo-400" /> ATS Optimizer
          </p>
          <h1 className="text-2xl text-white mb-1" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}>
            Resume Studio
          </h1>
          <p className="text-xs text-slate-500">Paste a JD → ATS score + 1-page tailored resume + cover letter</p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — JD input */}
        {false ? (
          <div className="flex flex-col gap-4">
            <div className="card-elevated flex flex-col">
              <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <FileText size={12} className="text-indigo-400" /> Job Description
              </label>
              <textarea
                className="input flex-1 min-h-48 sm:min-h-72 resize-none text-sm"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                placeholder="Paste the full job description here..."
                value={jd}
                onChange={e => setJd(e.target.value)}
              />
              {error && (
                <div
                  className="mt-3 p-3 rounded-xl text-xs text-red-300"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  {error}
                </div>
              )}
              <button
                onClick={analyze}
                disabled={loading || !jd.trim()}
                className="btn-primary mt-4 justify-center"
              >
                <Wand2 size={14} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Analysing… (~20s)' : 'Analyse & Tailor'}
                {!loading && <ChevronRight size={13} />}
              </button>
            </div>
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="flex flex-col gap-4"
        >
          <div className="card-elevated flex flex-col">
            <label className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <FileText size={12} className="text-indigo-400" /> Job Description
            </label>
            <textarea
              className="input flex-1 min-h-72 resize-none text-sm"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              placeholder="Paste the full job description here..."
              value={jd}
              onChange={e => setJd(e.target.value)}
            />
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-3 p-3 rounded-xl text-xs text-red-300"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={analyze}
              disabled={loading || !jd.trim()}
              className="btn-primary mt-4 justify-center"
            >
              <Wand2 size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Analysing… (~20s)' : 'Analyse & Tailor'}
              {!loading && <ChevronRight size={13} />}
            </button>
          </div>
        </motion.div>
        )}

        {/* Right — results */}
        {false ? (
          <div className="flex flex-col gap-4">
            <div className="card-elevated flex items-center justify-center py-8 relative overflow-hidden">
              {loading ? (
                <div className="text-center">
                  <div className="w-[130px] h-[130px] skeleton rounded-full mx-auto mb-3" />
                  <p className="text-xs text-slate-500 animate-pulse">Analysing your resume…</p>
                </div>
              ) : (
                <ATSMeter originalScore={result?.original_score} tailoredScore={result?.tailored_score} />
              )}
            </div>

            {result?.missing_keywords?.length > 0 && (
              <div className="card-accent">
                <p className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
                  <Zap size={11} className="text-emerald-400" /> Missing Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_keywords.map(k => (
                    <span key={k} className="badge-green">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {result?.present_keywords?.length > 0 && (
              <div className="card-accent">
                <p className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-indigo-400" /> Already Matched
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.present_keywords.slice(0, 12).map(k => (
                    <span key={k} className="badge-blue">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className="card-elevated flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex gap-1 p-1 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {['resume', 'cover'].map(t => (
                      <button
                        key={t} onClick={() => setTab(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                        style={tab === t ? { background: 'rgba(99,102,241,0.22)' } : {}}
                      >
                        {t === 'resume' ? 'Tailored Resume' : 'Cover Letter'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={copy} className="btn-ghost py-1 px-2.5 text-xs">
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button onClick={download} className="btn-ghost py-1 px-2.5 text-xs">
                      <Download size={12} />
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  className="input min-h-48 sm:min-h-64 text-xs resize-none"
                  style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)' }}
                  value={(tab === 'resume' ? result.tailored_resume : result.cover_letter) || ''}
                />
              </div>
            )}

            {!result && !loading && (
              <div className="card flex flex-col items-center justify-center py-14 text-center">
                <FileText size={38} className="mb-3 text-slate-700" />
                <p className="text-slate-500 text-sm">Your tailored resume will appear here</p>
                <p className="text-slate-600 text-xs mt-1">Paste a JD and click Analyse</p>
              </div>
            )}
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          {/* ATS Meter */}
          <div className="card-elevated flex items-center justify-center py-8 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 60%, rgba(99,102,241,0.06), transparent 65%)' }} />
            {loading ? (
              <div className="text-center">
                <div className="w-[130px] h-[130px] skeleton rounded-full mx-auto mb-3" />
                <p className="text-xs text-slate-500 animate-pulse">Analysing your resume…</p>
              </div>
            ) : (
              <ATSMeter originalScore={result?.original_score} tailoredScore={result?.tailored_score} />
            )}
          </div>

          {/* Keywords */}
          <AnimatePresence>
            {result?.missing_keywords?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card-accent"
              >
                <p className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
                  <Zap size={11} className="text-emerald-400" /> Missing Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_keywords.map(k => (
                    <motion.span
                      key={k}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                      className="badge-green"
                    >
                      {k}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Present keywords — new: show what's already strong */}
          <AnimatePresence>
            {result?.present_keywords?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card-accent"
              >
                <p className="text-xs font-semibold text-white mb-2.5 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-indigo-400" /> Already Matched
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.present_keywords.slice(0, 12).map(k => (
                    <motion.span
                      key={k}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                      className="badge-blue"
                    >
                      {k}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Output */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card-elevated flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex gap-1 p-1 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {['resume', 'cover'].map(t => (
                      <button
                        key={t} onClick={() => setTab(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                        style={tab === t ? { background: 'rgba(99,102,241,0.22)' } : {}}
                      >
                        {t === 'resume' ? 'Tailored Resume' : 'Cover Letter'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={copy} className="btn-ghost py-1 px-2.5 text-xs">
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <button onClick={download} className="btn-ghost py-1 px-2.5 text-xs">
                      <Download size={12} />
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  className="input min-h-64 text-xs resize-none"
                  style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)' }}
                  value={(tab === 'resume' ? result.tailored_resume : result.cover_letter) || ''}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center py-14 text-center">
              <FileText size={38} className="mb-3 text-slate-700" />
              <p className="text-slate-500 text-sm">Your tailored resume will appear here</p>
              <p className="text-slate-600 text-xs mt-1">Paste a JD and click Analyse</p>
            </div>
          )}
        </motion.div>
        )}
      </div>
    </div>
  )
}