'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

const DEMO = [
  { name: 'Emma Rodriguez', email: 'emma@campusloop.edu' },
  { name: 'Maya Chen', email: 'maya@campusloop.edu' },
  { name: 'Daniel Kim', email: 'daniel@campusloop.edu' },
]
const DEMO_PASSWORD = 'campus1234'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function signIn(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await authClient.signIn.email(creds || { email, password })
    setBusy(false)
    if (error) {
      setError(error.message || 'Could not sign in — check your email and password')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="auth-shell">
      <Card className="auth-card">
        <div className="auth-brand">
          <img src="/logo.png" alt="campusloop logo" className="brand-logo" />
          <span>campus<span className="brand-accent">loop</span></span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="modal-description">Sign in to post gigs, apply, and build your reputation.</p>
        <form className="dialog-form auth-form" onSubmit={signIn}>
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@campusloop.edu" required />
          </div>
          <div>
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
          </div>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={busy} className="auth-submit">{busy ? 'Signing in…' : 'Sign in'} <ArrowRight data-icon="inline-end" /></Button>
        </form>
        <div className="demo-box">
          <strong>Demo accounts</strong>
          <p>Seeded users all use the password <code>{DEMO_PASSWORD}</code> — tap one to sign in instantly:</p>
          <div className="demo-list">
            {DEMO.map((d) => (
              <button key={d.email} type="button" disabled={busy} onClick={() => signIn(undefined, { email: d.email, password: DEMO_PASSWORD })}>
                {d.name}<span>{d.email}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="auth-switch">New to campusloop? <Link href="/signup">Create an account</Link></p>
      </Card>
    </div>
  )
}
