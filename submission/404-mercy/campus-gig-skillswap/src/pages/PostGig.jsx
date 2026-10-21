import { useState, useEffect } from 'react'
import { getGigs, createGig } from '../api/client'
import { useUser } from '../UserContext'
import { nextId } from '../utils'
import './Pages.css'

const CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring']
const TYPES      = ['Offering', 'Requesting']
const PAYMENTS   = ['Paid', 'Skill Swap', 'Free']

function todayStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1) // minimum tomorrow
  return d.toISOString().split('T')[0]
}

const EMPTY_FORM = {
  title: '', description: '', category: 'Programming',
  type: 'Offering', paymentType: 'Paid', budget: '', deadline: '',
}

export default function PostGig({ onPosted }) {
  const { currentUser } = useUser()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Reset when user changes
  useEffect(() => {
    setForm(EMPTY_FORM)
    setErrors({})
    setSuccess(null)
    setSubmitError(null)
  }, [currentUser?.id])

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required.'
    else if (form.title.trim().length < 5) e.title = 'Title must be at least 5 characters.'
    if (!form.description.trim()) e.description = 'Description is required.'
    else if (form.description.trim().length < 20) e.description = 'Description must be at least 20 characters.'
    if (!form.deadline) e.deadline = 'Deadline is required.'
    else {
      const dl = new Date(form.deadline)
      const today = new Date(); today.setHours(0,0,0,0)
      if (dl <= today) e.deadline = 'Deadline must be in the future.'
    }
    if (form.paymentType === 'Paid') {
      if (!form.budget && form.budget !== 0) e.budget = 'Budget is required for paid gigs.'
      else if (isNaN(Number(form.budget)) || Number(form.budget) <= 0)
        e.budget = 'Budget must be a positive number.'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const allGigs = await getGigs()
      const newGig = {
        id: nextId(allGigs),
        ownerId: currentUser.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        type: form.type,
        paymentType: form.paymentType,
        ...(form.paymentType === 'Paid' ? { budget: Number(form.budget) } : {}),
        deadline: new Date(form.deadline).toISOString(),
        status: 'Open',
        createdAt: new Date().toISOString(),
      }
      await createGig(newGig)
      setSuccess(newGig)
      setForm(EMPTY_FORM)
      if (onPosted) onPosted(newGig)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!currentUser) return <div className="alert alert-info">Loading user…</div>

  return (
    <div className="post-gig-page">
      <div className="section-header">
        <div>
          <h1>Post a Gig</h1>
          <p>Posting as <strong>{currentUser.name}</strong></p>
        </div>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          ✅ Gig <strong>"{success.title}"</strong> posted successfully!{' '}
          <button className="btn btn-sm btn-secondary" onClick={() => setSuccess(null)}>Post another</button>
        </div>
      )}

      {submitError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ {submitError}</div>
      )}

      <form className="post-gig-form card" onSubmit={handleSubmit} noValidate>
        <div className="form-section-title">Gig details</div>

        <div className="form-group">
          <label className="form-label" htmlFor="gig-title">
            Title <span className="req">*</span>
          </label>
          <input
            id="gig-title"
            type="text"
            className={`form-input${errors.title ? ' error' : ''}`}
            placeholder="e.g. Offering Python tutoring for CS students"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={120}
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="gig-desc">
            Description <span className="req">*</span>
          </label>
          <textarea
            id="gig-desc"
            className={`form-textarea${errors.description ? ' error' : ''}`}
            placeholder="Describe the gig in detail — skills needed, scope, deliverables…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={5}
          />
          {errors.description && <span className="form-error">{errors.description}</span>}
          <span className="form-hint">{form.description.length} / 1000 characters</span>
        </div>

        <div className="form-section-title">Classification</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="gig-category">
              Category <span className="req">*</span>
            </label>
            <select id="gig-category" className="form-select" value={form.category}
              onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="gig-type">
              Type <span className="req">*</span>
            </label>
            <select id="gig-type" className="form-select" value={form.type}
              onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <span className="form-hint">
              {form.type === 'Offering' ? 'You are offering a skill or service.' : 'You are looking for someone to help you.'}
            </span>
          </div>
        </div>

        <div className="form-section-title">Payment</div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="gig-payment">
              Payment type <span className="req">*</span>
            </label>
            <select id="gig-payment" className="form-select" value={form.paymentType}
              onChange={(e) => { set('paymentType', e.target.value); set('budget', '') }}>
              {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          {form.paymentType === 'Paid' && (
            <div className="form-group">
              <label className="form-label" htmlFor="gig-budget">
                Budget ($) <span className="req">*</span>
              </label>
              <input
                id="gig-budget"
                type="number"
                className={`form-input${errors.budget ? ' error' : ''}`}
                placeholder="e.g. 50"
                min="1"
                step="1"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
              />
              {errors.budget && <span className="form-error">{errors.budget}</span>}
            </div>
          )}
        </div>

        <div className="form-section-title">Timeline</div>

        <div className="form-group" style={{ maxWidth: '280px' }}>
          <label className="form-label" htmlFor="gig-deadline">
            Deadline <span className="req">*</span>
          </label>
          <input
            id="gig-deadline"
            type="date"
            className={`form-input${errors.deadline ? ' error' : ''}`}
            min={todayStr()}
            value={form.deadline}
            onChange={(e) => set('deadline', e.target.value)}
          />
          {errors.deadline && <span className="form-error">{errors.deadline}</span>}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary"
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setSuccess(null) }}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Posting…' : '📤 Post Gig'}
          </button>
        </div>
      </form>
    </div>
  )
}

