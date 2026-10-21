import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useUser } from '../UserContext';

export default function MyApplications() {
  const { currentUser } = useUser();
  const [applications, setApplications] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    Promise.all([api.getApplications({ applicant_id: currentUser.id }), api.getGigs()])
      .then(([a, g]) => {
        setApplications(a);
        setGigs(g);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) return <p>Loading...</p>;

  const gigOf = (gid) => gigs.find((g) => g.id === gid);

  return (
    <>
      <h2>My Applications</h2>
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && applications.length === 0 && <p>You have not applied to any gigs yet.</p>}

      {applications.map((a) => {
        const gig = gigOf(a.gig_id);
        return (
          <div className="card" key={a.id}>
            <span className="badge">{a.status}</span>
            {gig && <span className={`badge ${gig.status.replace(' ', '')}`}>Gig: {gig.status}</span>}
            <h3 style={{ margin: '10px 0 6px' }}>
              <Link to={`/gigs/${a.gig_id}`}>{gig ? gig.title : a.gig_id}</Link>
            </h3>
            <p style={{ margin: 0 }}>{a.message}</p>
          </div>
        );
      })}
    </>
  );
}