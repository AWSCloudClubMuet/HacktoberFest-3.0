/**
 * Shared utility functions and small presentational components.
 */

// ── Date helpers ──────────────────────────────────────────────────────────────

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function isExpired(deadline) {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

/**
 * Compute the effective display status of a gig.
 * Only "Open" gigs can be Expired; In Progress / Completed are never Expired.
 */
export function effectiveStatus(gig) {
  if (gig.status === 'Open' && isExpired(gig.deadline)) return 'Expired'
  return gig.status
}

// ── ID generation ─────────────────────────────────────────────────────────────

/** Generate a unique integer ID higher than the max existing one. */
export function nextId(items) {
  if (!items || items.length === 0) return 1
  return Math.max(...items.map((i) => Number(i.id) || 0)) + 1
}

// ── React components ──────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  )
}

export function ErrorAlert({ message, onRetry }) {
  return (
    <div className="alert alert-error" role="alert">
      <span>⚠️</span>
      <span>
        {message}
        {onRetry && (
          <> &nbsp;<button className="btn btn-sm btn-secondary" onClick={onRetry}>Retry</button></>
        )}
      </span>
    </div>
  )
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function Stars({ rating }) {
  const full = Math.round(rating || 0)
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1,2,3,4,5].map((i) => (
        <span key={i} className={i <= full ? 'star-filled' : 'star-empty'}>★</span>
      ))}
    </span>
  )
}

export function StatusBadge({ status }) {
  const cls = status ? status.toLowerCase().replace(' ', '-') : ''
  return <span className={`badge badge-${cls}`}>{status}</span>
}

export function PaymentBadge({ paymentType, budget }) {
  const cls = paymentType ? paymentType.toLowerCase().replace(' ', '-') : ''
  const label = paymentType === 'Paid' && budget ? `Paid · $${budget}` : paymentType
  return <span className={`badge badge-${cls}`}>{label}</span>
}

export function TypeBadge({ type }) {
  const cls = type ? type.toLowerCase() : ''
  return <span className={`badge badge-${cls}`}>{type}</span>
}

