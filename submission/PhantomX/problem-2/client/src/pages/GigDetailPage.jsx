import { useEffect, useState } from 'react';
import { useApp } from '../context.js';
import { api } from '../api.js';
import { paymentLabel } from '../constants.js';
import { formatMoney, formatWhen } from '../format.js';
import {
  Alert,
  Badge,
  Field,
  Link,
  Loading,
  Stars,
  buttonClass,
  cardClass,
  dangerButtonClass,
  inputClass,
  paymentTone,
  statusTone,
  textLinkClass,
} from '../components.jsx';

export function GigDetailPage({ gigId }) {
  const { userId, users, pushToast } = useApp();
  const [gig, setGig] = useState(null);
  const [poster, setPoster] = useState(null);
  const [applicantUser, setApplicantUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  async function load(initial) {
    if (initial) setLoading(true);
    setError('');
    const nextGig = await api(`/gigs/${encodeURIComponent(gigId)}`);
    const reviewIds = [nextGig.user_id];
    if (nextGig.accepted_applicant_id && nextGig.accepted_applicant_id !== nextGig.user_id) {
      reviewIds.push(nextGig.accepted_applicant_id);
    }
    const [nextPoster, mine, allApps, nextApplicant, ...reviewLists] = await Promise.all([
      api(`/users/${encodeURIComponent(nextGig.user_id)}`),
      api(`/applications?gig_id=${encodeURIComponent(nextGig.id)}&applicant_id=${encodeURIComponent(userId)}`),
      nextGig.user_id === userId
        ? api(`/applications?gig_id=${encodeURIComponent(nextGig.id)}`)
        : Promise.resolve([]),
      nextGig.accepted_applicant_id
        ? api(`/users/${encodeURIComponent(nextGig.accepted_applicant_id)}`)
        : Promise.resolve(null),
      ...reviewIds.map((id) => api(`/reviews?reviewee_id=${encodeURIComponent(id)}`)),
    ]);
    setGig(nextGig);
    setPoster(nextPoster);
    setApplicantUser(nextApplicant);
    setApplication(mine[0] || null);
    setApplicants(allApps.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    setReviews(reviewLists.flat().filter((review) => review.gig_id === nextGig.id));
  }

  useEffect(() => {
    let cancelled = false;
    load(true)
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gigId, userId]);

  function nameOf(id) {
    return users.find((user) => user.id === id)?.name || 'Student';
  }

  async function onApply(event) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setFieldError('message is required');
      setFormError('');
      return;
    }
    if (trimmed.length > 500) {
      setFieldError('message must be 500 characters or fewer');
      setFormError('');
      return;
    }
    setBusy('apply');
    setFieldError('');
    setFormError('');
    try {
      const created = await api('/applications', {
        method: 'POST',
        body: { gig_id: gig.id, message: trimmed },
      });
      setApplication(created);
      setMessage('');
      pushToast('success', `Application sent. Status: ${created.status}.`);
      await load(false);
    } catch (err) {
      setFormError(err.message);
      pushToast('error', err.message);
    } finally {
      setBusy('');
    }
  }

  async function decide(applicationId, status) {
    setBusy(`${status}:${applicationId}`);
    try {
      await api(`/applications/${encodeURIComponent(applicationId)}`, {
        method: 'PATCH',
        body: { status },
      });
      pushToast(
        'success',
        status === 'Accepted'
          ? 'Applicant accepted. Other pending applications were rejected, and the gig is in progress.'
          : 'Application rejected.',
      );
      await load(false);
    } catch (err) {
      pushToast('error', err.message);
    } finally {
      setBusy('');
    }
  }

  async function changeStatus(status) {
    if (status === 'Cancelled' && !window.confirm('Cancel this gig? Pending applications will be rejected.')) return;
    setBusy(status);
    try {
      await api(`/gigs/${encodeURIComponent(gig.id)}`, {
        method: 'PATCH',
        body: { status },
      });
      pushToast('success', status === 'Completed' ? 'Gig marked as completed.' : 'Gig cancelled.');
      await load(false);
    } catch (err) {
      pushToast('error', err.message);
    } finally {
      setBusy('');
    }
  }

  async function onReview(event) {
    event.preventDefault();
    const trimmed = comment.trim();
    const nextError = !Number.isInteger(rating) || rating < 1 || rating > 5
      ? 'rating must be an integer from 1 to 5'
      : !trimmed
        ? 'comment is required'
        : trimmed.length > 500
          ? 'comment must be 500 characters or fewer'
          : '';
    if (nextError) {
      setReviewError(nextError);
      return;
    }
    const revieweeId = userId === gig.user_id ? gig.accepted_applicant_id : gig.user_id;
    setBusy('review');
    setReviewError('');
    try {
      await api('/reviews', {
        method: 'POST',
        body: { gig_id: gig.id, reviewee_id: revieweeId, rating, comment: trimmed },
      });
      setComment('');
      setRating(0);
      pushToast('success', 'Review saved.');
      await load(false);
    } catch (err) {
      setReviewError(err.message);
      pushToast('error', err.message);
    } finally {
      setBusy('');
    }
  }

  if (loading) return <Loading>Loading gig…</Loading>;
  if (error) return <Alert>{error}</Alert>;
  if (!gig) return <Alert>Gig not found</Alert>;

  const isOwner = gig.user_id === userId;
  const isParty = isOwner || userId === gig.accepted_applicant_id;
  const myReview = reviews.find((review) => review.reviewer_id === userId);
  const canApply = gig.status === 'Open' && !isOwner;
  const canCancel = isOwner && (gig.status === 'Open' || gig.status === 'Expired' || gig.status === 'In Progress');
  const revieweeId = isOwner ? gig.accepted_applicant_id : gig.user_id;

  return (
    <div className="space-y-5">
      <Link to={gig.type === 'Requesting' ? '/offer' : '/request'} className={`inline-flex min-h-11 items-center text-sm ${textLinkClass}`}>Back to {gig.type === 'Requesting' ? 'requests' : 'offers'}</Link>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <article className={`${cardClass} space-y-4 p-5`}>
            <div className="flex flex-wrap gap-2">
              <Badge tone={statusTone(gig.status)}>{gig.status}</Badge>
              <Badge tone={gig.type === 'Offering' ? 'offering' : 'requesting'}>{gig.type}</Badge>
              <Badge tone={paymentTone(gig.payment_type)}>{paymentLabel(gig.payment_type)}</Badge>
              <Badge tone="neutral">{gig.category}</Badge>
            </div>
            <h1 className="page-title break-words text-ink">{gig.title}</h1>
            <p className="whitespace-pre-wrap break-words text-base leading-7 text-secondary">{gig.description}</p>
            <dl className="grid gap-3 text-base sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-sm text-muted">Payment</dt>
                <dd className="break-words font-semibold text-ink">
                  {paymentLabel(gig.payment_type)}
                  {gig.payment_type === 'Paid' && gig.budget != null ? ` · ${formatMoney(gig.budget)}` : ''}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-sm text-muted">Deadline</dt>
                <dd className="break-words font-semibold text-ink">{formatWhen(gig.deadline)}</dd>
              </div>
            </dl>
          </article>

          {isOwner ? (
            <section className={`${cardClass} space-y-3 p-5`}>
              <h2 className="font-display text-lg font-semibold text-ink">Applicants</h2>
              {applicants.length === 0 ? <p className="text-base text-muted">No one has applied yet.</p> : null}
              <ul className="space-y-3">
                {applicants.map((item) => (
                  <li key={item.id} className="min-w-0 rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/users/${item.applicant_id}`} className={`${textLinkClass} min-w-0 break-words`}>
                        {nameOf(item.applicant_id)}
                      </Link>
                      <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                    </div>
                    <p className="mt-2 break-words text-base text-secondary">{item.message}</p>
                    {item.status === 'Pending' ? (
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        {gig.status === 'Open' ? (
                          <button
                            type="button"
                            className={`${buttonClass} w-full sm:w-auto`}
                            disabled={Boolean(busy)}
                            onClick={() => decide(item.id, 'Accepted')}
                          >
                            {busy === `Accepted:${item.id}` ? 'Accepting…' : 'Accept'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={`${dangerButtonClass} w-full sm:w-auto`}
                          disabled={Boolean(busy)}
                          onClick={() => decide(item.id, 'Rejected')}
                        >
                          {busy === `Rejected:${item.id}` ? 'Rejecting…' : 'Reject'}
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {gig.status === 'Completed' ? (
            <section className={`${cardClass} space-y-4 p-5`}>
              <h2 className="font-display text-lg font-semibold text-ink">Reviews</h2>
              {reviews.length === 0 ? <p className="text-base text-muted">No reviews yet.</p> : null}
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="min-w-0 rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 break-words text-base font-semibold text-ink">
                        {nameOf(review.reviewer_id)} reviewed {nameOf(review.reviewee_id)}
                      </p>
                      <Stars value={review.rating} />
                    </div>
                    <p className="mt-2 break-words text-base text-secondary">{review.comment}</p>
                  </li>
                ))}
              </ul>
              {isParty && gig.accepted_applicant_id && !myReview ? (
                <form className="space-y-3 border-t border-line pt-4" noValidate onSubmit={onReview}>
                  <h3 className="font-display text-base font-semibold text-ink">Review {nameOf(revieweeId)}</h3>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-ink">Rating</p>
                    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Rating">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={rating === value}
                          aria-label={`${value} star${value === 1 ? '' : 's'}`}
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition duration-150 ${value <= rating ? 'text-star' : 'text-line-strong'} hover:text-star`}
                          onClick={() => setRating(value)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Comment">
                    <textarea
                      className={inputClass}
                      rows="3"
                      maxLength={500}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="How did the gig go?"
                    />
                  </Field>
                  <Alert>{reviewError}</Alert>
                  <button className={`${buttonClass} w-full sm:w-auto`} type="submit" disabled={Boolean(busy)}>
                    {busy === 'review' ? 'Saving…' : 'Submit review'}
                  </button>
                </form>
              ) : null}
              {isParty && myReview ? <p className="text-base text-muted">You already reviewed this gig.</p> : null}
            </section>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-36 lg:self-start">
          <PersonCard title="Posted by" person={poster} />
          {applicantUser ? <PersonCard title="Accepted student" person={applicantUser} /> : null}

          {isOwner ? (
            <section className={`${cardClass} space-y-3 p-4`}>
              <h2 className="font-display text-base font-semibold text-ink">Owner actions</h2>
              {(gig.status === 'Open' || gig.status === 'Expired') ? (
                <p className="text-base text-muted">You cannot apply to your own gig.</p>
              ) : null}
              {gig.status === 'Completed' ? <p className="text-base text-muted">This gig is completed.</p> : null}
              {gig.status === 'Cancelled' ? <p className="text-base text-muted">This gig is cancelled.</p> : null}
              {gig.status === 'In Progress' ? (
                <button type="button" className={`${buttonClass} w-full`} disabled={Boolean(busy)} onClick={() => changeStatus('Completed')}>
                  {busy === 'Completed' ? 'Saving…' : 'Mark as completed'}
                </button>
              ) : null}
              {canCancel ? (
                <button type="button" className={`${dangerButtonClass} w-full`} disabled={Boolean(busy)} onClick={() => changeStatus('Cancelled')}>
                  {busy === 'Cancelled' ? 'Cancelling…' : 'Cancel gig'}
                </button>
              ) : null}
            </section>
          ) : (
            <section className={`${cardClass} space-y-3 p-4`}>
              <h2 className="font-display text-base font-semibold text-ink">Apply</h2>
              {application ? (
                <p className="flex flex-wrap items-center gap-2 text-base text-muted">
                  Your application is <Badge tone={statusTone(application.status)}>{application.status}</Badge>
                </p>
              ) : canApply ? (
                <form className="space-y-3" noValidate onSubmit={onApply}>
                  <Alert>{formError}</Alert>
                  <Field label="Message" error={fieldError}>
                    <textarea
                      className={inputClass}
                      rows="4"
                      maxLength={500}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Say how you can help"
                    />
                  </Field>
                  <button className={`${buttonClass} w-full ${gig.type === 'Offering' ? 'fill-request' : ''}`} type="submit" disabled={Boolean(busy)}>
                    {busy === 'apply' ? 'Sending…' : (gig.type === 'Requesting' ? 'Offer your help' : 'Request this service')}
                  </button>
                </form>
              ) : (
                <p className="text-base text-muted">This gig is {gig.status}, so new applications are closed.</p>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function PersonCard({ title, person }) {
  if (!person) return null;
  return (
    <section className={`${cardClass} p-4`}>
      <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-base">
        <Link to={`/users/${person.id}`} className={`${textLinkClass} break-words`}>{person.name}</Link>
        <p className="break-words text-muted">{person.major} · Semester {person.semester}</p>
        <p className="break-words text-secondary">{person.bio}</p>
        <div className="flex flex-wrap gap-1">
          {person.skills.map((skill) => <Badge key={skill} tone="neutral">{skill}</Badge>)}
        </div>
        <p className="text-sm text-muted">
          {person.gigs_posted} posted · {person.gigs_completed} completed · {person.average_rating == null ? 'No reviews yet' : `${person.average_rating} average`}
        </p>
      </div>
    </section>
  );
}
