import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/api';
import Badge from '../components/Badge';
export default function Profile() {
  const { id } = useParams(), [u, setU] = useState(null), [revs, setRevs] = useState([]), [gigs, setGigs] = useState([]);
  useEffect(() => { api.user(id).then(setU); api.reviews({ reviewee_id: id }).then(setRevs); api.gigs({ user_id: id }).then(setGigs); }, [id]);
  if (!u) return <p>Loading...</p>;
  return (<>
    <div className="panel">
      <h1>{u.name}</h1>
      <p>{u.major}, semester {u.semester}</p><p>{u.bio}</p>
      <div className="row">{u.skills.map(s => <Badge key={s} value={s} />)}</div>
      <div className="stats">
        <div><b>{u.gigs_posted}</b>gigs posted</div>
        <div><b>{u.gigs_completed}</b>gigs completed</div>
        <div><b>{u.average_rating ?? 'New'}</b>{u.review_count ? `average from ${u.review_count} reviews` : 'no reviews yet'}</div>
      </div>
    </div>
    <h2>Reviews received</h2>
    {!revs.length && <p className="empty">No reviews yet.</p>}
    {revs.map(r => <div key={r.id} className="panel"><b>{'★'.repeat(r.rating)}</b> from {r.reviewer?.name} on <Link to={`/gigs/${r.gig_id}`}>{r.gig?.title}</Link><p>{r.comment}</p></div>)}
    <h2>Gigs posted</h2>
    {gigs.map(g => <Link key={g.id} to={`/gigs/${g.id}`} className="panel item"><b>{g.title}</b><Badge value={g.status} /></Link>)}
  </>);
}
