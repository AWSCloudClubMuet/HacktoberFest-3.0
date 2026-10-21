import { useState, useEffect, useCallback, useMemo } from 'react'
import { getGigs, getReviews, getUsers } from '../api/client'
import { useUser } from '../UserContext'
import {
  Spinner,
  ErrorAlert,
  EmptyState,
  Stars,
  formatDate,
} from '../utils'
import './Pages.css'

export default function StudentProfile({ onNavigate }) {
  const { currentUser } = useUser()
  const [allGigs, setAllGigs] = useState([])
  const [allReviews, setAllReviews] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(() => {
    if (!currentUser) return
    setLoading(true)
    setError(null)
    Promise.all([getGigs(), getReviews(), getUsers()])
      .then(([gigsData, reviewsData, usersData]) => {
        setAllGigs(gigsData)
        setAllReviews(reviewsData)
        setAllUsers(usersData)
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

  const userMap = useMemo(() => Object.fromEntries(allUsers.map((u) => [u.id, u])), [allUsers])

  // Computed statistics from real records
  const gigsPosted = useMemo(() => {
    if (!currentUser) return []
    return allGigs.filter((g) => g.ownerId === currentUser.id)
  }, [allGigs, currentUser])

  const gigsCompleted = useMemo(() => {
    if (!currentUser) return []
    return allGigs.filter(
      (g) =>
        (g.ownerId === currentUser.id || g.acceptedApplicantId === currentUser.id) &&
        g.status === 'Completed'
    )
  }, [allGigs, currentUser])

  const reviewsReceived = useMemo(() => {
    if (!currentUser) return []
    return allReviews.filter((r) => r.revieweeId === currentUser.id)
  }, [allReviews, currentUser])

  const averageRating = useMemo(() => {
    if (reviewsReceived.length === 0) return null
    const sum = reviewsReceived.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return (sum / reviewsReceived.length).toFixed(1)
  }, [reviewsReceived])

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} onRetry={loadData} />
  if (!currentUser) return <EmptyState title="No user selected" />

  return (
    <div className="profile-page">
      <div className="section-header">
        <div>
          <h1>Student Profile</h1>
          <p>Verified campus identity and performance history</p>
        </div>
      </div>

      {/* Profile Header */}
      <div className="profile-header-card">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="profile-avatar"
          onError={(e) => {
            e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'
          }}
        />
        <div className="profile-info">
          <h2 className="profile-name">{currentUser.name}</h2>
          <p className="profile-major">
            🎓 {currentUser.major} {currentUser.year ? `· Year ${currentUser.year}` : ''}
          </p>
          {currentUser.bio && <p className="profile-bio">{currentUser.bio}</p>}
          <div className="profile-meta">
            <span>✉️ {currentUser.email}</span>
            <span className="meta-sep">•</span>
            <span>Member since {formatDate(currentUser.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Calculated Stats */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <div className="profile-stat-number">{gigsPosted.length}</div>
          <div className="profile-stat-label">Gigs Posted</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-number">{gigsCompleted.length}</div>
          <div className="profile-stat-label">Gigs Completed</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-number">
            {averageRating ? `${averageRating} ★` : '—'}
          </div>
          <div className="profile-stat-label">
            {reviewsReceived.length > 0 ? 'Average Rating' : 'No Ratings Yet'}
          </div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-number">{reviewsReceived.length}</div>
          <div className="profile-stat-label">Reviews Received</div>
        </div>
      </div>

      {/* Skills */}
      <div className="profile-section">
        <h3 className="profile-section-title">Skills & Expertise</h3>
        {currentUser.skills && currentUser.skills.length > 0 ? (
          <div className="skill-tags">
            {currentUser.skills.map((skill, idx) => (
              <span key={idx} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>No skills listed.</p>
        )}
      </div>

      {/* Reviews Received */}
      <div className="profile-section">
        <h3 className="profile-section-title">
          Reviews & Feedback ({reviewsReceived.length})
        </h3>
        {reviewsReceived.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>
            No reviews received yet. Complete gigs to build your reputation!
          </p>
        ) : (
          <div className="reviews-list">
            {reviewsReceived.map((rev) => {
              const reviewer = userMap[rev.reviewerId]
              const gig = allGigs.find((g) => g.id === rev.gigId)

              return (
                <div key={rev.id} className="review-card">
                  <div className="review-header">
                    <div>
                      <span className="reviewer-name">
                        {reviewer ? reviewer.name : `User #${rev.reviewerId}`}
                      </span>
                      {gig && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginLeft: '0.5rem' }}>
                          for <em>{gig.title}</em>
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Stars rating={rev.rating} />
                      <span className="review-date">{formatDate(rev.createdAt)}</span>
                    </div>
                  </div>
                  <p className="review-comment">"{rev.comment}"</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

