/**
 * useInterviewVoice — fully automatic voice interview loop
 *
 * Flow: speak(text) → play audio → mic opens → silence detected → transcribe → onTranscript(text) → repeat
 *
 * Design decisions:
 * - ALL mutable state that needs to be read inside async callbacks is kept in refs.
 *   React state is only used for UI re-renders (turnState, liveTranscript).
 * - speak() and startRecording() do NOT depend on each other via useCallback deps.
 *   Instead, startRecording is stored in a ref so speak() can call it without stale closures.
 * - No Web Speech API. STT is Whisper via /voice/transcribe/interview.
 * - No fixed timers for silence. AudioContext AnalyserNode detects actual silence.
 *
 * FIX (mobile freeze): poll timer was stored on mediaRecorderRef._pollTimer — a property
 * that could be overwritten or lost. It's now in a dedicated pollTimerRef so stopRecording()
 * always cancels it before AudioContext.close(), preventing orphaned tick() loops that
 * compete with the UI thread and freeze the page on mobile.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { speakText, transcribeInterviewAudio } from '../api'
import { isMobileDevice } from '../utils/device'

const SILENCE_THRESHOLD = 8
const MIN_SPEECH_MS     = 600
const SILENCE_STOP_MS   = 1500
const MAX_RECORDING_MS  = 90_000

export default function useInterviewVoice({ onTranscript, disabled = false, autoListen = false }) {
  const [turnState, setTurnState]       = useState('idle')
  const [liveTranscript, setLiveTranscript] = useState('')

  const autoListenRef    = useRef(autoListen)
  const disabledRef      = useRef(disabled)
  const onTranscriptRef  = useRef(onTranscript)
  const speakingRef      = useRef(false)
  const recordingRef     = useRef(false)

  const mediaRecorderRef = useRef(null)
  const streamRef        = useRef(null)
  const audioCtxRef      = useRef(null)
  const chunksRef        = useRef([])
  // FIX: dedicated ref for poll timer — never lost or overwritten
  const pollTimerRef     = useRef(null)

  const startRecordingRef = useRef(null)

  useEffect(() => { autoListenRef.current   = autoListen  }, [autoListen])
  useEffect(() => { disabledRef.current     = disabled    }, [disabled])
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])

  const _releaseAudioCtx = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
  }

  const _releaseStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const stopRecording = useCallback(() => {
    recordingRef.current = false

    // FIX: cancel the tick() loop BEFORE closing AudioContext
    // Previously this used mediaRecorderRef._pollTimer which could be lost
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    _releaseAudioCtx()
    _releaseStream()
  }, [])

  const startRecording = useCallback(async () => {
    if (disabledRef.current || speakingRef.current || recordingRef.current) return

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      setTurnState('idle')
      alert('Microphone access denied. Please allow microphone access to continue.')
      return
    }

    streamRef.current = stream
    recordingRef.current = true

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      _releaseAudioCtx()
      _releaseStream()

      if (chunksRef.current.length === 0) {
        setTurnState('idle')
        return
      }

      setTurnState('processing')
      try {
        const blob   = new Blob(chunksRef.current, { type: mimeType })
        const userId = parseInt(localStorage.getItem('atlas_uid') || '0', 10)
        const { data } = await transcribeInterviewAudio(blob, userId)
        const text = (data.transcript || '').trim()
        if (text) {
          setLiveTranscript(text)
          if (onTranscriptRef.current) {
            await onTranscriptRef.current(text)
          }
        } else {
          setTurnState('idle')
          if (autoListenRef.current && !disabledRef.current) {
            setTimeout(() => startRecordingRef.current?.(), 400)
          }
        }
      } catch (err) {
        console.error('[useInterviewVoice] transcription error:', err)
        setTurnState('idle')
      }
    }

    // AudioContext silence detection
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 1024
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const freqData      = new Uint8Array(analyser.frequencyBinCount)
    let speechDetected  = false
    let speechStartTime = 0
    let lastVoiceTime   = Date.now()
    const recordStart   = Date.now()

    recorder.start(100)
    setTurnState('listening')

    const pollMs = isMobileDevice() ? 120 : 16

    const tick = () => {
      // FIX: check recordingRef and audioCtxRef before every tick
      // Without this, the loop survives stopRecording() on mobile
      if (!recordingRef.current) return
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return

      analyser.getByteFrequencyData(freqData)
      const rms = freqData.reduce((a, b) => a + b, 0) / freqData.length
      const now = Date.now()

      if (rms > SILENCE_THRESHOLD) {
        if (!speechDetected) { speechDetected = true; speechStartTime = now }
        lastVoiceTime = now
      }

      const elapsed      = now - recordStart
      const silenceDur   = now - lastVoiceTime
      const speechDur    = speechDetected ? (lastVoiceTime - speechStartTime) : 0
      const spokenEnough = speechDetected && speechDur >= MIN_SPEECH_MS

      if ((spokenEnough && silenceDur >= SILENCE_STOP_MS) || elapsed >= MAX_RECORDING_MS) {
        stopRecording()
        return
      }

      // FIX: store in dedicated pollTimerRef
      pollTimerRef.current = setTimeout(tick, pollMs)
    }

    pollTimerRef.current = setTimeout(tick, pollMs)
  }, [stopRecording])

  useEffect(() => {
    startRecordingRef.current = startRecording
  }, [startRecording])

  const speak = useCallback(async (text) => {
    if (!text?.trim()) return

    stopRecording()
    speakingRef.current = true
    setTurnState('speaking')
    setLiveTranscript('')

    try {
      const res = await speakText(text)
      const url = URL.createObjectURL(res.data)
      await new Promise((resolve) => {
        const audio = new Audio(url)
        audio.onended = () => { URL.revokeObjectURL(url); resolve() }
        audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
        audio.play().catch(() => resolve())
      })
    } catch (err) {
      console.warn('[useInterviewVoice] TTS failed, falling back to browser speech:', err)
      await new Promise((resolve) => {
        if (!window.speechSynthesis) { resolve(); return }
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 0.92
        u.onend  = resolve
        u.onerror = resolve
        window.speechSynthesis.speak(u)
      })
    } finally {
      speakingRef.current = false
      setTurnState('idle')
      if (autoListenRef.current && !disabledRef.current) {
        setTimeout(() => startRecordingRef.current?.(), 300)
      }
    }
  }, [stopRecording])

  // Cleanup on unmount — kills any live recording when navigating away
  useEffect(() => {
    return () => {
      stopRecording()
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [stopRecording])

  return {
    turnState,
    liveTranscript,
    speak,
    startListening:  startRecording,
    stopListening:   stopRecording,
    stopSpeaking: () => {
      speakingRef.current = false
      if (window.speechSynthesis) window.speechSynthesis.cancel()
      setTurnState('idle')
    },
    isSpeaking:   turnState === 'speaking',
    isListening:  turnState === 'listening',
    isProcessing: turnState === 'processing',
  }
}