import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, GraduationCap, Handshake, KeyRound, Lock, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react'

const request = async (path, body) => {
  const response = await fetch(`/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

function PasswordInput({ value, onChange, placeholder = 'Enter your password', label = 'Password' }) {
  const [visible, setVisible] = useState(false)
  return <label>{label}<span className="auth-input"><Lock size={17} /><input required minLength="8" type={visible ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
}

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: 'ayesha.khan@campus.edu', password: 'campus123', major: '', semester: '1', token: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const changeMode = (next) => { setMode(next); setError(''); setMessage('') }

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'login' || mode === 'register') {
        const data = await request(mode, form)
        localStorage.setItem('campusloop_token', data.token)
        onAuth(data.user)
      } else if (mode === 'forgot') {
        const data = await request('forgot-password', { email: form.email })
        setMessage(data.demo_reset_token ? `Demo reset code: ${data.demo_reset_token}` : data.message)
        if (data.demo_reset_token) { set('token', data.demo_reset_token); setTimeout(() => setMode('reset'), 900) }
      } else {
        const data = await request('reset-password', { email: form.email, token: form.token, password: form.password })
        setMessage(data.message); setTimeout(() => changeMode('login'), 1100)
      }
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <main className="auth-page">
    <section className="auth-story">
      <div className="auth-brand"><span><Handshake /></span>Campus<em>Loop</em></div>
      <div className="auth-story-copy"><span className="auth-kicker"><Sparkles size={14} /> YOUR CAMPUS, CONNECTED</span><h1>Turn what you know<br />into what’s <em>next.</em></h1><p>Find trusted collaborators, share your skills, and build a reputation that travels across campus.</p>
        <div className="auth-proof"><span><strong>240+</strong> students</span><i /><span><strong>4.9</strong> average rating</span><i /><span><strong>80+</strong> gigs completed</span></div>
      </div>
      <div className="auth-quote"><div className="auth-faces"><span>AK</span><span>HM</span><span>SR</span></div><p>“I found a designer for our society launch in under an hour.”</p><small>Hamza · Software Engineering</small></div>
      <div className="auth-shape one" /><div className="auth-shape two" />
    </section>
    <section className="auth-panel"><div className="auth-card">
      {mode !== 'login' && <button className="auth-back" type="button" onClick={() => changeMode(mode === 'reset' ? 'forgot' : 'login')}><ArrowLeft size={16} /> Back to sign in</button>}
      <div className="auth-mobile-brand"><span><Handshake /></span>Campus<em>Loop</em></div>
      <div className="auth-heading"><span className="auth-symbol">{mode === 'forgot' || mode === 'reset' ? <KeyRound /> : mode === 'register' ? <UserRound /> : <ShieldCheck />}</span><h2>{mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Join CampusLoop' : mode === 'forgot' ? 'Reset your password' : 'Choose a new password'}</h2><p>{mode === 'login' ? 'Sign in to continue building your campus reputation.' : mode === 'register' ? 'Create your student profile in less than a minute.' : mode === 'forgot' ? 'We’ll send a secure reset code to your email.' : 'Enter the code we sent and your new password.'}</p></div>
      <form className="auth-form" onSubmit={submit}>
        {mode === 'register' && <><label>Full name<span className="auth-input"><UserRound size={17} /><input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" /></span></label><div className="auth-form-row"><label>Major<span className="auth-input"><GraduationCap size={17} /><input required value={form.major} onChange={(e) => set('major', e.target.value)} placeholder="Computer Science" /></span></label><label>Semester<select value={form.semester} onChange={(e) => set('semester', e.target.value)}>{[1,2,3,4,5,6,7,8].map((n) => <option key={n}>{n}</option>)}</select></label></div></>}
        <label>Campus email<span className="auth-input"><Mail size={17} /><input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@campus.edu" /></span></label>
        {(mode === 'login' || mode === 'register' || mode === 'reset') && <PasswordInput value={form.password} onChange={(e) => set('password', e.target.value)} label={mode === 'reset' ? 'New password' : 'Password'} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} />}
        {mode === 'reset' && <label>Reset code<span className="auth-input"><KeyRound size={17} /><input required value={form.token} onChange={(e) => set('token', e.target.value.toUpperCase())} placeholder="6-character code" /></span></label>}
        {mode === 'login' && <div className="auth-options"><label><input type="checkbox" defaultChecked /> Keep me signed in</label><button type="button" onClick={() => changeMode('forgot')}>Forgot password?</button></div>}
        {error && <div className="auth-alert error">{error}</div>}{message && <div className="auth-alert success"><Check size={16} /> {message}</div>}
        <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset code' : 'Update password'} <ArrowRight size={17} /></button>
      </form>
      {mode === 'login' && <><div className="auth-demo"><span>DEMO ACCOUNT</span><p>ayesha.khan@campus.edu <b>·</b> campus123</p></div><p className="auth-switch">New to CampusLoop? <button onClick={() => changeMode('register')}>Create an account</button></p></>}
      {mode === 'register' && <p className="auth-switch">Already have an account? <button onClick={() => changeMode('login')}>Sign in</button></p>}
    </div><p className="auth-legal">By continuing, you agree to our Terms and Community Guidelines.</p></section>
  </main>
}
