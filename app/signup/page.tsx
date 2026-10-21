'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { api } from '@/lib/api'

const MAJORS = ['Computer Science', 'Design', 'Sociology', 'Mathematics', 'Media Studies', 'Film', 'Biology', 'English', 'Electrical Engineering', 'Psychology', 'Other']

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', major: 'Computer Science', semester: '5', skills: '', bio: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function signUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error: signUpError } = await authClient.signUp.email({ name: form.name, email: form.email, password: form.password })
    if (signUpError) {
      setBusy(false)
      setError(signUpError.message || 'Could not create your account')
      return
    }
    try {
      await api.createProfile({ major: form.major, semester: Number(form.semester), bio: form.bio, skills: form.skills })
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Account created, but the profile could not be saved')
      return
    }
    setBusy(false)
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
        <h1 className="auth-title">Create your account</h1>
        <p className="modal-description">One account for posting gigs and applying to them.</p>
        <form className="dialog-form auth-form" onSubmit={signUp}>
          <div>
            <Label htmlFor="su-name">Full name</Label>
            <Input id="su-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alex Morgan" required />
          </div>
          <div className="form-row">
            <div>
              <Label htmlFor="su-email">Email</Label>
              <Input id="su-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@campusloop.edu" required />
            </div>
            <div>
              <Label htmlFor="su-password">Password</Label>
              <Input id="su-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="8+ characters" minLength={8} required />
            </div>
          </div>
          <div className="form-row">
            <div>
              <Label>Major</Label>
              <Select items={MAJORS.map((m) => ({ label: m, value: m }))} value={form.major} onValueChange={(v) => v && setForm({ ...form, major: v })}>
                <SelectTrigger className="form-select"><SelectValue>{form.major}</SelectValue></SelectTrigger>
                <SelectContent>{MAJORS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select items={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ label: `Semester ${n}`, value: String(n) }))} value={form.semester} onValueChange={(v) => v && setForm({ ...form, semester: v })}>
                <SelectTrigger className="form-select"><SelectValue>{`Semester ${form.semester}`}</SelectValue></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="su-skills">Skills (comma separated)</Label>
            <Input id="su-skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. React, Figma, Proofreading" />
          </div>
          <div>
            <Label htmlFor="su-bio">Short bio</Label>
            <Textarea id="su-bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="What do you study, what are you good at..." rows={3} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <Button type="submit" disabled={busy} className="auth-submit">{busy ? 'Creating account…' : 'Create account'} <ArrowRight data-icon="inline-end" /></Button>
        </form>
        <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
      </Card>
    </div>
  )
}
