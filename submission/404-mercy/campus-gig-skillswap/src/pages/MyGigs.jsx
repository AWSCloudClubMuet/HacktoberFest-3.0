import { useState, useEffect, useCallback } from 'react'
import {
  getGigs,
  getApplications,
  getUsers,
  getReviews,
  updateApplication,
  updateGig,
} from '../api/client'
import { useUser } from '../UserContext'
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  StatusBadge,
  PaymentBadge,
  TypeBadge,
  formatDate,
  effectiveStatus,
} from '../utils'
import ReviewForm from '../components/ReviewForm'
import './Pages.css'

// ── ApplicantCard ─────────────────────────────────────────────────────────────
function ApplicantCard({ app, applicant, gigStatus, onAccept, onReject }) {
  const [busy, setBusy] = useState(false)

  const act = async (fn) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  const canManage = app.status === 'Pending' && gigStatus === 'Open'

  return (
    <div className="applicant-card">
      <div className="applicant-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src={applicant?.avatar}
            alt=""
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '2px solid var(--primary-light)',
            }}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <span className="applicant-name">
            {applicant?.name || `Student #${app.applicantId}`}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            ({applicant?.major || 'General'})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusBadge status={app.status} />
          {canManage && (
            <div className="applicant-actions">
              <button
                className="btn btn-success btn-sm"
                disabled={busy}
                onClick={() => act(onAccept)}
              >
                ✓ Accept
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={busy}
                onClick={() => act(onReject)}
              >
                ✕ Reject
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="applicant-message">"{app.message}"</p>
      <span className="applicant-date">Applied {formatDate(app.createdAt)}</span>
    </div>
  )
}

// ── MyGigCard ─────────────────────────────────────────────────────────────────
function MyGigCard({ gig, applicants, reviews, userMap, currentUserId, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const status = effectiveStatus(gig)

  const gigApps = applicants.filter((a) => a.gigId === gig.id)
  const acceptedApplicant = gig.acceptedApplicantId ? userMap[gig.acceptedApplicantId] : null

  const handleAccept = async (app) => {
    setError(null)
    try {
      // Accept this applicant and reject other pending applicants for this gig
      await updateApplication(app.id, { status: 'Accepted' })
      const others = gigApps.filter((a) => a.id !== app.id && a.status === 'Pending')
      await Promise.all(others.map((a) => updateApplication(a.id, { status: 'Rejected' })))
      await updateGig(gig.id, { status: 'In Progress', acceptedApplicantId: app.applicantId })
      onStatusChange()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReject = async (app) => {
    setError(null)
    try {
      await updateApplication(app.id, { status: 'Rejected' })
      onStatusChange()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleComplete = async () => {
    setError(null)
    setBusy(true)
    try {
      await updateGig(gig.id, { status: 'Completed' })
      onStatusChange()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="my-gig-card">
      <div
        className="my-gig-card-header"
        onClick={() => setExpanded((x) => !x)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setExpanded((x) => !x)}
      >
        <div className="my-gig-title-area">
          <div className="my-gig-title">{gig.title}</div>
          <div className="my-gig-meta">
            <TypeBadge type={gig.type} />
            <StatusBadge status={status} />
            <PaymentBadge paymentType={gig.paymentType} budget={gig.budget} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
              {gig.category} · Deadline {formatDate(gig.deadline)}
            </span>
          </div>
        </div>
        <div className="my-gig-actions">
          {gig.status === 'In Progress' && (
            <button
              className="btn btn-success btn-sm"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation()
                handleComplete()
              }}
            >
              ✓ Mark Completed
            </button>
          )}
          <span style={{ color: 'var(--text-3)', fontSize: '1rem', padding: '0 0.5rem' }}>
            {expanded ? '▲ Close' : '▼ Details'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="my-gig-body">
          {error && <div className="alert alert-error" style={{ margin: '0.5rem 0' }}>⚠️ {error}</div>}

          <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
            {gig.description}
          </p>

          {/* If In-Progress or Completed, display accepted collaborator */}
          {acceptedApplicant && (
            <div className="accepted-collaborator-banner">
              <span>🤝 Accepted Collaborator:</span>
              <strong>{acceptedApplicant.name}</strong> ({acceptedApplicant.major})
            </div>
          )}

          {/* Applicants Section */}
          <div className="applicants-section">
            <h3>Applicants ({gigApps.length})</h3>
            {gigApps.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No applications received yet.</p>
            ) : (
              gigApps.map((app) => (
                <ApplicantCard
                  key={app.id}
                  app={app}
                  applicant={userMap[app.applicantId]}
                  gigStatus={gig.status}
                  onAccept={() => handleAccept(app)}
                  onReject={() => handleReject(app)}
                />
              ))
            )}
          </div>

          {/* Feedback & Review Form for Completed Gig */}
          {gig.status === 'Completed' && gig.acceptedApplicantId && (
            <ReviewForm
              gigId={gig.id}
              reviewerId={currentUserId}
              revieweeId={gig.acceptedApplicantId}
              revieweeName={acceptedApplicant ? acceptedApplicant.name : `Student #${gig.acceptedApplicantId}`}
              existingReviews={reviews}
              onReviewSubmitted={onStatusChange}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── MyGigs ────────────────────────────────────────────────────────────────────
export default function MyGigs({ onNavigate }) {
  const { currentUser } = useUser()
  const [gigs, setGigs] = useState([])
  const [applications, setApplications] = useState([])
  const [users, setUsers] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    if (!currentUser) return
    setLoading(true)
    setError(null)
    Promise.all([getGigs(), getApplications(), getUsers(), getReviews()])
      .then(([g, a, u, r]) => {
        setGigs(g.filter((gig) => gig.ownerId === currentUser.id))
        setApplications(a)
        setUsers(u)
        setReviews(r)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [currentUser])

  useEffect(() => {
    load()
  }, [load])

  const userMap = Object.fromEntries((users || []).map((u) => [u.id, u]))

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} onRetry={load} />

  return (
    <div className="my-gigs-page">
      <div className="section-header">
        <div>
          <h1>My Gigs</h1>
          <p>
            Gigs posted and managed by <strong>{currentUser?.name}</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('post')}>
          ➕ Post New Gig
        </button>
      </div>

      {gigs.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No gigs posted yet"
          description="Post a gig to offer your skills or request help from fellow campus students."
          action={
            <button className="btn btn-primary" onClick={() => onNavigate('post')}>
              ➕ Post a Gig
            </button>
          }
        />
      ) : (
        gigs.map((gig) => (
          <MyGigCard
            key={gig.id}
            gig={gig}
            applicants={applications}
            reviews={reviews}
            userMap={userMap}
            currentUserId={currentUser?.id}
            onStatusChange={load}
          />
        ))
      )}
    </div>
  )
}
