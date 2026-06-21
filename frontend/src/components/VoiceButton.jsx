import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader2 } from 'lucide-react'
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

export default function VoiceButton() {
  const [state, setState]           = useState('idle')
  const [transcript, setTranscript] = useState('')
  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const audioCtxRef = useRef(null)   // FIX: track AudioContext in a ref
  const pollTimerRef = useRef(null)  // FIX: track poll timer in a ref
  const stoppedRef  = useRef(false)  // FIX: guard against double-stop
  const navigate    = useNavigate()
  const userId      = localStorage.getItem('atlas_uid')

  // FIX: clean up AudioContext + poll timer + stream on unmount (navigation away)
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    // Clear the silence-detection poll loop first
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
    // Close AudioContext
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    // Stop MediaRecorder + stream tracks
    if (mediaRef.current) {
      if (mediaRef.current.state !== 'inactive') {
        try { mediaRef.current.stop() } catch (_) {}
      }
      try {
        mediaRef.current.stream?.getTracks().forEach(t => t.stop())
      } catch (_) {}
      mediaRef.current = null
    }
  }

  const start = async () => {
    if (state !== 'idle') return
    stoppedRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/ogg'
      const recorder = new MediaRecorder(
        stream,
        MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {}
      )
      chunksRef.current = []
      recorder.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data)
      recorder.onstop = handleStop
      recorder.start(100)
      mediaRef.current = recorder
      setState('recording')

      // AudioContext silence detection
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioContextClass()
      audioCtxRef.current = audioCtx  // FIX: store in ref so cleanup() can reach it

      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      let silenceStart = null
      const pollMs = isMobileDevice() ? 150 : 16

      const checkSilence = () => {
        // FIX: exit immediately if manually stopped already
        if (stoppedRef.current) return

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return

        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        if (avg < 8) {
          if (!silenceStart) silenceStart = Date.now()
          else if (Date.now() - silenceStart > 1800) {
            stop()  // auto-stop on silence
            return
          }
        } else {
          silenceStart = null
        }
        // FIX: store timer in ref so cleanup() can cancel it
        pollTimerRef.current = setTimeout(checkSilence, pollMs)
      }
      pollTimerRef.current = setTimeout(checkSilence, pollMs)

    } catch {
      alert('Microphone access denied')
    }
  }

  const stop = () => {
    // FIX: debounce — prevent double-fire from simultaneous manual click + silence timer
    if (stoppedRef.current) return
    stoppedRef.current = true

    // Cancel the silence poll loop immediately
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }

    // Close AudioContext
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }

    // Stop recorder + stream
    if (mediaRef.current) {
      if (mediaRef.current.state !== 'inactive') {
        mediaRef.current.stop()
      }
      mediaRef.current.stream?.getTracks().forEach(t => t.stop())
    }

    setState('processing')
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
        audio.onended = () => URL.revokeObjectURL(url)  // FIX: revoke URL after playback
        audio.play()
      } catch {}
    } catch (err) {
      console.error('Voice error:', err)
    } finally {
      mediaRef.current = null  // FIX: clear ref after stop
      setState('idle')
      setTimeout(() => setTranscript(''), 3000)
    }
  }

  const isRecording = state === 'recording'

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2.5 z-50">
      {/* Transcript tooltip */}
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

      {/* Mic button */}
      <div className="relative">
        {/* Pulse rings when recording */}
        {isRecording && (
          <>
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: 'rgba(239,68,68,0.22)', animationDuration: '1s' }}
            />
            <span
              className="absolute -inset-3 rounded-full animate-ping"
              style={{ background: 'rgba(239,68,68,0.1)', animationDuration: '1.6s', animationDelay: '0.25s' }}
            />
          </>
        )}

        <motion.button
          onClick={isRecording ? stop : start}
          disabled={state === 'processing'}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: isRecording
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
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
            : isRecording
            ? <MicOff size={22} className="text-white" />
            : <Mic size={22} className="text-white" />}
        </motion.button>
      </div>
    </div>
  )
}