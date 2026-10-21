import { useEffect, useState } from "react";
import { api } from "../api";
import { useUser } from "../UserContext";

export default function ReviewSection({ gig }) {
  const { currentUser } = useUser();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const userId = currentUser?.id ?? null;
  const isOwner = userId !== null && userId === gig.user_id;
  const isAcceptedApplicant =
    userId !== null && userId === gig.accepted_applicant_id;
  const canReview = gig.status === "Completed" && (isOwner || isAcceptedApplicant);
  const alreadyReviewed = reviews.some((review) => review.reviewer_id === userId);

  async function loadReviews() {
    try {
      setReviews(await api.gigReviews(gig.id));
      setError("");
    } catch (err) {
      setError(err.message || "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    api.gigReviews(gig.id)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load reviews.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gig.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.createReview({
        gig_id: gig.id,
        rating: Number(rating),
        comment: comment.trim(),
      });
      setComment("");
      await loadReviews();
    } catch (err) {
      setError(err.message || "Could not submit your review.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="review-section">
      <h3>Reviews for this gig</h3>
      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="muted">No reviews yet.</p>
      ) : (
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-heading">
                <strong>{review.reviewer.name}</strong>
                <span className="review-rating">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  {" "}{review.rating}/5
                </span>
              </div>
              <p className="muted small">
                Reviewed {review.reviewee.name} · {review.gig_title}
              </p>
              <p className="pre-wrap">{review.comment}</p>
            </article>
          ))}
        </div>
      )}

      {canReview && !loading && !alreadyReviewed && (
        <form className="review-form" onSubmit={handleSubmit}>
          <h4>Leave your review</h4>
          <label className="field">
            <span className="field-label">Rating</span>
            <select
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              required
            >
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Very good</option>
              <option value="3">3 — Good</option>
              <option value="2">2 — Needs improvement</option>
              <option value="1">1 — Poor</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Comment</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              minLength={1}
              maxLength={1000}
              rows={3}
              placeholder="Share your experience working together..."
              required
            />
          </label>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit review"}
          </button>
        </form>
      )}

      {canReview && alreadyReviewed && (
        <p className="success-text">You have already reviewed this gig.</p>
      )}
    </section>
  );
}
