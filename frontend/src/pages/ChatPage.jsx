import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../api'
import { Send, Trash2, Bot, Loader2, Sparkles } from 'lucide-react'
import { shouldReduceEffects } from '../utils/device'

const SUGGESTIONS = [
  "How do I get my first data analyst job with no experience?",
  "Review my LinkedIn headline for Data Science roles",
  "What skills should I learn for AI/ML in 2025?",
  "How to negotiate salary as a fresher in Pune?",
  "Which companies are hiring data analysts in Bangalore?",
  "How do I cold email a recruiter on LinkedIn?",
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  const reduce = shouldReduceEffects()

  const bubble = (
    <div
      className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-slate-300'
      }`}
      style={isUser
        ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }
        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      {msg.content}
    </div>
  )

  if (reduce) {
    return (
      <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <Bot size={13} className="text-white" />
          </div>
        )}
        {bubble}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 12px rgba(99,102,241,0.35)' }}
        >
          <Bot size={13} className="text-white" />
        </div>
      )}
      {bubble}
    </motion.div>
  )
}

export default function ChatPage() {
  const [messages, setMessages]             = useState([])
  const [input, setInput]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const userId    = parseInt(localStorage.getItem('atlas_uid'))
  const reduce    = shouldReduceEffects()

  useEffect(() => { loadHistory() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' })
  }, [messages, reduce])

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const { data } = await getChatHistory(userId)
      setMessages(data.map(m => ({ role: m.role, content: m.content })))
    } catch {} finally { setHistoryLoading(false) }
  }

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const { data } = await sendChatMessage(userId, msg)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally { setLoading(false); inputRef.current?.focus() }
  }

  const clear = async () => { await clearChatHistory(userId); setMessages([]) }
  const isEmpty = messages.length === 0 && !historyLoading

  const headerStyle = {
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: reduce ? 'rgba(5,5,10,0.95)' : 'rgba(5,5,10,0.6)',
    ...(reduce ? {} : { backdropFilter: 'blur(8px)' }),
  }

  const footerStyle = {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: reduce ? 'rgba(5,5,10,0.95)' : 'rgba(5,5,10,0.6)',
    ...(reduce ? {} : { backdropFilter: 'blur(8px)' }),
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0" style={headerStyle}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
          >
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-1.5">
              ATLAS Chat
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"
                style={reduce ? {} : { animation: 'ambientPulse 2s ease-in-out infinite' }}
              />
            </h1>
            {/* MOBILE FIX: hide subtitle on mobile to save header height */}
            <p className="text-xs text-slate-500 hidden sm:block">Career assistant — jobs, skills, interviews, salary</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} className="btn-ghost text-xs py-1.5 text-slate-500 hover:text-red-400 flex items-center gap-1">
            <Trash2 size={12} /> <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 overscroll-contain">
        {historyLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="text-slate-600 animate-spin" />
          </div>
        ) : isEmpty ? (
          // MOBILE FIX: tighter empty state — smaller icon, less margin, compact suggestion list
          <div className="flex flex-col items-center justify-center min-h-full text-center max-w-lg mx-auto py-4 sm:py-8">
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-5"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 40px rgba(99,102,241,0.35)',
                ...(reduce ? {} : { animation: 'float 4s ease-in-out infinite' }),
              }}
            >
              <Sparkles size={reduce ? 22 : 28} className="text-white" />
            </div>
            <h2
              className="text-lg sm:text-xl text-white mb-1 sm:mb-2"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}
            >
              Ask ATLAS anything
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-8 leading-relaxed px-2">
              Career advice, job search, resume tips, salary guidance — anything career-related.
            </p>
            {/* MOBILE FIX: single column on mobile, scrollable, max 4 suggestions shown */}
            <div className={`w-full ${reduce ? 'flex flex-col gap-1.5' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}`}>
              {SUGGESTIONS.slice(0, reduce ? 4 : SUGGESTIONS.length).map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs text-slate-400 hover:text-white transition-colors active:bg-indigo-500/10"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 py-2">
            {messages.map((msg, i) => <Message key={`${msg.role}-${i}-${msg.content.slice(0, 20)}`} msg={msg} />)}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Bot size={13} className="text-white" />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl rounded-bl-sm"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full bg-slate-500 ${reduce ? '' : 'animate-bounce'}`}
                        style={reduce ? {} : { animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {/* MOBILE FIX: pb-safe-bottom for iOS home bar, tighter padding on mobile */}
      <div
        className="px-3 sm:px-6 py-3 sm:py-4 shrink-0"
        style={{
          ...footerStyle,
          paddingBottom: reduce ? 'max(12px, env(safe-area-inset-bottom, 12px))' : undefined,
        }}
      >
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            className="input flex-1 resize-none text-sm"
            style={{ minHeight: '44px', maxHeight: reduce ? '100px' : '120px' }}
            placeholder="Ask about jobs, resume, salary, interview prep…"
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 btn-primary p-0 self-end"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        {/* MOBILE FIX: hide hint on mobile, it takes space and isn't useful on touch */}
        <p className="text-xs text-slate-700 text-center mt-2 hidden sm:block">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
