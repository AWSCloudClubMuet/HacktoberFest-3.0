import { useState } from 'react';
import { useApp, useAuth } from '../context.js';
import { Alert, Field, Link, buttonClass, inputClass, textLinkClass } from '../components.jsx';

const empty = {
  name: '',
  email: '',
  password: '',
  major: '',
  semester: '',
  bio: '',
  skills: '',
};

export function SignupPage() {
  const { navigate } = useApp();
  const { signup } = useAuth();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(values) {
    const next = {};
    if (!values.name.trim()) next.name = 'name is required';
    else if (values.name.trim().length > 80) next.name = 'name must be 80 characters or fewer';
    if (!values.email.trim()) next.email = 'email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = 'email must be a valid email address';
    if (!values.password) next.password = 'password is required';
    else if (values.password.length < 8) next.password = 'password must be at least 8 characters';
    if (!values.major.trim()) next.major = 'major is required';
    else if (values.major.trim().length > 80) next.major = 'major must be 80 characters or fewer';
    if (values.semester === '') next.semester = 'semester is required';
    else if (!Number.isInteger(Number(values.semester)) || Number(values.semester) < 1 || Number(values.semester) > 12) {
      next.semester = 'semester must be an integer from 1 to 12';
    }
    if (values.bio.trim().length > 500) next.bio = 'bio must be 500 characters or fewer';
    return next;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = validate(form);
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length > 0) return;
    const skills = form.skills.split(',').map((item) => item.trim()).filter(Boolean);
    setSaving(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        major: form.major.trim(),
        semester: Number(form.semester),
        bio: form.bio.trim(),
        skills,
      });
      navigate('/');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form className="space-y-4 overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" noValidate onSubmit={onSubmit}>
        <div className="-mx-5 -mt-5 flex h-1.5 sm:-mx-6 sm:-mt-6" aria-hidden="true">
          <span className="flex-1 bg-primary" />
          <span className="flex-1 bg-secondary" />
          <span className="flex-1 bg-accent" />
          <span className="flex-1 bg-faint" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Campus Gig</p>
          <h1 className="page-title mt-1 text-ink">Create an account</h1>
          <p className="mt-2 text-base text-muted">No email verification. You can post and apply right away.</p>
        </div>
        <Alert>{formError}</Alert>
        <Field label="Name" error={errors.name}>
          <input className={inputClass} value={form.name} onChange={(event) => update('name', event.target.value)} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className={inputClass} type="email" autoComplete="username" value={form.email} onChange={(event) => update('email', event.target.value)} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input className={inputClass} type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Major" error={errors.major}>
            <input className={inputClass} value={form.major} onChange={(event) => update('major', event.target.value)} />
          </Field>
          <Field label="Semester" error={errors.semester}>
            <input className={inputClass} type="number" min="1" max="12" value={form.semester} onChange={(event) => update('semester', event.target.value)} />
          </Field>
        </div>
        <Field label="Bio" error={errors.bio}>
          <textarea className={inputClass} rows="3" value={form.bio} onChange={(event) => update('bio', event.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Skills">
          <input className={inputClass} value={form.skills} onChange={(event) => update('skills', event.target.value)} placeholder="Optional, separated by commas" />
        </Field>
        <button className={`${buttonClass} w-full`} type="submit" disabled={saving}>
          {saving ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="text-base text-muted">
          Already have an account? <Link to="/login" className={textLinkClass}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
