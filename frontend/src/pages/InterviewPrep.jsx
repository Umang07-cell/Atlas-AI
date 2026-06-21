import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { startInterview, sendInterviewMessage, endInterview, listInterviewSessions } from '../api'
import useInterviewVoice from '../hooks/useInterviewVoice'
import { isMobileDevice, shouldReduceEffects } from '../utils/device'
import { Loader2, Trophy, ChevronRight, RotateCcw, Volume2, Clock, User, PhoneOff } from 'lucide-react'

const LEVELS = [
  { value: 'fresher',     label: 'Fresher',     desc: '0–1 year',  emoji: '🌱' },
  { value: 'junior',      label: 'Junior',      desc: '1–3 years', emoji: '🚀' },
  { value: 'experienced', label: 'Experienced', desc: '3+ years',  emoji: '⚡' },
]
const DURATIONS = [
  { value: 15, label: '15 min', desc: 'Quick practice' },
  { value: 20, label: '20 min', desc: 'Standard' },
  { value: 30, label: '30 min', desc: 'Full interview' },
]
const PHASE_ORDER = ['intro','background','technical','behavioral','hr','closing']
const PHASE_LABELS = { intro:'Introduction', background:'Background', technical:'Technical', behavioral:'Behavioral', hr:'HR Round', closing:'Wrap Up' }

function formatTime(s) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}` }

function PhaseBar({ phase }) {
  const idx = PHASE_ORDER.indexOf(phase)
  return (
    <div className="flex items-center gap-1">
      {PHASE_ORDER.map((p, i) => (
        <div key={p} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
            i < idx ? 'bg-emerald-400' : i === idx ? 'bg-indigo-400' : 'bg-slate-700'
          }`} style={i === idx ? { boxShadow: '0 0 6px rgba(99,102,241,0.6)', animation: 'ambientPulse 1.5s ease-in-out infinite' } : {}} />
          {i < PHASE_ORDER.length-1 && <div className={`w-3 h-px transition-colors duration-500 ${i < idx ? 'bg-emerald-400/40' : 'bg-slate-700'}`} />}
        </div>
      ))}
      <span className="ml-2 text-xs text-slate-400">{PHASE_LABELS[phase] || phase}</span>
    </div>
  )
}

function ScoreBadge({ score }) {
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
        <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="45" cy="45" r="38" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${2*Math.PI*38}`}
          strokeDashoffset={`${2*Math.PI*38*(1-score/10)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-500">/10</span>
      </div>
    </div>
  )
}

function FeedbackCard({ feedback }) {
  if (!feedback) return null
  const scoreColor = feedback.overall_score >= 8 ? '#10b981' : feedback.overall_score >= 6 ? '#f59e0b' : '#ef4444'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-elevated space-y-5"
      style={{ borderColor: `${scoreColor}25` }}
    >
      <div className="flex items-center gap-4">
        <Trophy size={22} style={{ color: scoreColor }} />
        <h3 className="font-semibold text-white flex-1" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Interview Report</h3>
        <ScoreBadge score={feedback.overall_score} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Technical',      val: feedback.technical_score },
          { label: 'Communication',  val: feedback.communication_score },
          { label: 'Confidence',     val: feedback.confidence_score },
        ].map(s => (
          <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-lg font-bold text-white">{s.val}<span className="text-xs text-slate-500">/10</span></p>
            <p className="mono-label mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="divider-glow" />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="mono-label text-emerald-500 mb-2">Strengths</p>
          {(feedback.strengths||[]).map(s => <p key={s} className="text-xs text-slate-400 mb-1.5">• {s}</p>)}
        </div>
        <div>
          <p className="mono-label text-orange-500 mb-2">Improve</p>
          {(feedback.improvements||[]).map(s => <p key={s} className="text-xs text-slate-400 mb-1.5">• {s}</p>)}
        </div>
      </div>

      <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <p className="text-xs font-semibold text-indigo-300 mb-1">Verdict: {feedback.verdict}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{feedback.summary}</p>
      </div>
    </motion.div>
  )
}

export default function InterviewPrep() {
  const [stage, setStage]               = useState('setup')
  const [level, setLevel]               = useState('fresher')
  const [duration, setDuration]         = useState(20)
  const [jd, setJd]                     = useState('')
  const [session, setSession]           = useState(null)
  const [messages, setMessages]         = useState([])
  const [loading, setLoading]           = useState(false)
  const [feedback, setFeedback]         = useState(null)
  const [phase, setPhase]               = useState('intro')
  const [remainingSeconds, setRemaining] = useState(0)
  const [generatingFeedback, setGenFB]  = useState(false)
  const [pastSessions, setPastSessions] = useState([])
  const timerRef    = useRef(null)
  const sessionRef  = useRef(null)
  const loadingRef  = useRef(false)
  const speakRef    = useRef(async () => {})
  const userId      = parseInt(localStorage.getItem('atlas_uid'))

  const containerRef = useRef(null)

const enterFullscreen = () => {
  if (isMobileDevice()) return
  const el = document.documentElement
  if (el.requestFullscreen) el.requestFullscreen()
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
}

const exitFullscreen = () => {
  if (document.exitFullscreen) document.exitFullscreen()
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
}

  sessionRef.current = session
  loadingRef.current = loading

  useEffect(() => {
    if (userId) listInterviewSessions(userId).then(r => setPastSessions(r.data||[])).catch(()=>{})
  }, [userId, stage])

  const sendAnswer = useCallback(async (text) => {
    if (!text.trim() || !sessionRef.current) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const { data } = await sendInterviewMessage({ session_id: sessionRef.current.session_id, user_id: userId, message: text })
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      setPhase(data.phase)
      if (data.remaining_seconds != null) setRemaining(data.remaining_seconds)
      if (data.is_complete) {
        setGenFB(true); 
        setFeedback(data.feedback); 
        exitFullscreen(); 
        setGenFB(false);
        if (data.message) await speakRef.current(data.message);
        setStage('complete');
        return null;
      }
      return data.message
    } catch (err) { alert(err.response?.data?.detail || 'Error sending answer') }
    finally { setLoading(false) }
    return null
  }, [userId])

  const handleVoiceAnswer = useCallback(async (text) => {
    if (!sessionRef.current || loadingRef.current) return
    const reply = await sendAnswer(text)
    if (reply) await speakRef.current(reply)
  }, [sendAnswer])

  const { turnState, liveTranscript, speak, isSpeaking, isListening, isProcessing } =
    useInterviewVoice({ onTranscript: handleVoiceAnswer, disabled: stage !== 'interview', autoListen: stage === 'interview' })
  speakRef.current = speak

  const handleTimeUp = useCallback(async () => {
    if (!sessionRef.current || loadingRef.current) return
    setGenFB(true)
    try { const { data } = await endInterview({ session_id: sessionRef.current.session_id, user_id: userId }); setFeedback(data.feedback); setStage('complete') }
    catch { alert('Interview ended. Feedback generation failed.') }
    finally { setGenFB(false) }
  }, [userId])

  useEffect(() => {
    if (stage === 'interview' && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemaining(s => { if (s <= 1) { clearInterval(timerRef.current); handleTimeUp(); return 0 } return s-1 })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [stage, session?.session_id, handleTimeUp])

  const startSession = async () => {
    setLoading(true)
    try {
      const { data } = await startInterview({ user_id: userId, jd_text: jd, level, duration_minutes: duration })
      setSession(data); setMessages([{ role: 'assistant', content: data.message }]); setPhase(data.phase)
      setRemaining(data.remaining_seconds ?? duration * 60); setStage('interview'); setLoading(false)
      enterFullscreen() 
      await new Promise(r => setTimeout(r, 100)); await speak(data.message)
    } catch (err) { alert(err.response?.data?.detail || 'Failed to start'); setLoading(false) }
  }

  const handleEnd = async () => {
    if (!session) return
    if (!confirm('End early? You will receive your feedback report.')) return
    setGenFB(true)
    try { const { data } = await endInterview({ session_id: session.session_id, user_id: userId }); setFeedback(data.feedback); setStage('complete') }
    catch (err) { alert(err.response?.data?.detail || 'Failed to end') }
    finally { setGenFB(false) }
  }

  const reset = () => { exitFullscreen(); setStage('setup'); setMessages([]); setSession(null); setFeedback(null); setPhase('intro'); clearInterval(timerRef.current) }

  const statusText = { idle: loading ? 'Interviewer is thinking…' : 'Ready — listening starts automatically', speaking: 'Interviewer is speaking…', listening: '🎙 Listening… speak naturally', processing: 'Processing your answer…' }[turnState] || 'Ready'
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')

  /* ── SETUP ── */
  if (stage === 'setup') return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className="mb-7">
        <p className="mono-label mb-1.5">Simulation</p>
        <h1 className="text-2xl text-white mb-1" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}>AI Mock Interview</h1>
        <p className="text-xs text-slate-500">Voice-first interview with a human-like AI interviewer. Feedback only after you finish.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card-elevated space-y-5">
        <div>
          <label className="mono-label mb-3 block">Your Level</label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map(l => (
              <button key={l.value} onClick={() => setLevel(l.value)}
                className={`p-3 rounded-xl text-center transition-all ${level === l.value ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                style={level === l.value
                  ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 20px rgba(99,102,241,0.12)' }
                  : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-xl mb-0.5">{l.emoji}</div>
                <div className="text-xs font-semibold">{l.label}</div>
                <div className="mono-label mt-0.5">{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mono-label mb-3 block">Duration</label>
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map(d => (
              <button key={d.value} onClick={() => setDuration(d.value)}
                className={`p-3 rounded-xl text-center transition-all ${duration === d.value ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                style={duration === d.value
                  ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)' }
                  : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-xs font-semibold">{d.label}</div>
                <div className="mono-label mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mono-label mb-1.5 block">Job Description <span className="text-slate-700">(optional — for targeted questions)</span></label>
          <textarea className="input min-h-28 resize-none text-sm" placeholder="Paste the JD…" value={jd} onChange={e => setJd(e.target.value)} />
        </div>

        <button onClick={startSession} disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Starting…</> : <><Volume2 size={15} /> Start Voice Interview <ChevronRight size={14} /></>}
        </button>
      </motion.div>

      {pastSessions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-5 card">
          <p className="mono-label mb-3">Recent Sessions</p>
          {pastSessions.slice(0,5).map(s => (
            <div key={s.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              <div>
                <p className="text-xs font-medium text-white capitalize">{s.level} · {s.duration_minutes||20} min</p>
                <p className="mono-label mt-0.5">{PHASE_LABELS[s.phase]||s.phase} · {s.created_at?.slice(0,10)}</p>
              </div>
              {s.is_complete && s.score && <span className="text-sm font-bold text-indigo-400">{s.score}/10</span>}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )

  /* ── COMPLETE ── */
  if (stage === 'complete') return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl text-white" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}>Interview Complete</h1>
        <p className="text-xs text-slate-500 mt-1">Here's your detailed performance report.</p>
      </motion.div>
      {generatingFeedback ? (
        <div className="card text-center py-14">
          <Loader2 size={32} className="animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Generating your report…</p>
        </div>
      ) : <FeedbackCard feedback={feedback} />}
      <button onClick={reset} className="btn-ghost mt-4 w-full justify-center">
        <RotateCcw size={14} /> Start New Interview
      </button>
    </div>
  )

  /* ── LIVE INTERVIEW ── */
  const reduce = shouldReduceEffects()
  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: reduce ? 'rgba(5,5,10,0.95)' : 'rgba(5,5,10,0.7)',
          ...(reduce ? {} : { backdropFilter: 'blur(10px)' }),
        }}>
        <div>
          <h2 className="text-sm font-semibold text-white">Live Interview — {LEVELS.find(l=>l.value===level)?.emoji} {LEVELS.find(l=>l.value===level)?.label}</h2>
          <div className="mt-1.5"><PhaseBar phase={phase} /></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: remainingSeconds < 120 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Clock size={12} className={remainingSeconds < 120 ? 'text-red-400' : 'text-slate-500'} />
            <span className={`text-sm font-bold ${remainingSeconds < 120 ? 'text-red-400' : 'text-white'}`}
              style={{ fontFamily: 'var(--font-mono)' }}>
              {formatTime(remainingSeconds)}
            </span>
          </div>
          <button onClick={handleEnd} disabled={generatingFeedback} className="btn-ghost text-xs py-1.5 text-red-400 hover:text-red-300">
            <PhoneOff size={12} /> End
          </button>
        </div>
      </div>

      {/* Voice room */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-7 px-4 sm:px-6 py-6 overscroll-contain">
        {/* Background glow — skip heavy blur on mobile */}
        {!reduce && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
              style={{ background: isSpeaking ? 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' : 'transparent', filter: 'blur(40px)', transition: 'all 0.8s ease' }} />
          </div>
        )}

        {/* Interviewer avatar */}
        <div className="relative">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center transition-transform duration-300"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: isSpeaking ? '0 0 60px rgba(99,102,241,0.5)' : '0 0 30px rgba(99,102,241,0.2)',
              transform: isSpeaking && !reduce ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            <User size={44} className="text-white" />
          </div>
          {/* Speaking bars */}
          {isSpeaking && !reduce && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 items-end">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="w-1 bg-indigo-400 rounded-full animate-bounce"
                  style={{ height: `${8+(i%3)*6}px`, animationDelay: `${i*0.1}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* Current question */}
        <div className="text-center max-w-md">
          <p className="mono-label text-indigo-400 mb-2">{PHASE_LABELS[phase]||phase}</p>
          {lastAssistant && (
            <p className="text-sm text-slate-300 leading-relaxed italic">
              "{lastAssistant.content.length > 200 ? lastAssistant.content.slice(0,200)+'…' : lastAssistant.content}"
            </p>
          )}
        </div>

        {/* Status */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500">{statusText}</p>
          {liveTranscript && <p className="text-xs text-emerald-400 italic">You: "{liveTranscript}"</p>}
          {(loading || isProcessing) && !isListening && <Loader2 size={18} className="animate-spin text-indigo-400 mx-auto" />}
          {isListening && !reduce && (
            <div className="flex gap-1 items-end justify-center h-8">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="w-1.5 bg-emerald-400 rounded-full animate-bounce"
                  style={{ height:`${10+(i%3)*8}px`, animationDelay:`${i*0.12}s` }} />
              ))}
            </div>
          )}
          {isListening && reduce && (
            <p className="text-xs text-emerald-400">Listening…</p>
          )}
        </div>
      </div>
    </div>
  )
}
