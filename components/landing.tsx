'use client'

// One-screen landing page shown at / to signed-out visitors.
// Built like a noticeboard: the pitch on the left, real open gigs
// pinned on the right. Signed-in users never see it.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, type Gig, type Stats } from '@/lib/api'

const TILTS = ['-1.3deg', '1deg', '-0.6deg']
const PINS = ['#e96955', '#0d6e63', '#e9a13b']
const AVATAR_BG = ['#f6d9d4', '#d7e8e2', '#f3e5c8', '#dde3f5']

function payText(g: Gig) {
  if (g.payment_type === 'Paid') return g.budget ? `PKR ${Number(g.budget).toLocaleString('en-US')}` : 'Paid'
  return g.payment_type === 'SkillSwap' ? 'Skill swap' : 'Free'
}

function dueText(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])

  useEffect(() => {
    api.stats().then(setStats).catch(() => {})
    api.gigs({ status: 'Open' }).then((all) => setGigs(all.slice(0, 2))).catch(() => {})
  }, [])

  const moreOpen = stats ? Math.max(0, stats.open_gigs - gigs.length) : 0

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="auth-brand">
          <img src="/logo.png" alt="campusloop logo" className="brand-logo" />
          <span>campus<span className="brand-accent">loop</span></span>
        </div>
        <nav>
          <Link className="landing-signin" href="/login">Sign in</Link>
          <Link className="landing-cta-sm" href="/signup">Create account</Link>
        </nav>
      </header>

      <div className="landing-main">
        <main className="landing-copy">
          <h1>Skip the group chat.<br />Post it on the <span className="hl">board</span>.</h1>
          <p className="landing-sub">
            Every semester the same requests drown in class group chats — notes before a quiz,
            someone to explain Python, a poster needed by Friday. campusloop puts them on one
            board instead: post a gig with a budget in PKR, pick an applicant, and review each
            other when the work is done.
          </p>
          <div className="landing-actions">
            <Link className="landing-cta" href="/signup">Get started</Link>
            <Link className="landing-cta-ghost" href="/login">Try a demo account</Link>
          </div>
          <p className="landing-steps">
            <span>Post a gig</span><i>→</i><span>Get applications</span><i>→</i><span>Accept one</span><i>→</i><span>Leave a review</span>
          </p>
        </main>

        <section className="board" aria-label="Open gigs">
          <div className="board-head">
            <h2>On the board right now</h2>
            <span className="board-live"><span className="live-dot" />Live</span>
          </div>
          {gigs.map((g, i) => (
            <article key={g.id} className="board-card" style={{ '--tilt': TILTS[i % TILTS.length] } as React.CSSProperties}>
              <span className="board-pin" style={{ background: PINS[i % PINS.length] }} />
              <div className="board-card-top">
                <span className={`type-label type-${g.type.toLowerCase()}`}>{g.type === 'Offering' ? 'Offering help' : 'Looking for help'}</span>
                <span className="board-due">{dueText(g.deadline)}</span>
              </div>
              <h3>{g.title}</h3>
              <p className="board-desc">{g.description}</p>
              <div className="board-card-foot">
                <span className="board-person">
                  <span className="board-avatar" style={{ background: AVATAR_BG[g.user_id % AVATAR_BG.length] }}>{initials(g.owner_name)}</span>
                  {g.owner_name} · {g.owner_major}
                </span>
                <strong className="board-pay">{payText(g)}</strong>
              </div>
            </article>
          ))}
          {gigs.length > 0 && (
            <Link className="board-more" href="/login">
              {moreOpen > 0 ? `…and ${moreOpen} more open gigs — sign in to browse them all` : 'Sign in to browse all open gigs'} →
            </Link>
          )}
        </section>
      </div>

      <footer className="landing-foot">campusloop — a campus community project · Programming · Design · Writing · Tutoring</footer>
    </div>
  )
}
