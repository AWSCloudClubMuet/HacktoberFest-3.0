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
import { ApplicantCard, ApplyWizard, ConfirmDialog, GigChat, GigStepper, Tabs } from '../flow.jsx';

export function GigDetailPage({ gigId }) {
  const { userId, users, pushToast } = useApp();
  const [gig, setGig] = useState(null);
  const [poster, setPoster] = useState(null);
  const [applicantUser, setApplicantUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [applicantTab, setApplicantTab] = useState('Pending');
  const [pendingSort, setPendingSort] = useState('newest');
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [confirmStatus, setConfirmStatus] = useState('');
  const [reviews, setReviews] = useState([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
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
    const ordered = allApps.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setApplicants(ordered);
    if (nextGig.user_id === userId && ordered.length > 0) {
      const people = await Promise.all(ordered.map((item) => api(`/users/${encodeURIComponent(item.applicant_id)}`)));
      const nextProfiles = {};
      for (const person of people) nextProfiles[person.id] = person;
      setProfiles(nextProfiles);
    } else {
      setProfiles({});
    }
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

  async function decide(applicationId, status, note) {
    setBusy(`${status}:${applicationId}`);
    const body = { status };
    if (status === 'Rejected' && note && note.trim()) body.rejection_note = note.trim();
    try {
      await api(`/applications/${encodeURIComponent(applicationId)}`, {
        method: 'PATCH',
        body,
      });
      pushToast(
        'success',
        status === 'Accepted'
          ? 'Applicant accepted. Other pending applications were rejected, and the gig is in progress.'
          : 'Application rejected.',
      );
      setAccepting(null);
      setRejecting(null);
      setRejectNote('');
      await load(false);
    } catch (err) {
      pushToast('error', err.message);
    } finally {
      setBusy('');
    }
  }

  async function changeStatus(status) {
    setBusy(status);
    try {
      await api(`/gigs/${encodeURIComponent(gig.id)}`, {
        method: 'PATCH',
        body: { status },
      });
      pushToast('success', status === 'Completed' ? 'Gig marked as completed.' : 'Gig cancelled.');
      setConfirmStatus('');
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
    <div className="space-y-4">
      <Link to={gig.type === 'Requesting' ? '/offer' : '/request'} className={`inline-flex min-h-11 items-center text-sm ${textLinkClass}`}>Back to {gig.type === 'Requesting' ? 'requests' : 'offers'}</Link>
      <GigStepper status={gig.status} />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <article className={`${cardClass} space-y-3 p-4`}>
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
            <OwnerApplicants
              gig={gig}
              applicants={applicants}
              profiles={profiles}
              tab={applicantTab}
              onTab={setApplicantTab}
              sort={pendingSort}
              onSort={setPendingSort}
              busy={Boolean(busy)}
              onAccept={setAccepting}
              onReject={(item) => {
                setRejectNote('');
                setRejecting(item);
              }}
            />
          ) : null}

          {gig.status === 'Completed' ? (
            <section className={`${cardClass} space-y-3 p-4`}>
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
                <button type="button" className={`${buttonClass} w-full`} disabled={Boolean(busy)} onClick={() => setConfirmStatus('Completed')}>
                  Mark as completed
                </button>
              ) : null}
              {canCancel ? (
                <button type="button" className={`${dangerButtonClass} w-full`} disabled={Boolean(busy)} onClick={() => setConfirmStatus('Cancelled')}>
                  Cancel gig
                </button>
              ) : null}
            </section>
          ) : (
            <section className={`${cardClass} space-y-3 p-4`}>
              <h2 className="font-display text-base font-semibold text-ink">Apply</h2>
              {application ? (
                <div className="space-y-2">
                  <p className="flex flex-wrap items-center gap-2 text-base text-ink">
                    Applied
                    <Badge tone={statusTone(application.status)}>{application.status === 'Pending' ? 'Under review' : application.status}</Badge>
                  </p>
                  <button type="button" className={`${buttonClass} w-full`} disabled>
                    Applied
                  </button>
                </div>
              ) : canApply ? (
                <button type="button" className={`${buttonClass} w-full ${gig.type === 'Offering' ? 'fill-request' : ''}`} onClick={() => setApplyOpen(true)}>
                  {gig.type === 'Requesting' ? 'Offer your help' : 'Request this service'}
                </button>
              ) : (
                <p className="text-base text-muted">This gig is {gig.status}, so new applications are closed.</p>
              )}
            </section>
          )}
        </aside>
      </div>
      {isParty && gig.accepted_applicant_id ? <GigChat gig={gig} userId={userId} users={users} /> : null}
      <ApplyWizard
        gig={gig}
        poster={poster}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSubmitted={async (created) => {
          setApplication(created);
          pushToast('success', 'Application sent.');
          await load(false);
        }}
      />
      <ConfirmDialog
        open={Boolean(accepting)}
        title="Accept this applicant?"
        confirmLabel="Accept applicant"
        busy={Boolean(busy)}
        onClose={() => setAccepting(null)}
        onConfirm={() => decide(accepting.id, 'Accepted')}
      >
        <p className="text-base text-ink">
          {nameOf(accepting?.applicant_id)} will be selected. The gig moves to In Progress
          {(() => {
            const others = applicants.filter((item) => item.status === 'Pending' && item.id !== accepting?.id).length;
            return others > 0 ? `, and ${others} other pending ${others === 1 ? 'applicant is' : 'applicants are'} rejected automatically` : '';
          })()}.
          New applications close.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmStatus === 'Completed'}
        title="Mark this gig as completed?"
        confirmLabel="Mark as completed"
        busy={busy === 'Completed'}
        onClose={() => setConfirmStatus('')}
        onConfirm={() => changeStatus('Completed')}
      >
        <p className="text-base text-ink">Both of you can leave a review after the gig is completed.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirmStatus === 'Cancelled'}
        title="Cancel this gig?"
        confirmLabel="Cancel gig"
        tone="danger"
        busy={busy === 'Cancelled'}
        onClose={() => setConfirmStatus('')}
        onConfirm={() => changeStatus('Cancelled')}
      >
        <p className="text-base text-ink">Pending applications will be rejected. This cannot be reopened.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(rejecting)}
        title="Reject this applicant?"
        confirmLabel="Reject applicant"
        tone="danger"
        busy={Boolean(busy)}
        onClose={() => setRejecting(null)}
        onConfirm={() => decide(rejecting.id, 'Rejected', rejectNote)}
      >
        <p className="text-base text-ink">The gig stays as it is. You can leave an optional note.</p>
        <label className="block text-sm font-semibold text-ink">
          Note to the applicant <span className="font-normal text-muted">(optional)</span>
          <textarea
            className={`${inputClass} mt-1.5`}
            maxLength={200}
            rows="3"
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
          />
        </label>
        <p className="text-sm text-muted">{rejectNote.length}/200</p>
      </ConfirmDialog>
    </div>
  );
}

function OwnerApplicants({ gig, applicants, profiles, tab, onTab, sort, onSort, busy, onAccept, onReject }) {
  const selected = applicants.find((item) => item.status === 'Accepted');
  const counts = {
    Pending: applicants.filter((item) => item.status === 'Pending').length,
    Accepted: applicants.filter((item) => item.status === 'Accepted').length,
    Rejected: applicants.filter((item) => item.status === 'Rejected').length,
  };
  const rows = applicants.filter((item) => item.status === tab);
  if (tab === 'Pending') {
    rows.sort((a, b) => {
      const delta = new Date(a.created_at) - new Date(b.created_at);
      return sort === 'oldest' ? delta : -delta;
    });
  }
  const gigOpen = gig.status === 'Open';
  return (
    <section className={`${cardClass} space-y-4 p-5`}>
      <h2 className="font-display text-lg font-semibold text-ink">Applicants</h2>
      {selected ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-success">Selected applicant</h3>
          <ApplicantCard application={selected} person={profiles[selected.applicant_id]} gig={gig} gigOpen={false} busy={busy} />
        </div>
      ) : null}
      {!gigOpen ? (
        <p className="text-base text-muted">This gig is {gig.status}, so applicants can no longer be accepted or rejected.</p>
      ) : null}
      {applicants.length === 0 ? <p className="text-base text-muted">No one has applied yet.</p> : null}
      {applicants.length > 0 ? (
        <>
          <Tabs
            label="Applicant status"
            value={tab}
            onChange={onTab}
            tabs={[
              { id: 'Pending', label: 'Pending', count: counts.Pending },
              { id: 'Accepted', label: 'Accepted', count: counts.Accepted },
              { id: 'Rejected', label: 'Rejected', count: counts.Rejected },
            ]}
          />
          {tab === 'Pending' && counts.Pending > 1 ? (
            <button type="button" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary" onClick={() => onSort(sort === 'newest' ? 'oldest' : 'newest')}>
              Sort: {sort === 'newest' ? 'Newest' : 'Oldest'}
            </button>
          ) : null}
          {rows.length === 0 ? <p className="text-base text-muted">No applicants in this tab.</p> : null}
          <div className="space-y-3">
            {rows.map((item) => (
              <ApplicantCard
                key={item.id}
                application={item}
                person={profiles[item.applicant_id]}
                gig={gig}
                gigOpen={gigOpen}
                busy={busy}
                onAccept={() => onAccept(item)}
                onReject={() => onReject(item)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
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
