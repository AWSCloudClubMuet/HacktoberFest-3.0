import { useState } from 'react';
import { useApp, useAuth } from '../context.js';
import { Alert, Field, Link, PasswordField, buttonClass, inputClass, textLinkClass } from '../components.jsx';
import { readSection } from '../section.js';
import { AuthBanner } from '../ui.jsx';

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
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-line bg-surface shadow-card lg:grid-cols-2">
      <AuthBanner
        tone="offer"
        headline="Your campus. Your skills. Your gigs."
        subtitle="Offer a skill, request help, swap talents and build your reputation."
      />
      <div className="flex items-center p-4 sm:p-6 lg:py-8">
        <form className="mx-auto w-full max-w-md space-y-3" noValidate onSubmit={onSubmit}>
          <div>
            <h1 className="page-title text-ink">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Log in to post, apply, and review.</p>
          </div>
          <Alert>{formError}</Alert>
          <Field label="Email" error={errors.email}>
            <input className={inputClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <PasswordField label="Password" error={errors.password} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className={`${buttonClass} w-full`} type="submit" disabled={saving}>
            {saving ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-base text-muted">
            New here? <Link to="/signup" className={textLinkClass}>Create an account</Link>
          </p>
          <div className="border-t border-line pt-3">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted">Try a demo account</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {DEMOS.map((demo) => (
                <li key={demo.email}>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center rounded-full border border-line bg-canvas px-3 text-sm font-semibold text-ink transition duration-150 hover:border-offer focus-visible:ring-2 focus-visible:ring-offer"
                    title={`${demo.email}. ${demo.note}`}
                    onClick={() => fillDemo(demo)}
                  >
                    {demo.name}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-center text-xs text-muted">
              Password <span className="font-semibold text-ink">{DEMO_PASSWORD}</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
