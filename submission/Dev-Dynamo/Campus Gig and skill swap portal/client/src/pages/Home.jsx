import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import Badge from '../components/Badge';
const empty = { q: '', category: '', type: '', payment_type: '', min_budget: '', max_budget: '' };
export default function Home() {
  const [f, setF] = useState(empty), [gigs, setGigs] = useState([]), [err, setErr] = useState('');
  useEffect(() => { const t = setTimeout(() => api.gigs(f).then(setGigs).catch(e => setErr(e.message)), 250); return () => clearTimeout(t); }, [f]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const Sel = ({ k, label, opts }) => <select value={f[k]} onChange={set(k)} aria-label={label}><option value="">{label}</option>{opts.map(o => <option key={o}>{o}</option>)}</select>;
  return (<>
    <h1>Find a gig or offer your skills</h1>
    <div className="filters">
      <input placeholder="Search title or description" value={f.q} onChange={set('q')} />
      <Sel k="category" label="All categories" opts={['Programming', 'Design', 'Writing', 'Tutoring']} />
      <Sel k="type" label="Offering & Requesting" opts={['Offering', 'Requesting']} />
      <Sel k="payment_type" label="Any payment" opts={['Paid', 'SkillSwap', 'Free']} />
      <input type="number" min="0" placeholder="Min budget" value={f.min_budget} onChange={set('min_budget')} />
      <input type="number" min="0" placeholder="Max budget" value={f.max_budget} onChange={set('max_budget')} />
      <button className="ghost" onClick={() => setF(empty)}>Clear filters</button>
    </div>
    {err && <p className="error">{err}. Is the server running on port 5000?</p>}
    <div className="grid">
      {gigs.map(g => (
        <Link to={`/gigs/${g.id}`} key={g.id} className="card">
          <div className="row"><Badge value={g.type} /><Badge value={g.status} /></div>
          <h3>{g.title}</h3>
          <p>{g.description}</p>
          <div className="meta"><span>{g.category}</span><span>{g.payment_type === 'Paid' ? `Rs ${g.budget}` : g.payment_type === 'SkillSwap' ? 'Skill swap' : 'Free'}</span><span>Due {g.deadline}</span></div>
        </Link>
      ))}
    </div>
    {!gigs.length && !err && <p className="empty">No gigs match these filters. Try clearing them or post your own gig.</p>}
  </>);
}
