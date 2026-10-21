import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useUser } from '../UserContext';

export default function Profile() {
  const { id } = useParams();
  const { users } = useUser();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(null);
    Promise.all([api.getUser(id), api.getReviews({ reviewee_id: id }), api.getGigs()])
      .then(([u, r, g]) => {
        setUser(u);
        setReviews(r);
        setGigs(g);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!user) return <p>Loading...</p>;

  const nameOf = (uid) => users.find((u) => u.id === uid)?.name || uid;
  const gigTitle = (gid) => gigs.find((g) => g.id === gid)?.title || gid;
  const posted = gigs.filter((g) => g.user_id === id);

  return (
    <>
      <div className="card">
        <h2 style={{ margin: '0 0 4px' }}>{user.name}</h2>
        <p style={{ margin: '0 0 8px', color: '#4b5563' }}>
          {user.major} · Semester {user.semester}
        </p>
        <p>{user.bio}</p>
        <div style={{ marginBottom: 12 }}>
          {user.skills.map((s) => (
            <span className="badge" key={s}>{s}</span>
          ))}
        </div>
        <div className="filters" style={{ marginBottom: 0 }}>
          <div className="card" style={{ margin: 0 }}>
            <b>{user.gigs_posted}</b>
            <br />
            <small>Gigs posted</small>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <b>{user.gigs_completed}</b>
            <br />
            <small>Gigs completed</small>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <b>{user.review_count ? `${user.average_rating} / 5` : 'No ratings yet'}</b>
            <br />
            <small>Average rating ({user.review_count} reviews)</small>
          </div>
        </div>
      </div>

      <h3>Reviews received</h3>
      {reviews.length === 0 && <p>No reviews yet.</p>}
      {reviews.map((r) => (
        <div className="card" key={r.id}>
          <b>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</b> from{' '}
          <Link to={`/profile/${r.reviewer_id}`}>{nameOf(r.reviewer_id)}</Link>
          <p style={{ margin: '6px 0' }}>{r.comment}</p>
          <small>
            Gig: <Link to={`/gigs/${r.gig_id}`}>{gigTitle(r.gig_id)}</Link>
          </small>
        </div>
      ))}

      <h3>Gigs posted</h3>
      {posted.length === 0 && <p>No gigs posted yet.</p>}
      {posted.map((g) => (
        <div className="card" key={g.id}>
          <span className={`badge ${g.status.replace(' ', '')}`}>{g.status}</span>
          <Link to={`/gigs/${g.id}`}>{g.title}</Link>
        </div>
      ))}
    </>
  );
}