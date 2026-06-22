import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Loader2 } from 'lucide-react'
import { transcribeAudio, speakText } from '../api'
import { useNavigate } from 'react-router-dom'
import { isMobileDevice } from '../utils/device'

const INTENT_ROUTES = {
  navigate_jobs:      '/jobs',
  navigate_resume:    '/resume',
  navigate_interview: '/interview',
  navigate_chat:      '/chat',
  navigate_dashboard: '/dashboard',
  navigate_voice:     '/voice',
}

// How long silence after speech before auto-stop (ms)
const SILENCE_AFTER_SPEECH_MS = 1400
// How long total silence at start before giving up (ms)
const MAX_WAIT_FOR_SPEECH_MS  = 8000
// Volume threshold — above this = speech detected
const SPEECH_THRESHOLD = 10

export default function VoiceButton() {
  const [state, setState]           = useState('idle')  // idle | waiting | recording | processing
  const [transcript, setTranscript] = useState('')
  const mediaRef     = useRef(null)
  const chunksRef    = useRef([])
  const audioCtxRef  = useRef(null)
  const pollTimerRef = useRef(null)
  const stoppedRef   = useRef(false)
  const navigate     = useNavigate()
  const userId       = localStorage.getItem('atlas_uid')

  useEffect(() => () => cleanup(), [])

  const cleanup = () => {
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null }
    if (audioCtxRef.current)  { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }
    if (mediaRef.current) {
      if (mediaRef.current.state !== 'inactive') try { mediaRef.current.stop() } catch (_) {}
      try { mediaRef.current.stream?.getTracks().forEach(t => t.stop()) } catch (_) {}
      mediaRef.current = null
    }
  }

  const stop = () => {
    if (stoppedRef.current) return
    stoppedRef.current = true
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null }
    if (audioCtxRef.current)  { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null }
    if (mediaRef.current) {
      if (mediaRef.current.state !== 'inactive') mediaRef.current.stop()
      mediaRef.current.stream?.getTracks().forEach(t => t.stop())
    }
    setState('processing')
  }

  const start = async () => {
    if (state !== 'idle') return
    stoppedRef.current = false

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      alert('Microphone access denied')
      return
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
    const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {})
    chunksRef.current = []
    recorder.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data)
    recorder.onstop = handleStop
    recorder.start(100)
    mediaRef.current = recorder

    // Start in "waiting" state — pulse blue, waiting for speech to begin
    setState('waiting')

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    const audioCtx = new AudioContextClass()
    audioCtxRef.current = audioCtx
    const source   = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    const pollMs      = isMobileDevice() ? 150 : 30
    let speechDetected = false
    let silenceStart   = null
    const startedAt    = Date.now()

    const tick = () => {
      if (stoppedRef.current) return
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return

      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      const now = Date.now()

      if (avg >= SPEECH_THRESHOLD) {
        // Speech detected
        if (!speechDetected) {
          speechDetected = true
          setState('recording')  // switch to red recording state
        }
        silenceStart = null
      } else {
        // Silence
        if (!speechDetected) {
          // Still waiting for speech — give up after MAX_WAIT_FOR_SPEECH_MS
          if (now - startedAt > MAX_WAIT_FOR_SPEECH_MS) {
            stop()
            return
          }
        } else {
          // Speech was detected, now silence — auto-stop after SILENCE_AFTER_SPEECH_MS
          if (!silenceStart) silenceStart = now
          else if (now - silenceStart > SILENCE_AFTER_SPEECH_MS) {
            stop()
            return
          }
        }
      }

      pollTimerRef.current = setTimeout(tick, pollMs)
    }
    pollTimerRef.current = setTimeout(tick, pollMs)
  }

  const handleStop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    try {
      const { data } = await transcribeAudio(blob, userId)
      setTranscript(data.transcript || '')
      const spoken = data.spoken_response || 'Got it!'
      const intent = data.intent || 'general_query'
      if (INTENT_ROUTES[intent]) navigate(INTENT_ROUTES[intent])
      try {
        const ar  = await speakText(spoken)
        const url = URL.createObjectURL(ar.data)
        const audio = new Audio(url)
        audio.onended = () => URL.revokeObjectURL(url)
        audio.play()
      } catch {}
    } catch (err) {
      console.error('Voice error:', err)
    } finally {
      mediaRef.current = null
      setState('idle')
      setTimeout(() => setTranscript(''), 3000)
    }
  }

  const isWaiting   = state === 'waiting'
  const isRecording = state === 'recording'
  const isActive    = isWaiting || isRecording

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2.5 z-50">

      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-2.5 rounded-xl text-sm text-slate-300 max-w-xs shadow-2xl"
            style={{
              background: 'rgba(10,10,18,0.96)',
              border: '1px solid rgba(99,102,241,0.3)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label shown while waiting */}
      <AnimatePresence>
        {isWaiting && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-slate-400"
          >
            Listening…
          </motion.p>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Pulse ring — blue when waiting, red when recording */}
        {isActive && (
          <>
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                background: isRecording ? 'rgba(239,68,68,0.22)' : 'rgba(99,102,241,0.22)',
                animationDuration: '1s',
              }}
            />
            <span
              className="absolute -inset-3 rounded-full animate-ping"
              style={{
                background: isRecording ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                animationDuration: '1.6s',
                animationDelay: '0.25s',
              }}
            />
          </>
        )}

        <motion.button
          onClick={isActive ? stop : start}
          disabled={state === 'processing'}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: isRecording
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : isWaiting
              ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
              : state === 'processing'
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: isRecording
              ? '0 0 28px rgba(239,68,68,0.55), 0 4px 16px rgba(0,0,0,0.4)'
              : '0 0 28px rgba(99,102,241,0.45), 0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {state === 'processing'
            ? <Loader2 size={22} className="text-white animate-spin" />
            : <Mic size={22} className="text-white" />}
        </motion.button>
      </div>
    </div>
  )
}