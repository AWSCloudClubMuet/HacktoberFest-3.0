import { useState } from 'react';
import { useApp, useAuth } from '../context.js';
import { Alert, Field, Link, buttonClass, inputClass, secondaryButtonClass } from '../components.jsx';

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
      navigate('/');
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
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Log in</h1>
        <p className="mt-1 text-sm text-stone-600">Use a demo account or one you created.</p>
      </div>
      <form className="space-y-4 rounded-xl border border-stone-200 bg-white p-5" noValidate onSubmit={onSubmit}>
        <Alert>{formError}</Alert>
        <Field label="Email" error={errors.email}>
          <input className={inputClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <button className={buttonClass} type="submit" disabled={saving}>
          {saving ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-sm text-stone-600">
          New here? <Link to="/signup" className="font-medium text-teal-800 hover:underline">Create an account</Link>
        </p>
      </form>
      <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-900">Demo accounts</h2>
        <p className="text-sm text-stone-600">
          Password for every account: <span className="font-medium text-stone-800">{DEMO_PASSWORD}</span>
        </p>
        <ul className="space-y-2">
          {DEMOS.map((demo) => (
            <li key={demo.email}>
              <button type="button" className={`${secondaryButtonClass} w-full text-left`} onClick={() => fillDemo(demo)}>
                <span className="block">{demo.name}</span>
                <span className="block text-xs font-normal text-stone-500">{demo.email} · {demo.note}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
