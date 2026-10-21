import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createReview } from '../api/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { Stars, StarInput } from './StarRating.jsx';

export default function ReviewForm({ gigId, revieweeName, myReview, onDone }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (myReview) {
    return (
      <div>
        <h2>{t('review.done')}</h2>
        <div className="statusline">
          <span>{t('review.yourRating')}</span>
          <Stars value={myReview.rating} />
        </div>
        {myReview.comment && <p className="body" style={{ marginTop: 12 }}>{myReview.comment}</p>}
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (rating < 1) {
      setError(t('review.ratingRequired'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const created = await createReview({ gig_id: gigId, rating, comment: comment.trim() || undefined });
      toast.show(t('review.sent'));
      onDone?.(created);
    } catch (err) {
      toast.error(err);
      if (err?.apiError?.code === 'DUPLICATE_REVIEW') onDone?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2>{t('review.title')}</h2>
      <p style={{ margin: '-6px 0 14px', color: 'var(--muted)', fontSize: 13 }}>
        {t('review.subtitle', { name: revieweeName })}
      </p>

      <div className={`field${error ? ' invalid' : ''}`} style={{ marginTop: 0 }}>
        <label>{t('review.rating')} *</label>
        <StarInput value={rating} onChange={setRating} label={t('review.rating')} />
        {error && <div className="err">{error}</div>}
      </div>

      <div className="field">
        <label htmlFor="review-comment">{t('review.comment')}</label>
        <textarea
          id="review-comment"
          value={comment}
          maxLength={500}
          placeholder={t('review.commentPh')}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="hint">{comment.length}/500</div>
      </div>

      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? t('review.submitting') : t('review.submit')}
      </button>
    </form>
  );
}
