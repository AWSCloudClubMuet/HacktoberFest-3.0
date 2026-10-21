import { useState } from 'react';
import { useApp, useAuth } from '../context.js';
import { Alert, Field, Link, buttonClass, inputClass, textLinkClass } from '../components.jsx';
import { readSection } from '../section.js';

const DEMOS = [
  { name: 'Aisha Khan', email: 'aisha.khan@campus.edu', note: 'Poster with applicants' },
  { name: 'Bilal Ahmed', email: 'bilal.ahmed@campus.edu', note: 'Applications in every state' },
  { name: 'Sara Malik', email: 'sara.malik@campus.edu', note: 'Completed gigs and reviews' },
  { name: 'Hamza Raza', email: 'hamza.raza@campus.edu', note: 'Gig in progress' },
  { name: 'Zainab Tariq', email: 'zainab.tariq@campus.edu', note: 'Fresh account' },
];

const DEMO_PASSWORD = 'Demo@1234';

export function LoginPage() {
  const { navigate } = useApp();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function validate() {
    const next = {};
    if (!email.trim()) next.email = 'email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'email must be a valid email address';
    if (!password) next.password = 'password is required';
    return next;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await login(email.trim(), password);
      navigate(`/${readSection()}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function fillDemo(demo) {
    setEmail(demo.email);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setFormError('');
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex h-1.5" aria-hidden="true">
          <span className="flex-1 bg-primary" />
          <span className="flex-1 bg-secondary" />
          <span className="flex-1 bg-accent" />
          <span className="flex-1 bg-faint" />
        </div>
        <form className="space-y-4 p-5 sm:p-6" noValidate onSubmit={onSubmit}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Campus Gig</p>
            <h1 className="page-title mt-1 text-ink">Log in</h1>
            <p className="mt-2 text-base text-muted">Use a demo account or one you created.</p>
          </div>
          <Alert>{formError}</Alert>
          <Field label="Email" error={errors.email}>
            <input className={inputClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Password" error={errors.password}>
            <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <button className={`${buttonClass} w-full`} type="submit" disabled={saving}>
            {saving ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-base text-muted">
            New here? <Link to="/signup" className={textLinkClass}>Create an account</Link>
          </p>
        </form>
      </div>
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Demo accounts</h2>
        <p className="text-base text-muted">
          Password for every account: <span className="font-semibold text-ink">{DEMO_PASSWORD}</span>
        </p>
        <ul className="space-y-2">
          {DEMOS.map((demo) => (
            <li key={demo.email}>
              <button
                type="button"
                className="flex min-h-11 w-full flex-col items-start justify-center gap-0.5 rounded-xl border border-line bg-canvas px-4 py-3 text-left transition duration-150 hover:border-primary"
                onClick={() => fillDemo(demo)}
              >
                <span className="text-base font-semibold text-ink">{demo.name}</span>
                <span className="break-all text-sm font-normal text-muted">{demo.email} · {demo.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
