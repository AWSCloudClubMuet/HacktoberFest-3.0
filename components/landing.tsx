'use client'

// One-screen landing page shown at / to signed-out visitors.
// Signed-in users never see it — the app renders instead.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, type Stats } from '@/lib/api'

export default function LandingPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.stats().then(setStats).catch(() => {})
  }, [])

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

      <main className="landing-hero">
        <p className="landing-eyebrow">The student gig board</p>
        <h1>Small jobs and skill swaps, posted by students.</h1>
        <p className="landing-sub">
          Need a poster designed, a Python assignment explained, or a thesis formatted?
          Post a gig with a budget in PKR, pick an applicant, and review each other when it&apos;s done.
        </p>
        <div className="landing-actions">
          <Link className="landing-cta" href="/signup">Get started</Link>
          <Link className="landing-cta-ghost" href="/login">Try a demo account</Link>
        </div>
        {stats && (
          <p className="landing-stats">
            {stats.open_gigs} open gigs · {stats.active_students} students · {stats.avg_rating} average rating from {stats.review_count} reviews
          </p>
        )}
        <p className="landing-cats">Programming · Design · Writing · Tutoring</p>
      </main>

      <footer className="landing-foot">campusloop — a campus community project</footer>
    </div>
  )
}
