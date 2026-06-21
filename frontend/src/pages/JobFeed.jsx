import { useEffect, useState } from 'react'
import { getJobFeed, scrapeJobs } from '../api'
import {
  Search, RefreshCw, ExternalLink, MapPin,
  Building2, Zap, Calendar,
} from 'lucide-react'

const PLATFORMS = ['All', 'internshala', 'unstop', 'jsearch']
const PLATFORM_COLORS = {
  internshala: '#6366f1',
  unstop: '#10b981',
  jsearch: '#f59e0b',
}
const PAGE_SIZE = 12

function JobCard({ job }) {
  const color = PLATFORM_COLORS[job.platform] || '#6366f1'
  return (
    <div className="card-hover group flex flex-col">
      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="badge" style={{ background: `${color}15`, color, border: `1px solid ${color}22` }}>
              {job.platform}
            </span>
            {job.match_score && <span className="badge-green">{job.match_score}% match</span>}
          </div>
          <h3 className="font-semibold text-white leading-snug text-sm">{job.title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Building2 size={10} className="text-slate-600" />
            <span className="text-xs text-slate-400">{job.company}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 text-xs text-slate-500 mb-4">
        {job.location && <span className="flex items-center gap-1"><MapPin size={9} />{job.location}</span>}
        {job.stipend_salary && <span>💰 {job.stipend_salary}</span>}
        {job.posted_date && <span className="flex items-center gap-1"><Calendar size={9} />{job.posted_date}</span>}
      </div>

      {job.description && (
        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{job.description}</p>
      )}

      <a
        href={job.apply_link}
        target="_blank"
        rel="noreferrer"
        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
        style={{ background: `${color}1A`, border: `1px solid ${color}28` }}
        onMouseEnter={e => { e.currentTarget.style.background = `${color}30` }}
        onMouseLeave={e => { e.currentTarget.style.background = `${color}1A` }}
      >
        <ExternalLink size={12} /> Apply Now
      </a>
    </div>
  )
}

export default function JobFeed() {
  const [jobs, setJobs]         = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading]   = useState(true)
  const [scraping, setScraping] = useState(false)
  const [search, setSearch]     = useState('')
  const [platform, setPlatform] = useState('All')
  const [page, setPage]         = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getJobFeed()
      setJobs(data); setFiltered(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let result = jobs
    if (platform !== 'All') result = result.filter(j => j.platform === platform)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
    setPage(1)
  }, [search, platform, jobs])

  const handleScrape = async () => {
    setScraping(true)
    try { await scrapeJobs(); await load() }
    finally { setScraping(false) }
  }

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paginated.length < filtered.length

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="mono-label mb-1.5">Live Listings</p>
          <h1 className="text-2xl text-white mb-1" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700 }}>
            Job Feed
          </h1>
          <p className="text-xs text-slate-500">Internshala · Unstop · JSearch — last 7 days</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleScrape} disabled={scraping} className="btn-primary">
            <Zap size={13} />
            {scraping ? 'Scraping…' : 'Fetch Fresh'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9 text-sm w-full"
            placeholder="Search role, company, location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                platform === p ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={platform === p ? { background: 'rgba(99,102,241,0.2)', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.25)' } : {}}>
              {p === 'All' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="mono-label mb-4">{filtered.length} listings found</p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-56 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Zap size={44} className="mx-auto mb-4 text-slate-700" />
          <p className="text-slate-400 mb-4 text-sm">No jobs found. Try fetching fresh listings.</p>
          <button onClick={handleScrape} className="btn-primary mx-auto"><Zap size={13} /> Fetch Jobs</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(job => <JobCard key={job.id} job={job} />)}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button onClick={() => setPage(p => p + 1)} className="btn-ghost">
                Load more ({filtered.length - paginated.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}