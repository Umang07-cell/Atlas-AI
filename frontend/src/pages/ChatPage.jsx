import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { sendChatMessage, getChatHistory, clearChatHistory } from '../api'
import { Send, Trash2, Bot, Loader2, Sparkles } from 'lucide-react'
const SUGGESTIONS = [
  "How do I get my first job with no experience?",
  "Review my LinkedIn headline for Data Science roles",
  "What skills should I learn for AI/ML in 2025?",
  "How to negotiate salary as a fresher in Pune?",
  "Which companies are hiring data analysts in Bangalore?",
  "How do I cold email a recruiter on LinkedIn?",
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
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
  const [messages, setMessages]         = useState([])
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const userId    = parseInt(localStorage.getItem('atlas_uid'))
  useEffect(() => { loadHistory() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    background: 'rgba(5,5,10,0.6)',
    backdropFilter: 'blur(8px)',
  }

  const footerStyle = {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(5,5,10,0.6)',
    backdropFilter: 'blur(8px)',
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between shrink-0" style={headerStyle}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
          >
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-1.5">
              ATLAS Chat
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"
                style={{ animation: 'ambientPulse 2s ease-in-out infinite' }}
              />
            </h1>
            <p className="text-xs text-slate-500">Career assistant — jobs, skills, interviews, salary</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} className="btn-ghost text-xs py-1.5 text-slate-500 hover:text-red-400">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 overscroll-contain">
        {historyLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="text-slate-600 animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-full text-center max-w-lg mx-auto py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 40px rgba(99,102,241,0.35)',
                animation: 'float 4s ease-in-out infinite',
              }}
            >
              <Sparkles size={28} className="text-white" />
            </div>
            <h2
              className="text-xl text-white mb-2"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}
            >
              Ask ATLAS anything
            </h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Career advice, job search, resume tips, salary guidance — anything career-related.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3 rounded-xl text-xs text-slate-400 hover:text-white transition-colors active:bg-indigo-500/10"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-5 py-2">
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
                        className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
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
      <div className="px-4 sm:px-6 py-4 shrink-0 safe-bottom" style={footerStyle}>
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            className="input flex-1 resize-none text-sm"
            style={{ minHeight: '44px', maxHeight: '120px' }}
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
        <p className="text-xs text-slate-700 text-center mt-2 hidden sm:block">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}