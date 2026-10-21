import { useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { CATEGORIES, GIG_TYPES, PAYMENTS } from '../constants.js';
import { Alert, Field, buttonClass, inputClass } from '../components.jsx';

const emptyForm = {
  title: '',
  description: '',
  category: 'Programming',
  type: 'Offering',
  payment_type: 'Paid',
  budget: '',
  deadline: '',
};

export function CreateGigPage() {
  const { navigate, pushToast } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(values) {
    const next = {};
    if (typeof values.title !== 'string' || values.title.trim() === '') next.title = 'title is required';
    else if (values.title.trim().length > 140) next.title = 'title must be 140 characters or fewer';
    if (typeof values.description !== 'string' || values.description.trim() === '') next.description = 'description is required';
    else if (values.description.trim().length > 2000) next.description = 'description must be 2000 characters or fewer';
    if (!CATEGORIES.includes(values.category)) next.category = `category must be one of: ${CATEGORIES.join(', ')}`;
    if (!GIG_TYPES.includes(values.type)) next.type = `type must be one of: ${GIG_TYPES.join(', ')}`;
    if (!PAYMENTS.some((payment) => payment.value === values.payment_type)) {
      next.payment_type = 'payment_type must be one of: Paid, SkillSwap, Free';
    }
    if (!values.deadline) next.deadline = 'deadline is required';
    else if (Number.isNaN(new Date(values.deadline).getTime())) next.deadline = 'deadline must be a valid date';
    else if (new Date(values.deadline).getTime() <= Date.now()) next.deadline = 'deadline must be in the future';
    if (values.payment_type === 'Paid') {
      const budget = Number(values.budget);
      if (values.budget === '' || !Number.isFinite(budget) || budget <= 0) {
        next.budget = 'budget is required and must be greater than 0 when payment_type is Paid';
      }
    }
    return next;
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setApiError('');
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      type: form.type,
      payment_type: form.payment_type,
      deadline: new Date(form.deadline).toISOString(),
      budget: form.payment_type === 'Paid' ? Number(form.budget) : null,
    };

    setSaving(true);
    try {
      const created = await api('/gigs', { method: 'POST', body: payload });
      pushToast('success', 'Gig posted.');
      navigate(`/gigs/${created.id}`);
    } catch (err) {
      setApiError(err.message);
      pushToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Post a gig</h1>
        <p className="mt-1 text-sm text-stone-600">Offer a skill or ask for short-term help.</p>
      </div>
      <form className="space-y-4 rounded-xl border border-stone-200 bg-white p-5" noValidate onSubmit={onSubmit}>
        <Alert>{apiError}</Alert>
        <Field label="Title" error={errors.title}>
          <input className={inputClass} value={form.title} maxLength={140} onChange={(event) => update('title', event.target.value)} />
        </Field>
        <Field label="Description" error={errors.description}>
          <textarea className={inputClass} rows="5" maxLength={2000} value={form.description} onChange={(event) => update('description', event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" error={errors.category}>
            <select className={inputClass} value={form.category} onChange={(event) => update('category', event.target.value)}>
              {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>
          <Field label="Type" error={errors.type}>
            <select className={inputClass} value={form.type} onChange={(event) => update('type', event.target.value)}>
              {GIG_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Payment" error={errors.payment_type}>
          <select className={inputClass} value={form.payment_type} onChange={(event) => update('payment_type', event.target.value)}>
            {PAYMENTS.map((payment) => <option key={payment.value} value={payment.value}>{payment.label}</option>)}
          </select>
        </Field>
        {form.payment_type === 'Paid' ? (
          <Field label="Budget" error={errors.budget}>
            <input className={inputClass} type="number" min="0" step="any" value={form.budget} onChange={(event) => update('budget', event.target.value)} />
          </Field>
        ) : (
          <p className="text-sm text-stone-600">Skill Swap and Free gigs do not take a budget.</p>
        )}
        <Field label="Deadline" error={errors.deadline}>
          <input className={inputClass} type="datetime-local" value={form.deadline} onChange={(event) => update('deadline', event.target.value)} />
        </Field>
        <button className={buttonClass} type="submit" disabled={saving}>
          {saving ? 'Posting…' : 'Post gig'}
        </button>
      </form>
    </div>
  );
}
