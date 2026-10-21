import { useState, useEffect, useMemo, useCallback } from 'react'
import { getGigs, getUsers, getApplications, createApplication } from '../api/client'
import { useUser } from '../UserContext'
import {
  Spinner, ErrorAlert, EmptyState,
  StatusBadge, PaymentBadge, TypeBadge,
  formatDate, effectiveStatus, nextId,
} from '../utils'
import './ExploreGigs.css'

const CATEGORIES = ['All', 'Programming', 'Design', 'Writing', 'Tutoring']
const TYPES      = ['All', 'Offering', 'Requesting']
const PAYMENTS   = ['All', 'Paid', 'Skill Swap', 'Free']

const DEFAULT_FILTERS = {
  search: '', category: 'All', type: 'All', payment: 'All', budgetMin: '', budgetMax: '',
}

// ── GigDetailModal ────────────────────────────────────────────────────────────
function GigDetailModal({ gig, owner, currentUser, applications, onClose, onApplied, onNavigate }) {
  const [message, setMessage] = useState('')
  const [msgError, setMsgError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [success, setSuccess] = useState(false)

  const status = effectiveStatus(gig)
  const isOwner = currentUser && gig.ownerId === currentUser.id
  const myApp = applications.find(
    (a) => a.gigId === gig.id && a.applicantId === currentUser?.id
  )
  const canApply = !isOwner && status === 'Open' && !myApp

  const handleApply = async (e) => {
    e.preventDefault()
    if (!message.trim()) { setMsgError('Please write a short message.'); return }
    setMsgError('')
    setSubmitError(null)
    setSubmitting(true)
    try {
      const allApps = await getApplications()
      const newApp = {
        id: nextId(allApps),
        gigId: gig.id,
        applicantId: currentUser.id,
        message: message.trim(),
        status: 'Pending',
        createdAt: new Date().toISOString(),
      }
      await createApplication(newApp)
      setSuccess(true)
      onApplied()
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gig-modal-title">
        <div className="modal-header">
          <h2 className="modal-title" id="gig-modal-title">{gig.title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body gig-detail-body">
          <div className="gig-detail-badges">
            <TypeBadge type={gig.type} />
            <StatusBadge status={status} />
            <PaymentBadge paymentType={gig.paymentType} budget={gig.budget} />
            <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{gig.category}</span>
          </div>

          <p className="gig-detail-desc">{gig.description}</p>

          <div className="gig-detail-info">
            <div className="detail-item">
              <div className="detail-label">Posted by</div>
              <div className="detail-value">{owner?.name || '—'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Deadline</div>
              <div className="detail-value">{formatDate(gig.deadline)}</div>
            </div>
            {gig.paymentType === 'Paid' && (
              <div className="detail-item">
                <div className="detail-label">Budget</div>
                <div className="detail-value budget">${gig.budget}</div>
              </div>
            )}
            <div className="detail-item">
              <div className="detail-label">Posted on</div>
              <div className="detail-value">{formatDate(gig.createdAt)}</div>
            </div>
          </div>

          {/* Apply section */}
          {success ? (
            <div className="alert alert-success">✅ Application submitted! The owner will review it soon.</div>
          ) : myApp ? (
            <div className="already-applied">
              📨 You already applied to this gig — status: <strong>{myApp.status}</strong>
            </div>
          ) : isOwner ? (
            <div className="already-applied">
              📋 This is your own gig. Manage it from <em>My Gigs</em>.
            </div>
          ) : status !== 'Open' ? (
            <div className="already-applied">
              🔒 This gig is <strong>{status}</strong> and no longer accepting applications.
            </div>
          ) : (
            <div className="apply-section">
              <h3>Apply to this Gig</h3>
              {submitError && <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>⚠️ {submitError}</div>}
              <form onSubmit={handleApply} noValidate>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" htmlFor="apply-msg">
                    Your message <span className="req">*</span>
                  </label>
                  <textarea
                    id="apply-msg"
                    className={`form-textarea${msgError ? ' error' : ''}`}
                    placeholder="Tell the owner why you're a great fit…"
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setMsgError('') }}
                    rows={4}
                  />
                  {msgError && <span className="form-error">{msgError}</span>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Application'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── GigCard ───────────────────────────────────────────────────────────────────
function GigCard({ gig, owner, onClick }) {
  const status = effectiveStatus(gig)
  const expired = status === 'Expired'
  return (
    <article className="gig-card" onClick={onClick} tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      role="button" aria-label={`View gig: ${gig.title}`}>
      <div className="gig-card-badges">
        <TypeBadge type={gig.type} />
        <StatusBadge status={status} />
      </div>
      <h3 className="gig-card-title">{gig.title}</h3>
      <p className="gig-card-desc">{gig.description}</p>
      <div className="gig-card-meta">
        <div className="gig-meta-row">
          <span className="meta-label">Category</span>
          <span className="meta-value">{gig.category}</span>
        </div>
        <div className="gig-meta-row">
          <span className="meta-label">Payment</span>
          <span className="meta-value">
            <PaymentBadge paymentType={gig.paymentType} budget={gig.budget} />
          </span>
        </div>
        <div className="gig-meta-row">
          <span className="meta-label">Deadline</span>
          <span className={`meta-value${expired ? ' expired-date' : ''}`}>
            {expired ? '⚠️ ' : ''}{formatDate(gig.deadline)}
          </span>
        </div>
        <div className="gig-meta-row">
          <span className="meta-label">By</span>
          <span className="meta-value">{owner?.name || '—'}</span>
        </div>
      </div>
    </article>
  )
}

// ── ExploreGigs ───────────────────────────────────────────────────────────────
export default function ExploreGigs({ onNavigate }) {
  const { currentUser } = useUser()
  const [gigs, setGigs] = useState([])
  const [users, setUsers] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedGig, setSelectedGig] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([getGigs(), getUsers(), getApplications()])
      .then(([g, u, a]) => {
        setGigs(g)
        setUsers(u)
        setApplications(a)
        setLoading(false)
      })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => { load() }, [load])

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])

  const filtered = useMemo(() => {
    let list = gigs
    const { search, category, type, payment, budgetMin, budgetMax } = filters
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((g) =>
        g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)
      )
    }
    if (category !== 'All') list = list.filter((g) => g.category === category)
    if (type !== 'All')     list = list.filter((g) => g.type === type)
    if (payment !== 'All')  list = list.filter((g) => g.paymentType === payment)
    if (budgetMin !== '' && !isNaN(Number(budgetMin)))
      list = list.filter((g) => g.paymentType === 'Paid' && g.budget >= Number(budgetMin))
    if (budgetMax !== '' && !isNaN(Number(budgetMax)))
      list = list.filter((g) => g.paymentType === 'Paid' && g.budget <= Number(budgetMax))
    return list
  }, [gigs, filters])

  const hasFilters = Object.entries(filters).some(([k, v]) =>
    k === 'category' || k === 'type' || k === 'payment' ? v !== 'All' : v !== ''
  )

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  const selectedGigOwner = selectedGig ? userMap[selectedGig.ownerId] : null

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} onRetry={load} />

  return (
    <div className="explore-page">
      <div className="section-header">
        <div>
          <h1>Explore Gigs</h1>
          <p>Browse gigs posted by students — offer skills or find help</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filters-top">
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              className="form-input"
              type="search"
              placeholder="Search gigs by title or description…"
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              aria-label="Search gigs"
            />
          </div>
        </div>

        <div className="filters-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="filter-cat">Category</label>
            <select id="filter-cat" className="form-select" value={filters.category}
              onChange={(e) => setFilter('category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="filter-type">Type</label>
            <select id="filter-type" className="form-select" value={filters.type}
              onChange={(e) => setFilter('type', e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="filter-pay">Payment</label>
            <select id="filter-pay" className="form-select" value={filters.payment}
              onChange={(e) => setFilter('payment', e.target.value)}>
              {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          {filters.payment === 'Paid' && (
            <div className="form-group">
              <label className="form-label">Budget range ($)</label>
              <div className="budget-range">
                <input className="form-input" type="number" placeholder="Min" min="0"
                  value={filters.budgetMin} onChange={(e) => setFilter('budgetMin', e.target.value)}
                  aria-label="Minimum budget" />
                <input className="form-input" type="number" placeholder="Max" min="0"
                  value={filters.budgetMax} onChange={(e) => setFilter('budgetMax', e.target.value)}
                  aria-label="Maximum budget" />
              </div>
            </div>
          )}
        </div>

        <div className="filters-actions">
          <span className="filters-count">
            Showing <strong>{filtered.length}</strong> of {gigs.length} gigs
          </span>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>✕ Clear filters</button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="No gigs found"
          description="Try adjusting your search terms or filters."
          action={hasFilters && (
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Clear filters</button>
          )}
        />
      ) : (
        <div className="gigs-grid">
          {filtered.map((gig) => (
            <GigCard
              key={gig.id}
              gig={gig}
              owner={userMap[gig.ownerId]}
              onClick={() => setSelectedGig(gig)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedGig && (
        <GigDetailModal
          gig={selectedGig}
          owner={selectedGigOwner}
          currentUser={currentUser}
          applications={applications}
          onClose={() => setSelectedGig(null)}
          onNavigate={onNavigate}
          onApplied={() => {
            load()
            // re-fetch applications and keep modal open to show success
            getApplications().then(setApplications).catch(() => {})
          }}
        />
      )}
    </div>
  )
}

