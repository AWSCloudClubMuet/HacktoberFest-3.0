import { useState } from 'react'
import { createReview, getReviews } from '../api/client'
import { nextId, Stars, formatDate } from '../utils'

export default function ReviewForm({
  gigId,
  reviewerId,
  revieweeId,
  revieweeName,
  existingReviews = [],
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Check if current user already submitted a review for this gig
  const myReview = existingReviews.find(
    (r) => r.gigId === gigId && r.reviewerId === reviewerId
  )

  if (myReview) {
    return (
      <div className="review-completed-box">
        <div className="review-completed-header">
          <span className="review-completed-title">Your Review for {revieweeName}:</span>
          <Stars rating={myReview.rating} />
        </div>
        <p className="review-completed-comment">"{myReview.comment}"</p>
        <span className="review-completed-date">Submitted on {formatDate(myReview.createdAt)}</span>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) {
      setError('Please provide a brief feedback comment.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const allReviews = await getReviews()
      const newReview = {
        id: nextId(allReviews),
        gigId,
        reviewerId,
        revieweeId,
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      }

      await createReview(newReview)
      setSuccess(true)
      if (onReviewSubmitted) onReviewSubmitted(newReview)
    } catch (err) {
      setError(err.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="review-form-container">
      <h4>Leave Feedback for {revieweeName}</h4>
      <p className="review-form-subtext">
        This gig is marked Completed. Rate your collaboration experience (1–5 stars).
      </p>

      {error && <div className="alert alert-error" style={{ margin: '0.5rem 0' }}>⚠️ {error}</div>}
      {success && <div className="alert alert-success" style={{ margin: '0.5rem 0' }}>✅ Review submitted successfully!</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="review-rating-row">
          <label className="form-label" htmlFor={`rating-select-${gigId}`}>
            Rating:
          </label>
          <div className="rating-selector">
            {[5, 4, 3, 2, 1].map((num) => (
              <label key={num} className={`rating-option ${rating === num ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={`rating-${gigId}`}
                  value={num}
                  checked={rating === num}
                  onChange={() => setRating(num)}
                />
                <span>{num} ★</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label" htmlFor={`comment-${gigId}`}>
            Comment:
          </label>
          <textarea
            id={`comment-${gigId}`}
            className="form-textarea"
            style={{ minHeight: '70px' }}
            placeholder={`How was it working with ${revieweeName}?`}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              setError(null)
            }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={submitting}
          style={{ marginTop: '0.5rem' }}
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}

