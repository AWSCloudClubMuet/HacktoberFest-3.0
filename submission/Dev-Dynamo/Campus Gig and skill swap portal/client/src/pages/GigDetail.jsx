import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/api';
import { useUser } from '../context/UserContext';
import Badge from '../components/Badge';
export default function GigDetail() {
  const { id } = useParams(), { currentId, users } = useUser();
  const [gig, setGig] = useState(null), [apps, setApps] = useState([]), [revs, setRevs] = useState([]);
  const [msg, setMsg] = useState(''), [rate, setRate] = useState(5), [comment, setComment] = useState(''), [err, setErr] = useState(''), [ok, setOk] = useState('');
  const load = useCallback(async () => {
    const [g, a, r] = await Promise.all([api.gig(id), api.applications({ gig_id: id }), api.reviews({ gig_id: id })]);
    setGig(g); setApps(a); setRevs(r);
  }, [id]);
  useEffect(() => { load().catch(e => setErr(e.message)); }, [load]);
  const run = async fn => { setErr(''); setOk(''); try { await fn(); await load(); } catch (e) { setErr(e.message); } };
  if (!gig) return <p>{err || 'Loading...'}</p>;
  const name = uid => users.find(u => u.id === uid)?.name || `User ${uid}`;
  const isOwner = gig.user_id === currentId, isAccepted = gig.accepted_applicant_id === currentId;
  const mine = apps.find(a => a.applicant_id === currentId);
  const reviewed = revs.some(r => r.reviewer_id === currentId);
  return (<>
    <div className="panel">
      <div className="row"><Badge value={gig.type} /><Badge value={gig.status} /><Badge value={gig.category} /></div>
      <h1>{gig.title}</h1>
      <p>{gig.description}</p>
      <div className="meta"><span>Posted by <Link to={`/profile/${gig.user_id}`}>{name(gig.user_id)}</Link></span><span>{gig.payment_type === 'Paid' ? `Rs ${gig.budget}` : gig.payment_type}</span><span>Deadline {gig.deadline}</span></div>
      {gig.accepted_applicant_id && <p>Accepted: <Link to={`/profile/${gig.accepted_applicant_id}`}>{name(gig.accepted_applicant_id)}</Link></p>}
      {isOwner && <div className="row">
        {gig.status === 'In Progress' && <button onClick={() => run(() => api.updateGig(gig.id, { actor_id: currentId, status: 'Completed' }))}>Mark as completed</button>}
        {['Open', 'In Progress'].includes(gig.status) && <button className="ghost" onClick={() => run(() => api.updateGig(gig.id, { actor_id: currentId, status: 'Cancelled' }))}>Cancel gig</button>}
      </div>}
      {err && <p className="error">{err}</p>}{ok && <p className="success">{ok}</p>}
    </div>

    {!isOwner && gig.status === 'Open' && !mine && (
      <form className="panel form" onSubmit={e => { e.preventDefault(); run(async () => { await api.apply({ gig_id: gig.id, applicant_id: currentId, message: msg }); setMsg(''); setOk('Application sent.'); }); }}>
        <h2>Apply to this gig</h2>
        <textarea rows="3" placeholder="Tell the poster why you are a good fit" value={msg} onChange={e => setMsg(e.target.value)} required />
        <button>Send application</button>
      </form>
    )}
    {mine && <p className="panel">Your application: <Badge value={mine.status} /></p>}

    {isOwner && (
      <div className="panel"><h2>Applications ({apps.length})</h2>
        {!apps.length && <p className="empty">No applications yet.</p>}
        {apps.map(a => (
          <div key={a.id} className="item">
            <div><Link to={`/profile/${a.applicant_id}`}><b>{a.applicant?.name}</b></Link> <Badge value={a.status} /><p>{a.message}</p></div>
            {a.status === 'Pending' && gig.status === 'Open' && <div className="row">
              <button onClick={() => run(() => api.decide(a.id, { actor_id: currentId, status: 'Accepted' }))}>Accept</button>
              <button className="ghost" onClick={() => run(() => api.decide(a.id, { actor_id: currentId, status: 'Rejected' }))}>Reject</button>
            </div>}
          </div>
        ))}
      </div>
    )}

    {gig.status === 'Completed' && (
      <div className="panel"><h2>Reviews</h2>
        {!revs.length && <p className="empty">No reviews yet.</p>}
        {revs.map(r => <div key={r.id} className="item"><div><b>{r.reviewer?.name}</b> rated {name(r.reviewee_id)} {'★'.repeat(r.rating)}<p>{r.comment}</p></div></div>)}
        {(isOwner || isAccepted) && !reviewed && (
          <form className="form" onSubmit={e => { e.preventDefault(); run(async () => { await api.review({ gig_id: gig.id, reviewer_id: currentId, rating: rate, comment }); setComment(''); }); }}>
            <label>Rate {name(isOwner ? gig.accepted_applicant_id : gig.user_id)}
              <select value={rate} onChange={e => setRate(+e.target.value)}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 && 's'}</option>)}</select></label>
            <textarea rows="2" placeholder="Leave a comment" value={comment} onChange={e => setComment(e.target.value)} />
            <button>Submit review</button>
          </form>
        )}
      </div>
    )}
  </>);
}
