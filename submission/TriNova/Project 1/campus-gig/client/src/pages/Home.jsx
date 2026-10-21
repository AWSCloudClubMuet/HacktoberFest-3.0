import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useUser } from '../UserContext';
import '../App.css';

const emptyFilters = { q: '', category: '', type: '', payment_type: '', minBudget: '', maxBudget: '' };
const ICONS = { Programming: '💻', Design: '🎨', Writing: '✍️', Tutoring: '📚' };

const initials = (name = '') =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function Home() {
  const { users } = useUser();
  const [filters, setFilters] = useState(emptyFilters);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .getGigs(filters)
        .then((data) => {
          setGigs(data);
          setError('');
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const set = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });
  const nameOf = (id) => users.find((u) => u.id === id)?.name || '';
  const openCount = gigs.filter((g) => g.status === 'Open').length;

  return (
    <>
      <section className="hero">
        <h1>Find help. Offer your skills. Build your reputation.</h1>
        <p>The campus marketplace for paid gigs, skill swaps and free help between students.</p>
        <div className="hero-search">
          <input
            placeholder="Search gigs by title or description..."
            value={filters.q}
            onChange={set('q')}
          />
        </div>
        <div className="hero-stats">
          <div><b>{users.length}</b><span>Students</span></div>
          <div><b>{gigs.length}</b><span>Gigs shown</span></div>
          <div><b>{openCount}</b><span>Open now</span></div>
        </div>
      </section>

      <div className="filter-bar">
        <select value={filters.category} onChange={set('category')}>
          <option value="">All categories</option>
          <option>Programming</option>
          <option>Design</option>
          <option>Writing</option>
          <option>Tutoring</option>
        </select>
        <select value={filters.type} onChange={set('type')}>
          <option value="">Offering and Requesting</option>
          <option>Offering</option>
          <option>Requesting</option>
        </select>
        <select value={filters.payment_type} onChange={set('payment_type')}>
          <option value="">All payment types</option>
          <option value="Paid">Paid</option>
          <option value="SkillSwap">Skill Swap</option>
          <option value="Free">Free</option>
        </select>
        <input type="number" placeholder="Min budget" value={filters.minBudget} onChange={set('minBudget')} />
        <input type="number" placeholder="Max budget" value={filters.maxBudget} onChange={set('maxBudget')} />
        <button className="secondary" onClick={() => setFilters(emptyFilters)}>Clear</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="result-count">Loading gigs...</p>}
      {!loading && !error && gigs.length === 0 && <p className="result-count">No gigs match your filters.</p>}
      {!loading && gigs.length > 0 && <p className="result-count">{gigs.length} gigs found</p>}

      <div className="grid">
        {gigs.map((g) => (
          <div className="card gig-card" key={g.id}>
            <div className="gig-top">
              <span className="cat">
                <span className={`cat-icon cat-${g.category}`}>{ICONS[g.category]}</span>
                {g.category}
              </span>
              <span className={`badge ${g.status.replace(' ', '')}`} style={{ margin: 0 }}>{g.status}</span>
            </div>

            <h3 className="gig-title">
              <Link to={`/gigs/${g.id}`}>{g.title}</Link>
            </h3>
            <p className="gig-desc">{g.description}</p>

            <div className="gig-meta">
              <span className="badge">{g.type}</span>
              <span className="badge">{g.payment_type === 'SkillSwap' ? 'Skill Swap' : g.payment_type}</span>
            </div>

            <div className="gig-footer">
              <Link to={`/profile/${g.user_id}`} className="poster">
                <span className="avatar">{initials(nameOf(g.user_id))}</span>
                <span>{nameOf(g.user_id)}</span>
              </Link>
              <span className={`price ${g.payment_type === 'Paid' ? '' : 'free'}`}>
                {g.payment_type === 'Paid' ? `Rs. ${g.budget}` : g.payment_type === 'SkillSwap' ? 'Skill Swap' : 'Free'}
              </span>
            </div>
            <div className="deadline">Deadline: {g.deadline}</div>
          </div>
        ))}
      </div>
    </>
  );
}