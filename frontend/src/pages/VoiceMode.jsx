import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { transcribeAudio, speakText, sendChatMessage } from '../api'
import { Mic, MicOff, Loader2, Volume2, Bot, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const INTENT_ROUTES = {
  navigate_jobs: '/jobs', navigate_resume: '/resume',
  navigate_interview: '/interview', navigate_chat: '/chat', navigate_dashboard: '/dashboard',
}
const COMMANDS = ['Show me jobs','Open Resume Studio','Start mock interview','Chat with ATLAS','Go to dashboard']

export default function VoiceMode() {
  const [state, setState]         = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [response, setResponse]   = useState('')
  const [history, setHistory]     = useState([])
  const mediaRef  = useRef(null)
  const chunksRef = useRef([])
  const navigate  = useNavigate()
  const userId    = parseInt(localStorage.getItem('atlas_uid'))

const start = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    let mimeType = 'audio/webm'
    if (!MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/ogg'
    const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {})
    chunksRef.current = []
    recorder.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data)
    recorder.onstop = handleStop
    recorder.start(100)
    mediaRef.current = recorder
    setState('recording')
    setTranscript(''); setResponse('')

    // Auto-stop using silence detection
    const audioCtx = new AudioContext()
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    let silenceStart = null

    const checkSilence = () => {
      if (mediaRef.current?.state === 'inactive') { audioCtx.close(); return }
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      if (avg < 8) {
        if (!silenceStart) silenceStart = Date.now()
        else if (Date.now() - silenceStart > 1800) { audioCtx.close(); stop(); return }
      } else {
        silenceStart = null
      }
      requestAnimationFrame(checkSilence)
    }
    requestAnimationFrame(checkSilence)

  } catch { alert('Microphone access denied.') }
}

  const stop = () => {
    if (mediaRef.current?.state !== 'inactive') { mediaRef.current.stop(); mediaRef.current.stream.getTracks().forEach(t=>t.stop()) }
    setState('processing')
  }

  const handleStop = async () => {
    if (!chunksRef.current.length) { setState('idle'); return }
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    try {
      const { data } = await transcribeAudio(blob, userId)
      const text = data.transcript || ''
      setTranscript(text)
      if (!text) { setState('idle'); return }
      const intent  = data.intent || 'general_query'
      let replyText = data.spoken_response || ''
      setHistory(h => [...h, { role: 'user', text }])
      if (intent === 'career_question' || intent === 'general_query') {
        try { const r = await sendChatMessage(userId, text); replyText = r.data.response } catch {}
      }
      setResponse(replyText)
      setHistory(h => [...h, { role: 'atlas', text: replyText }])
      if (INTENT_ROUTES[intent]) setTimeout(() => navigate(INTENT_ROUTES[intent]), 1500)
      try { const ar = await speakText(replyText.substring(0, 400)); new Audio(URL.createObjectURL(ar.data)).play() } catch {}
    } catch { setResponse('Sorry, I could not process that. Please try again.') }
    finally { setState('idle') }
  }

  const isRecording = state === 'recording'

  return (
    <div className="min-h-screen flex" style={{ background: '#05050a' }}>
      {/* Sidebar history */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="w-72 shrink-0 flex flex-col"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
      >
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>Conversation</h2>
          <p className="mono-label mt-0.5">Voice session</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-xs text-slate-700 text-center mt-10">Tap the mic to start</p>
          ) : history.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs rounded-xl px-3 py-2.5 ${msg.role === 'user' ? 'ml-2' : 'mr-2'}`}
              style={msg.role === 'user'
                ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.18)' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className={`block mono-label mb-1 ${msg.role === 'user' ? 'text-indigo-400' : 'text-slate-600'}`}>
                {msg.role === 'user' ? 'You' : 'ATLAS'}
              </span>
              <span className="text-slate-300 leading-relaxed">{msg.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main voice room */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden gap-8">
        {/* Ambient glow reacts to state */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ opacity: isRecording ? 1 : 0.4 }}
            transition={{ duration: 0.6 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: isRecording
                ? 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        {/* Logo / title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center relative z-10"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)', animation: 'float 4s ease-in-out infinite' }}
          >
            <Bot size={22} className="text-white" />
          </div>
          <h1
            className="text-2xl text-white"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}
          >
            ATLAS Voice
          </h1>
          <p className="text-xs text-slate-500 mt-1">Speak to navigate, search jobs, or ask career questions</p>
        </motion.div>

        {/* Mic button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="relative z-10"
        >
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(239,68,68,0.15)', animationDuration:'1s' }} />
              <span className="absolute -inset-5 rounded-full animate-ping" style={{ background: 'rgba(239,68,68,0.07)', animationDuration:'1.8s', animationDelay:'0.3s' }} />
            </>
          )}
          <motion.button
            onClick={state === 'recording' ? stop : start}
            disabled={state === 'processing'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="relative w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: isRecording
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : state === 'processing'
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: isRecording
                ? '0 0 60px rgba(239,68,68,0.5)'
                : '0 0 60px rgba(99,102,241,0.4)',
              cursor: state === 'processing' ? 'wait' : 'pointer',
            }}
          >
            {state === 'processing'
              ? <Loader2 size={40} className="text-white animate-spin" />
              : isRecording
              ? <MicOff size={40} className="text-white" />
              : <Mic size={40} className="text-white" />}
          </motion.button>
        </motion.div>

        {/* Status text */}
        <div className="text-center relative z-10 min-h-14 px-8 max-w-md">
          <AnimatePresence mode="wait">
            {isRecording && (
              <motion.p key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-red-400 text-sm font-medium animate-pulse">
                Recording… listening
              </motion.p>
            )}
            {state === 'processing' && (
              <motion.p key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-slate-400 text-sm animate-pulse">
                Processing your voice…
              </motion.p>
            )}
            {state === 'idle' && transcript && (
              <motion.div key="trans" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p className="mono-label mb-1">You said</p>
                <p className="text-white text-sm font-medium">"{transcript}"</p>
              </motion.div>
            )}
            {state === 'idle' && !transcript && (
              <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-600 text-sm">
                Tap the mic and speak a command
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ATLAS response */}
        <AnimatePresence>
          {response && state === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-md mx-auto relative z-10 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={12} className="text-indigo-400" />
                <span className="mono-label text-indigo-400">ATLAS</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions */}
        {state === 'idle' && !transcript && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="relative z-10 text-center"
          >
            <p className="mono-label mb-3">Try saying</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {COMMANDS.map(c => (
                <span key={c} className="text-xs px-3 py-1.5 rounded-full text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  "{c}"
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
