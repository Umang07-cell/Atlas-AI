import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { getProfile, getTop3Jobs, scrapeJobs } from '../api'
import {
  Briefcase, RefreshCw, ExternalLink, MapPin,
  Building2, Calendar, Zap, TrendingUp, Target,
  Award, Sparkles, ChevronRight, Bot,
} from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease },
})

/* ── Animated counter ─────────────────────────────────────────────── */
function Counter({ to, duration = 1.4 }) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * to))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration])
  return <>{val}</>
}

/* ── Stat card ─────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, delay = 0, animate = false }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="card-hover flex items-center gap-4"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* subtle glow behind icon */}
      <div style={{
        position: 'absolute', top: -20, left: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: `${color}18`, filter: 'blur(20px)', pointerEvents: 'none',
      }} />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}35` }}
      >
        <Icon size={17} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-white leading-none mb-0.5 truncate">
          {animate && typeof value === 'number'
            ? <Counter to={value} />
            : value}
        </p>
        <p className="mono-label">{label}</p>
      </div>
    </motion.div>
  )
}

/* ── Dashboard job card ─────────────────────────────────────────────── */
function JobCard({ job, delay = 0 }) {
  const platformColors = {
    internshala: '#6366f1',
    naukri: '#f59e0b',
    unstop: '#10b981',
    linkedin: '#0ea5e9',
    jsearch: '#8b5cf6',
  }
  const color = platformColors[job.platform] || '#6366f1'

  return (
    <motion.div
      {...fadeUp(delay)}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card-hover group flex flex-col"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* glow accent top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
      }} />

      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="badge"
              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
            >
              {job.platform}
            </span>
            {job.match_score && (
              <span className="badge-green">{job.match_score}% match</span>
            )}
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug">{job.title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Building2 size={10} className="text-slate-600" />
            <span className="text-xs text-slate-400">{job.company}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin size={9} />{job.location}
          </span>
        )}
        {job.stipend_salary && <span>💰 {job.stipend_salary}</span>}
        {job.posted_date && (
          <span className="flex items-center gap-1">
            <Calendar size={9} />{job.posted_date}
          </span>
        )}
      </div>

      <a
        href={job.apply_link}
        target="_blank"
        rel="noreferrer"
        className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium text-white transition-all"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}
        onMouseEnter={e => { e.currentTarget.style.background = `${color}40`; e.currentTarget.style.boxShadow = `0 4px 16px ${color}30` }}
        onMouseLeave={e => { e.currentTarget.style.background = `${color}20`; e.currentTarget.style.boxShadow = 'none' }}
      >
        <ExternalLink size={11} /> Apply Now
      </a>
    </motion.div>
  )
}

/* ── Quick action card ───────────────────────────────────────────────── */
function QuickCard({ label, desc, href, color, icon: Icon, delay }) {
  return (
    <motion.a
      href={href}
      {...fadeUp(delay)}
      whileHover={{ y: -3, boxShadow: `0 8px 30px ${color}20`, transition: { duration: 0.2 } }}
      className="card-hover block p-4 group"
      style={{ borderLeft: `2px solid ${color}55` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={12} style={{ color }} />
        </div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <ChevronRight
          size={12}
          className="ml-auto text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all"
        />
      </div>
      <p className="text-xs text-slate-500">{desc}</p>
    </motion.a>
  )
}

/* ── Main Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const [profile, setProfile]   = useState(null)
  const [jobs, setJobs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [scraping, setScraping] = useState(false)
  const userId       = localStorage.getItem('atlas_uid')
  const localProfile = JSON.parse(localStorage.getItem('atlas_profile') || '{}')

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, jRes] = await Promise.allSettled([
        getProfile(userId), getTop3Jobs(),
      ])
      if (pRes.status === 'fulfilled') setProfile(pRes.value.data)
      if (jRes.status === 'fulfilled') setJobs(jRes.value.data)
    } finally { setLoading(false) }
  }

  const handleScrape = async () => {
    setScraping(true)
    try { await scrapeJobs(); await load() }
    finally { setScraping(false) }
  }

  useEffect(() => { load() }, [])

  const user = profile || localProfile

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const skills = profile?.skills || []

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono-label mb-1.5 flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: '#10b981', animation: 'ambientPulse 2s ease-in-out infinite' }}
              />
              {greeting()}
            </p>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease }}
              className="text-3xl text-white leading-tight mb-2"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}
            >
              {user.name || 'Hey there'}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="badge-purple">{user.domain || 'Data Analytics'}</span>
              <span className="badge-mono capitalize">
                {user.experience_level || 'fresher'}
              </span>
              {user.location && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={10} />{user.location}
                </span>
              )}
            </motion.div>
          </div>
          <motion.button
            onClick={handleScrape}
            disabled={scraping}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn-ghost shrink-0"
          >
            <RefreshCw size={13} className={scraping ? 'animate-spin' : ''} />
            {scraping ? 'Scraping…' : 'Refresh'}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Target}     label="Domain"   value={user.domain || 'Data Analytics'} color="#6366f1" delay={0.08} />
        <StatCard icon={MapPin}     label="Location" value={user.location || 'India'}        color="#8b5cf6" delay={0.13} />
        <StatCard icon={Award}      label="Level"    value={(user.experience_level || 'Fresher').charAt(0).toUpperCase() + (user.experience_level || 'fresher').slice(1)} color="#06b6d4" delay={0.18} />
        <StatCard icon={TrendingUp} label="Skills"   value={skills.length || 0}              color="#10b981" delay={0.23} animate />
      </div>

      {/* ── Skills ─────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <motion.div
          {...fadeUp(0.28)}
          className="card-elevated mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={13} className="text-indigo-400" />
            <span className="text-sm font-semibold text-white">Your Skills</span>
            <span className="badge-mono ml-auto">{skills.length} total</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, scale: 0.8, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.025, duration: 0.25, ease }}
                whileHover={{ scale: 1.08, transition: { duration: 0.15 } }}
                className="badge-purple cursor-default"
                style={{ display: 'inline-block' }}
              >
                {s}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── AI Command banner ─────────────────────────────────── */}
      <motion.div
        {...fadeUp(0.33)}
        className="mb-8 p-4 rounded-2xl flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
          border: '1px solid rgba(99,102,241,0.22)',
          boxShadow: '0 0 40px rgba(99,102,241,0.08)',
          animation: 'float 5s ease-in-out infinite',
        }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
        >
          <Bot size={18} className="text-white" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">ATLAS is ready for your next move</p>
          <p className="text-xs text-slate-400 mt-0.5">Ask anything about your career, resume, or next steps</p>
        </div>
        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
          <Link to="/chat" className="btn-primary shrink-0 text-xs">
            <Sparkles size={12} /> Ask ATLAS
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Top 3 jobs ─────────────────────────────────────────── */}
      <div className="mb-8">
        <motion.div {...fadeUp(0.35)} className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase size={13} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Today's Top Jobs</h2>
          </div>
          <Link to="/jobs" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group">
            View all <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 skeleton rounded-2xl" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {jobs.map((job, i) => (
              <JobCard key={job.id} job={job} delay={0.08 * i} />
            ))}
          </div>
        ) : (
          <motion.div {...fadeUp(0.4)} className="card text-center py-14">
            <Briefcase size={36} className="mx-auto mb-3 text-slate-700" />
            <p className="text-slate-400 text-sm mb-4">No jobs loaded yet</p>
            <button onClick={handleScrape} className="btn-primary mx-auto">
              <Zap size={13} /> Fetch Jobs Now
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickCard label="Tailor Resume"  desc="ATS optimize for any JD"      href="/resume"    color="#6366f1" icon={Zap}      delay={0.38} />
        <QuickCard label="Mock Interview" desc="Voice AI practice session"     href="/interview" color="#8b5cf6" icon={Sparkles} delay={0.43} />
        <QuickCard label="Ask ATLAS"      desc="Career advice & guidance"      href="/chat"      color="#06b6d4" icon={Bot}      delay={0.48} />
      </div>

    </div>
  )
}