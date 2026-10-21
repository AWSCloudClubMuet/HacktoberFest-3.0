'use client'

// One-screen landing page shown at / to signed-out visitors.
// Built like a noticeboard: the pitch on the left, two example gigs
// pinned on the right (hardcoded — the board is illustrative; the real
// board is behind sign-in). Signed-in users never see it.
import Link from 'next/link'
import type { Gig } from '@/lib/api'

// The two pinned example gigs.
const BOARD_GIGS: Gig[] = [
  {
    id: 18, user_id: 4,
    title: 'Resume and cover letter writing',
    description: 'Offering resume rewrites for internship applications, with two revision rounds.',
    type: 'Offering', category: 'Writing', payment_type: 'Paid', budget: 30,
    deadline: '2026-11-03', status: 'Open', display_status: 'Open',
    accepted_applicant_id: null, created_at: '2026-10-21',
    owner_name: 'Ayesha Khan', owner_major: 'Sociology', applications_count: 0,
  },
  {
    id: 19, user_id: 3,
    title: 'Landing page for my design portfolio',
    description: 'I have the Figma file ready — need a developer to build a responsive one-page site from it.',
    type: 'Requesting', category: 'Programming', payment_type: 'Paid', budget: 200,
    deadline: '2026-11-05', status: 'Open', display_status: 'Open',
    accepted_applicant_id: null, created_at: '2026-10-21',
    owner_name: 'Ahmed Raza', owner_major: 'Design', applications_count: 1,
  },
]

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
  const gigs = BOARD_GIGS

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
        </section>
      </div>

    </div>
  )
}
