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
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { speakText, transcribeInterviewAudio } from '../api'

const SILENCE_THRESHOLD = 8       // RMS below this = silence
const MIN_SPEECH_MS = 600          // must detect voice for at least this long before silence matters
const SILENCE_STOP_MS = 1500       // 1.5 s of silence after speech ends the recording
const MAX_RECORDING_MS = 90_000    // safety cap

export default function useInterviewVoice({ onTranscript, disabled = false, autoListen = false }) {
  const [turnState, setTurnState] = useState('idle')   // 'idle' | 'speaking' | 'listening' | 'processing'
  const [liveTranscript, setLiveTranscript] = useState('')

  // ── refs that must never go stale inside async closures ──
  const autoListenRef  = useRef(autoListen)
  const disabledRef    = useRef(disabled)
  const onTranscriptRef = useRef(onTranscript)
  const speakingRef    = useRef(false)
  const recordingRef   = useRef(false)

  // MediaRecorder / AudioContext handles
  const mediaRecorderRef = useRef(null)
  const streamRef        = useRef(null)
  const audioCtxRef      = useRef(null)
  const chunksRef        = useRef([])

  // Ref to startRecording so speak() can call the latest version without dep issues
  const startRecordingRef = useRef(null)

  useEffect(() => { autoListenRef.current  = autoListen  }, [autoListen])
  useEffect(() => { disabledRef.current    = disabled    }, [disabled])
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])

  // ── CLEANUP helpers ──
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()   // triggers onstop → transcription
    }
    _releaseAudioCtx()
    _releaseStream()
  }, [])

  // ── CORE: start recording + silence detection ──
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
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const userId = parseInt(localStorage.getItem('atlas_uid') || '0', 10)
        const { data } = await transcribeInterviewAudio(blob, userId)
        const text = (data.transcript || '').trim()
        if (text) {
          setLiveTranscript(text)
          if (onTranscriptRef.current) {
            // onTranscript is async and will call speak() for the next question.
            // speak() will trigger startRecording again via autoListen when done.
            await onTranscriptRef.current(text)
          }
        } else {
          // nothing heard — re-open mic immediately if still in interview
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

    // ── AudioContext silence detection ──
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 1024
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const freqData = new Uint8Array(analyser.frequencyBinCount)

    let speechDetected = false
    let speechStartTime = 0
    let lastVoiceTime = Date.now()
    const recordStartTime = Date.now()

    recorder.start(100)
    setTurnState('listening')

    const tick = () => {
      if (!recordingRef.current) return

      analyser.getByteFrequencyData(freqData)
      const rms = freqData.reduce((a, b) => a + b, 0) / freqData.length

      const now = Date.now()

      if (rms > SILENCE_THRESHOLD) {
        if (!speechDetected) {
          speechDetected = true
          speechStartTime = now
        }
        lastVoiceTime = now
      }

      const elapsed      = now - recordStartTime
      const silenceDur   = now - lastVoiceTime
      const speechDur    = speechDetected ? (lastVoiceTime - speechStartTime) : 0
      const spokenEnough = speechDetected && speechDur >= MIN_SPEECH_MS

      if ((spokenEnough && silenceDur >= SILENCE_STOP_MS) || elapsed >= MAX_RECORDING_MS) {
        stopRecording()
        return
      }

      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [stopRecording])

  // Keep ref current so speak()'s closure can always call the latest startRecording
  useEffect(() => {
    startRecordingRef.current = startRecording
  }, [startRecording])

  // ── SPEAK: play TTS audio, then auto-open mic ──
  const speak = useCallback(async (text) => {
    if (!text?.trim()) return

    // Stop any active recording before we speak
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
      console.warn('[useInterviewVoice] TTS backend failed, falling back to browser speech:', err)
      // Browser speechSynthesis as last resort
      await new Promise((resolve) => {
        if (!window.speechSynthesis) { resolve(); return }
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.rate = 0.92
        u.onend = resolve
        u.onerror = resolve
        window.speechSynthesis.speak(u)
      })
    } finally {
      speakingRef.current = false
      setTurnState('idle')
      // After speaking, auto-open mic if still in interview mode
      if (autoListenRef.current && !disabledRef.current) {
        setTimeout(() => startRecordingRef.current?.(), 300)
      }
    }
  }, [stopRecording])
  // NOTE: speak does NOT list startRecording as a dep — it uses startRecordingRef
  // to avoid stale closures when startRecording is recreated.

  // Cleanup on unmount
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