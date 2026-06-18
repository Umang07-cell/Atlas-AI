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

/* ── Animated counter ─────────────────────────────────────────────── */
function Counter({ to, duration = 1.2 }) {
  const [val, setVal] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1)
      setVal(Math.round(p * to))
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card-hover flex items-center gap-4"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={17} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-white leading-none mb-0.5">
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
  }
  const color = platformColors[job.platform] || '#6366f1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className="card-hover group flex flex-col"
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="badge"
              style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
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
        onMouseEnter={e => { e.currentTarget.style.background = `${color}35` }}
        onMouseLeave={e => { e.currentTarget.style.background = `${color}20` }}
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="card-hover block p-4 group"
      style={{ borderLeft: `2px solid ${color}45` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} style={{ color }} />
        <p className="text-sm font-semibold text-white">{label}</p>
        <ChevronRight
          size={12}
          className="ml-auto text-slate-700 group-hover:text-slate-400 transition-colors"
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
  const userId      = localStorage.getItem('atlas_uid')
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono-label mb-1.5 flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: '#10b981', animation: 'ambientPulse 2s ease-in-out infinite' }}
              />
              {greeting()}
            </p>
            <h1
              className="text-3xl text-white leading-tight mb-2"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}
            >
              {user.name || 'Hey there'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-purple">{user.domain || 'Data Analytics'}</span>
              <span className="badge-mono capitalize">
                {user.experience_level || 'fresher'}
              </span>
              {user.location && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={10} />{user.location}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="btn-ghost shrink-0"
          >
            <RefreshCw size={13} className={scraping ? 'animate-spin' : ''} />
            {scraping ? 'Scraping…' : 'Refresh'}
          </button>
        </div>
      </motion.div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Target}    label="Domain"     value={user.domain?.split(' ')[0] || 'Data'} color="#6366f1" delay={0.05} />
        <StatCard icon={MapPin}    label="Location"   value={user.location || 'India'} color="#8b5cf6" delay={0.1} />
        <StatCard icon={Award}     label="Level"      value={(user.experience_level || 'Fresher').charAt(0).toUpperCase() + (user.experience_level || 'fresher').slice(1)} color="#06b6d4" delay={0.15} />
        <StatCard icon={TrendingUp} label="Skills"    value={skills.length || 0} color="#10b981" delay={0.2} animate />
      </div>

      {/* ── Skills ─────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.32 }}
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
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.28 + i * 0.04, duration: 0.22 }}
                className="badge-purple"
              >
                {s}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── AI Command banner ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mb-8 p-4 rounded-2xl flex items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
          border: '1px solid rgba(99,102,241,0.22)',
          boxShadow: '0 0 40px rgba(99,102,241,0.08)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
        >
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">ATLAS is ready for your next move</p>
          <p className="text-xs text-slate-400 mt-0.5">Ask anything about your career, resume, or next steps</p>
        </div>
        <Link to="/chat" className="btn-primary shrink-0 text-xs">
          <Sparkles size={12} /> Ask ATLAS
        </Link>
      </motion.div>

      {/* ── Top 3 jobs ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase size={13} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Today's Top Jobs</h2>
          </div>
          <Link to="/jobs" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
            View all <ChevronRight size={11} />
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 skeleton rounded-2xl" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {jobs.map((job, i) => (
              <JobCard key={job.id} job={job} delay={0.05 * i} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-14">
            <Briefcase size={36} className="mx-auto mb-3 text-slate-700" />
            <p className="text-slate-400 text-sm mb-4">No jobs loaded yet</p>
            <button onClick={handleScrape} className="btn-primary mx-auto">
              <Zap size={13} /> Fetch Jobs Now
            </button>
          </div>
        )}
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickCard
          label="Tailor Resume"
          desc="ATS optimize for any JD"
          href="/resume"
          color="#6366f1"
          icon={Zap}
          delay={0.35}
        />
        <QuickCard
          label="Mock Interview"
          desc="Voice AI practice session"
          href="/interview"
          color="#8b5cf6"
          icon={Sparkles}
          delay={0.4}
        />
        <QuickCard
          label="Ask ATLAS"
          desc="Career advice & guidance"
          href="/chat"
          color="#06b6d4"
          icon={Bot}
          delay={0.45}
        />
      </div>
    </div>
  )
}
