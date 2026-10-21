import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useUser } from '../UserContext';

export default function GigDetail() {
  const { id } = useParams();
  const { users, currentUser } = useUser();
  const [gig, setGig] = useState(null);
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = useCallback(async () => {
    try {
      const [g, apps, revs] = await Promise.all([
        api.getGig(id),
        api.getApplications({ gig_id: id }),
        api.getReviews({ gig_id: id }),
      ]);
      setGig(g);
      setApplications(apps);
      setReviews(revs);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!gig) return <p>{error || 'Loading...'}</p>;

  const nameOf = (uid) => users.find((u) => u.id === uid)?.name || uid;
  const isOwner = currentUser && gig.user_id === currentUser.id;
  const isAccepted = currentUser && gig.accepted_applicant_id === currentUser.id;
  const myApp = currentUser && applications.find((a) => a.applicant_id === currentUser.id);
  const myReview = currentUser && reviews.find((r) => r.reviewer_id === currentUser.id);
  const canReview = gig.status === 'Completed' && (isOwner || isAccepted) && !myReview;

  async function apply(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      await api.apply({ gig_id: id, user_id: currentUser.id, message });
      setMessage('');
      setInfo('Application sent!');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function decide(appId, status) {
    setError('');
    setInfo('');
    try {
      await api.updateApplication(appId, { user_id: currentUser.id, status });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(status) {
    setError('');
    setInfo('');
    try {
      await api.updateGig(id, { user_id: currentUser.id, status });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      await api.createReview({
        gig_id: id,
        reviewer_id: currentUser.id,
        rating: Number(rating),
        comment,
      });
      setComment('');
      setRating(5);
      setInfo('Review submitted!');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <Link to="/">← Back to gigs</Link>

      <div className="card" style={{ marginTop: 12 }}>
        <div>
          <span className={`badge ${gig.status.replace(' ', '')}`}>{gig.status}</span>
          <span className="badge">{gig.type}</span>
          <span className="badge">{gig.category}</span>
          <span className="badge">{gig.payment_type === 'SkillSwap' ? 'Skill Swap' : gig.payment_type}</span>
        </div>
        <h2 style={{ margin: '10px 0 6px' }}>{gig.title}</h2>
        <p>{gig.description}</p>
        <p>
          <b>Posted by:</b> <Link to={`/profile/${gig.user_id}`}>{nameOf(gig.user_id)}</Link>
          {' · '}
          <b>Budget:</b> {gig.payment_type === 'Paid' ? `Rs. ${gig.budget}` : 'N/A'}
          {' · '}
          <b>Deadline:</b> {gig.deadline}
        </p>
        {gig.accepted_applicant_id && (
          <p>
            <b>Accepted applicant:</b>{' '}
            <Link to={`/profile/${gig.accepted_applicant_id}`}>{nameOf(gig.accepted_applicant_id)}</Link>
          </p>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {info && <p style={{ color: '#166534' }}>{info}</p>}

      {/* Owner view */}
      {isOwner && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Applications ({applications.length})</h3>
          {applications.length === 0 && <p>No applications yet.</p>}
          {applications.map((a) => (
            <div key={a.id} style={{ borderTop: '1px solid #e5e7eb', padding: '10px 0' }}>
              <b>
                <Link to={`/profile/${a.applicant_id}`}>{nameOf(a.applicant_id)}</Link>
              </b>{' '}
              <span className="badge">{a.status}</span>
              <p style={{ margin: '6px 0' }}>{a.message}</p>
              {a.status === 'Pending' && gig.status === 'Open' && (
                <>
                  <button onClick={() => decide(a.id, 'Accepted')}>Accept</button>{' '}
                  <button className="danger" onClick={() => decide(a.id, 'Rejected')}>Reject</button>
                </>
              )}
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            {gig.status === 'In Progress' && (
              <button onClick={() => changeStatus('Completed')}>Mark as Completed</button>
            )}{' '}
            {(gig.status === 'Open' || gig.status === 'In Progress') && (
              <button className="secondary" onClick={() => changeStatus('Cancelled')}>Cancel gig</button>
            )}
          </div>
        </div>
      )}

      {/* Applicant view */}
      {!isOwner && currentUser && (
        <div className="card">
          {myApp ? (
            <p>
              Your application: <span className="badge">{myApp.status}</span>
              <br />
              {myApp.message}
            </p>
          ) : gig.status === 'Open' ? (
            <form onSubmit={apply}>
              <h3 style={{ marginTop: 0 }}>Apply to this gig</h3>
              <textarea
                rows={3}
                style={{ width: '100%' }}
                placeholder="Write a short message (5 to 300 characters)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit">Send application</button>
            </form>
          ) : (
            <p>This gig is {gig.status}, so applications are closed.</p>
          )}
        </div>
      )}

      {/* Reviews */}
      {gig.status === 'Completed' && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Reviews</h3>

          {reviews.length === 0 && <p>No reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r.id} style={{ borderTop: '1px solid #e5e7eb', padding: '10px 0' }}>
              <b>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</b>{' '}
              <Link to={`/profile/${r.reviewer_id}`}>{nameOf(r.reviewer_id)}</Link> reviewed{' '}
              <Link to={`/profile/${r.reviewee_id}`}>{nameOf(r.reviewee_id)}</Link>
              <p style={{ margin: '6px 0 0' }}>{r.comment}</p>
            </div>
          ))}

          {canReview && (
            <form onSubmit={submitReview} style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              <b>
                Rate {nameOf(isOwner ? gig.accepted_applicant_id : gig.user_id)}
              </b>
              <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ width: 160 }}>
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Okay</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Bad</option>
              </select>
              <textarea
                rows={3}
                placeholder="Leave a comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div>
                <button type="submit">Submit review</button>
              </div>
            </form>
          )}

          {myReview && <p style={{ marginTop: 12 }}><i>You have already reviewed this gig.</i></p>}
        </div>
      )}
    </>
  );
}