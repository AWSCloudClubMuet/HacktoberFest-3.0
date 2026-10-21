import { useState, useEffect, useCallback, useMemo } from 'react'
import { getApplications, getGigs, getUsers, getReviews } from '../api/client'
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

export default function MyApplications({ onNavigate }) {
  const { currentUser } = useUser()
  const [applications, setApplications] = useState([])
  const [gigs, setGigs] = useState([])
  const [users, setUsers] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(() => {
    if (!currentUser) return
    setLoading(true)
    setError(null)
    Promise.all([getApplications(), getGigs(), getUsers(), getReviews()])
      .then(([appsData, gigsData, usersData, reviewsData]) => {
        const userApps = appsData.filter((a) => a.applicantId === currentUser.id)
        setApplications(userApps)
        setGigs(gigsData)
        setUsers(usersData)
        setReviews(reviewsData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [currentUser])

  useEffect(() => {
    loadData()
  }, [loadData])

  const gigMap = useMemo(() => Object.fromEntries(gigs.map((g) => [g.id, g])), [gigs])
  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} onRetry={loadData} />

  return (
    <div className="my-apps-page">
      <div className="section-header">
        <div>
          <h1>My Applications</h1>
          <p>
            Tracking applications submitted by <strong>{currentUser?.name}</strong>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate('explore')}>
          🔍 Browse More Gigs
        </button>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon="📨"
          title="No applications yet"
          description="You haven't applied to any gigs yet. Explore available opportunities to offer your skills."
          action={
            <button className="btn btn-primary" onClick={() => onNavigate('explore')}>
              Explore Gigs
            </button>
          }
        />
      ) : (
        <div className="apps-list">
          {applications.map((app) => {
            const gig = gigMap[app.gigId]
            const owner = gig ? userMap[gig.ownerId] : null
            const gigEffectiveStatus = gig ? effectiveStatus(gig) : 'Unknown'
            const isAcceptedAndCompleted = app.status === 'Accepted' && gig?.status === 'Completed'

            return (
              <div key={app.id} className="app-card">
                <div className="app-card-header">
                  <div>
                    <h3 className="app-gig-title">{gig ? gig.title : `Gig #${app.gigId}`}</h3>
                    <div className="app-gig-owner">
                      Posted by {owner ? owner.name : 'Unknown Owner'} · {gig?.category || 'General'}
                    </div>
                  </div>
                  <div className="app-status-badges">
                    <span title="Application Status">
                      <StatusBadge status={app.status} />
                    </span>
                    {gig && (
                      <span title="Gig Status">
                        <StatusBadge status={gigEffectiveStatus} />
                      </span>
                    )}
                    {gig && (
                      <PaymentBadge paymentType={gig.paymentType} budget={gig.budget} />
                    )}
                    {gig && <TypeBadge type={gig.type} />}
                  </div>
                </div>

                <div className="app-message">
                  <strong>Your application message:</strong>
                  <p style={{ marginTop: '0.25rem' }}>"{app.message}"</p>
                </div>

                <div className="app-footer">
                  <span>
                    Deadline: <strong>{gig ? formatDate(gig.deadline) : 'N/A'}</strong>
                  </span>
                  <span>Applied on: {formatDate(app.createdAt)}</span>
                </div>

                {/* Review Form if gig is completed and user was the accepted collaborator */}
                {isAcceptedAndCompleted && owner && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <ReviewForm
                      gigId={gig.id}
                      reviewerId={currentUser.id}
                      revieweeId={owner.id}
                      revieweeName={owner.name}
                      existingReviews={reviews}
                      onReviewSubmitted={loadData}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
