import { motion } from 'framer-motion'
import { ExternalLink, Building2, MapPin, Calendar } from 'lucide-react'

const PLATFORM_COLORS = {
  internshala: '#6366f1',
  naukri:      '#f59e0b',
  unstop:      '#10b981',
  linkedin:    '#0ea5e9',
}

export default function JobCard({ job, onAction, index = 0 }) {
  const color    = PLATFORM_COLORS[job.platform] || '#6366f1'
  const matchPct = job.match_score != null
    ? (job.match_score > 1 ? job.match_score : Math.round(job.match_score * 100))
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="card-hover group relative flex flex-col"
    >
      {/* Platform accent top line */}
      <div
        className="absolute top-0 left-4 right-4 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
      />

      <div className="flex items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="badge"
              style={{ background: `${color}15`, color, border: `1px solid ${color}22` }}
            >
              {job.platform}
            </span>
            {matchPct != null && (
              <span className="badge-green">{matchPct}% match</span>
            )}
          </div>
          <h3 className="font-semibold text-white text-sm leading-snug">{job.title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Building2 size={10} className="text-slate-600" />
            <span className="text-xs text-slate-400">{job.company}</span>
          </div>
        </div>
      </div>

      {job.match_reason && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed italic">
          {job.match_reason}
        </p>
      )}

      <div className="flex flex-wrap gap-2.5 text-xs text-slate-500 mb-4">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={9} />{job.location}</span>
        )}
        {job.stipend_salary && <span>💰 {job.stipend_salary}</span>}
        {job.posted_date && (
          <span className="flex items-center gap-1"><Calendar size={9} />{job.posted_date}</span>
        )}
      </div>

      <a
        href={job.apply_link}
        target="_blank"
        rel="noreferrer"
        onClick={() => onAction?.('applied', job)}
        className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
        style={{ background: `${color}1A`, border: `1px solid ${color}28` }}
        onMouseEnter={e => {
          e.currentTarget.style.background = `${color}30`
          e.currentTarget.style.borderColor = `${color}50`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = `${color}1A`
          e.currentTarget.style.borderColor = `${color}28`
        }}
      >
        <ExternalLink size={12} /> Apply Now
      </a>
    </motion.div>
  )
}
