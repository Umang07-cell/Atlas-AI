import { motion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Briefcase, FileText, MessageSquare, Bot, Zap } from 'lucide-react'
import VortexCanvas from '../components/VortexCanvas'

const FEATURES = [
  { icon: FileText,      label: 'Resume Studio',  desc: 'ATS-optimized resumes tailored to any JD in seconds. Before + after score included.', color: '#6366f1' },
  { icon: MessageSquare, label: 'Mock Interview',  desc: 'Voice AI interviewer — Priya — adapts to your level, role, and JD in real time.',       color: '#8b5cf6' },
  { icon: Briefcase,     label: 'Job Feed',        desc: 'Live listings scraped from Internshala, Unstop & JSearch. Refreshes daily.',             color: '#06b6d4' },
  { icon: Bot,           label: 'ATLAS Chat',      desc: 'Your personal career coach. Resume reviews, cold emails, interview prep — 24/7.',        color: '#10b981' },
]

export default function Landing() {

  return (
    <div style={{ minHeight: '100vh', background: '#000005', overflowX: 'hidden' }}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', height: '50vh', overflow: 'hidden' }}>
        <VortexCanvas />

        {/* Bottom fade into content */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 0%, transparent 38%, rgba(0,0,5,0.55) 62%, rgba(0,0,5,0.98) 100%)',
        }} />

        {/* ── Top nav ─────────────────────────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 32px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(140,210,255,0.3)',
              transform: 'rotate(45deg)',
              background: 'rgba(100,180,255,0.07)',
              boxShadow: '0 0 22px rgba(100,190,255,0.18), inset 0 0 12px rgba(100,190,255,0.05)',
              flexShrink: 0,
            }}>
              <span style={{
                transform: 'rotate(-45deg)',
                fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700,
                fontSize: 15, lineHeight: 1,
                background: 'linear-gradient(135deg, #c8eeff, #a0c8ff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>A</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 17, color: 'white', lineHeight: 1 }}>Atlas</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(120,190,255,0.45)', marginTop: 2 }}>AI Career OS</div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to="/login"
              style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.45)', padding: '8px 16px', textDecoration: 'none', borderRadius: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
            >Sign In</Link>
            <Link to="/signup"
              style={{
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600,
                color: 'rgba(155,225,255,0.88)', padding: '9px 22px', borderRadius: 30,
                textDecoration: 'none',
                background: 'rgba(90,180,255,0.08)', border: '1px solid rgba(90,180,255,0.22)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(90,180,255,0.16)'; e.currentTarget.style.borderColor = 'rgba(90,180,255,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(90,180,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(90,180,255,0.22)' }}
            >Get Started</Link>
          </div>
        </motion.nav>

        {/* ── Hero copy ────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 0, right: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 20px',
        }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} style={{ marginBottom: 20 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '3.5px', textTransform: 'uppercase',
              color: 'rgba(155,218,255,0.5)', border: '1px solid rgba(100,185,255,0.14)',
              borderRadius: 20, padding: '4px 16px', display: 'inline-block',
            }}>✦ AI Career Operating System</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(30px, 5.5vw, 58px)', fontWeight: 300, color: 'white', lineHeight: 1.15, letterSpacing: '-1px', margin: 0 }}
          >Land Jobs at the</motion.h1>

          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.38 }}
            style={{
              fontFamily: 'var(--font-serif)', fontSize: 'clamp(30px, 5.5vw, 58px)', fontWeight: 700,
              lineHeight: 1.15, letterSpacing: '-1px', margin: '0 0 16px',
              background: 'linear-gradient(120deg, #8ae8ff, #aac4ff, #c4b0fd)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >Speed of AI</motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.46 }}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.28)', maxWidth: 300, lineHeight: 1.85, margin: '0 0 28px' }}
          >Resume · Interviews · Jobs — Atlas handles the grind so you focus on the win.</motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.54 }}
            style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            <Link to="/signup"
              style={{
                fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                color: 'rgba(148,224,255,0.9)', background: 'rgba(90,180,255,0.08)', border: '1px solid rgba(90,180,255,0.22)',
                borderRadius: 30, padding: '11px 28px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(90,180,255,0.16)'; e.currentTarget.style.borderColor = 'rgba(90,180,255,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(90,180,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(90,180,255,0.22)' }}
            >Get Started Free <ArrowRight size={13} /></Link>

            <Link to="/login"
              style={{
                fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(255,255,255,0.35)',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 30, padding: '11px 24px', textDecoration: 'none',
              }}
            >Sign In</Link>
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section style={{ padding: '16px 32px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.45 }}
          style={{ textAlign: 'center', marginBottom: 20 }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(145,198,255,0.38)', marginBottom: 14 }}>Everything You Need</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(26px, 3.5vw, 36px)', color: 'white', letterSpacing: '-0.5px', margin: 0 }}>
            Your career, on autopilot
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {FEATURES.map(({ icon: Icon, label, desc, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.08 }}
              style={{
                padding: '32px 24px', borderRadius: 14,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                transition: 'border-color 0.3s, background 0.3s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.background = `${color}08` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}18`, border: `1px solid ${color}28`, marginBottom: 18 }}>
                <Icon size={20} style={{ color }} />
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 8, lineHeight: 1 }}>{label}</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'rgba(255,255,255,0.33)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
          style={{ textAlign: 'center', marginTop: 64 }}
        >
          <Link to="/signup"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
              color: 'white', textDecoration: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              borderRadius: 12, padding: '11px 26px',
              transition: 'box-shadow 0.25s, transform 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Sparkles size={13} /> Start For Free
          </Link>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 16, letterSpacing: '0.1em' }}>No credit card required</p>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>
          Atlas — AI Career OS · Built for the next generation of builders
        </p>
      </div>
    </div>
  )
}