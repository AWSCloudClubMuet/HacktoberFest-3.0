import { useCallback, useEffect, useState } from 'react';
import { CATEGORIES, GIG_TYPES, PAYMENT_TYPES, GIG_STATUSES } from '../shared/constants.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/** All data comes from the API. Errors carry the server's message plus any field errors. */
async function api(path, { as, method = 'GET', body } = {}) {
  const res = await fetch(API + path, {
    method,
    headers: { ...(as && { 'X-User-Id': as }), ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const fields = data.error?.fields ? ` ${Object.values(data.error.fields).join(' ')}` : '';
    throw new Error(`${data.error?.message ?? 'Request failed.'}${fields}`);
  }
  return data;
}

const money = (g) => (g.payment_type === 'Paid' ? `Rs ${g.budget.toLocaleString('en-US')}` : g.payment_type === 'SkillSwap' ? 'Skill Swap' : 'Free');
const date = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const rating = (u) => (u?.average_rating ? `★ ${u.average_rating} (${u.review_count})` : 'No reviews yet');
const EMPTY = { q: '', category: '', type: '', payment_type: '', status: '', min_budget: '', max_budget: '', sort: 'newest' };

function Badge({ status }) {
  return <span className={`badge s-${status.replace(' ', '-').toLowerCase()}`}>{status}</span>;
}

function Select({ label, value, onChange, options, any = 'Any' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {any && <option value="">{any}</option>}
        {options.map((o) => <option key={o} value={o}>{o === 'SkillSwap' ? 'Skill Swap' : o}</option>)}
      </select>
    </label>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [me, setMeState] = useState(() => localStorage.getItem('cc-user') || 'u1');
  const [tab, setTab] = useState('browse');
  const [filters, setFilters] = useState(EMPTY);
  const [gigs, setGigs] = useState(null);
  const [detail, setDetail] = useState(null);
  const [myApps, setMyApps] = useState(null);
  const [notice, setNotice] = useState(null);
  const [fatal, setFatal] = useState(null);

  const setMe = (id) => { localStorage.setItem('cc-user', id); setMeState(id); };
  const flash = (text, ok = true) => { setNotice({ text, ok }); setTimeout(() => setNotice(null), 5000); };

  const loadUsers = () => api('/users').then(setUsers).catch((e) => setFatal(`Cannot reach the API at ${API}. Start it with "npm run api". (${e.message})`));
  const loadGigs = useCallback(() => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== ''));
    setGigs(null);
    api(`/gigs?${qs}`).then(setGigs).catch((e) => { setGigs([]); flash(e.message, false); });
  }, [filters]);
  const loadMyApps = useCallback(() => api(`/applications?applicant_id=${me}`, { as: me }).then(setMyApps).catch((e) => flash(e.message, false)), [me]);
  const openGig = useCallback((id) => api(`/gigs/${id}`, { as: me }).then(setDetail).catch((e) => flash(e.message, false)), [me]);

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { loadGigs(); }, [loadGigs]);
  useEffect(() => { if (tab === 'mine') loadMyApps(); }, [tab, loadMyApps]);
  useEffect(() => { if (detail) openGig(detail.id); }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Runs a write, shows the result, and refreshes everything it may have changed. */
  async function act(write, success) {
    try {
      await write();
      flash(success);
      if (detail) await openGig(detail.id);
      loadGigs();
      loadUsers();
      if (tab === 'mine') loadMyApps();
      return true;
    } catch (e) {
      flash(e.message, false);
      return false;
    }
  }

  const current = users.find((u) => u.id === me);
  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="app">
      <header className="top">
        <div className="logo"><span className="mark">C</span>Campus<b>Connect</b></div>
        <nav aria-label="Main">
          {[['browse', 'Browse gigs'], ['post', 'Post a gig'], ['mine', 'My applications'], ['students', 'Students']].map(([id, label]) => (
            <button key={id} className={tab === id ? 'tab active' : 'tab'} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <label className="actas">
          <span>Acting as</span>
          <select value={me} onChange={(e) => setMe(e.target.value)} aria-label="Acting as user">
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
          </select>
        </label>
      </header>

      {fatal && <div className="notice error" role="alert">{fatal}</div>}
      {notice && <div className={`notice ${notice.ok ? 'success' : 'error'}`} role="status" aria-live="polite">{notice.text}</div>}

      <main>
        {current && (
          <section className="hero">
            <div>
              <h1>Hi {current.name.split(' ')[0]} 👋</h1>
              <p className="muted">{current.major} · Semester {current.semester} · {rating(current)} · {current.gigs_posted} posted · {current.gigs_completed} completed</p>
            </div>
            <div className="skills">{current.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
          </section>
        )}

        {tab === 'browse' && (
          <>
            <section className="filters" aria-label="Search and filters">
              <label className="field grow">
                <span>Search</span>
                <input type="search" placeholder="Search titles and descriptions…" value={filters.q} onChange={(e) => set('q')(e.target.value)} />
              </label>
              <Select label="Category" value={filters.category} onChange={set('category')} options={CATEGORIES} />
              <Select label="Type" value={filters.type} onChange={set('type')} options={GIG_TYPES} />
              <Select label="Payment" value={filters.payment_type} onChange={set('payment_type')} options={PAYMENT_TYPES} />
              <Select label="Status" value={filters.status} onChange={set('status')} options={GIG_STATUSES} />
              <label className="field small"><span>Min Rs</span><input type="number" min="0" value={filters.min_budget} onChange={(e) => set('min_budget')(e.target.value)} /></label>
              <label className="field small"><span>Max Rs</span><input type="number" min="0" value={filters.max_budget} onChange={(e) => set('max_budget')(e.target.value)} /></label>
              <Select label="Sort" value={filters.sort} onChange={set('sort')} options={['newest', 'deadline', 'budget_desc', 'budget_asc']} any={null} />
              <button className="btn ghost" onClick={() => setFilters(EMPTY)}>Reset</button>
            </section>
            {gigs === null ? <p className="muted">Loading gigs…</p> : gigs.length === 0 ? (
              <div className="empty">No gigs match these filters. Try clearing some.</div>
            ) : (
              <>
                <p className="muted">{gigs.length} gig{gigs.length === 1 ? '' : 's'}</p>
                <div className="grid">
                  {gigs.map((g) => (
                    <button key={g.id} className="card" onClick={() => openGig(g.id)}>
                      <div className="row"><Badge status={g.status} /><span className="chip">{g.category}</span><span className="chip">{g.type}</span></div>
                      <h3>{g.title}</h3>
                      <p className="desc">{g.description}</p>
                      <div className="row between">
                        <span className={`pay p-${g.payment_type.toLowerCase()}`}>{money(g)}</span>
                        <span className="muted">Due {date(g.deadline)}</span>
                      </div>
                      <div className="muted small">{g.owner.name} · {rating(g.owner)} · {g.application_count} applicant{g.application_count === 1 ? '' : 's'}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'post' && <PostGig me={me} act={act} onDone={() => setTab('browse')} />}

        {tab === 'mine' && (
          <section>
            <h2>My applications</h2>
            {myApps === null ? <p className="muted">Loading…</p> : myApps.length === 0 ? <div className="empty">You haven't applied to any gigs yet.</div> : (
              <div className="list">
                {myApps.map((a) => (
                  <button key={a.id} className="item" onClick={() => openGig(a.gig_id)}>
                    <div><b>{a.gig.title}</b><div className="muted small">to {a.gig.owner.name} · applied {date(a.created_at)}</div></div>
                    <div className="row"><span className="muted small">Gig:</span><Badge status={a.gig.status} /><span className="muted small">You:</span><Badge status={a.status} /></div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'students' && (
          <section>
            <h2>Students</h2>
            <div className="grid">
              {users.map((u) => (
                <div key={u.id} className="card static">
                  <h3>{u.name}</h3>
                  <p className="muted small">{u.major} · Semester {u.semester}</p>
                  <p className="desc">{u.bio}</p>
                  <div className="skills">{u.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                  <div className="row between"><b className="stars">{rating(u)}</b><span className="muted small">{u.gigs_posted} posted · {u.gigs_completed} completed</span></div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {detail && <GigDetail gig={detail} me={me} act={act} close={() => setDetail(null)} />}
    </div>
  );
}

function GigDetail({ gig, me, act, close }) {
  const [message, setMessage] = useState('');
  const [stars, setStars] = useState('5');
  const [comment, setComment] = useState('');
  const v = gig.viewer;
  const patch = (url, body) => () => api(url, { as: me, method: 'PATCH', body });

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div className="overlay" onClick={close}>
      <div className="panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="gig-title">
        <button className="close" onClick={close} aria-label="Close">×</button>
        <div className="row"><Badge status={gig.status} /><span className="chip">{gig.category}</span><span className="chip">{gig.type}</span><span className={`pay p-${gig.payment_type.toLowerCase()}`}>{money(gig)}</span></div>
        <h2 id="gig-title">{gig.title}</h2>
        <p className="muted">Posted by <b>{gig.owner.name}</b> ({rating(gig.owner)}) · Deadline {date(gig.deadline)}</p>
        <p>{gig.description}</p>
        <ol className="steps" aria-label="Lifecycle">
          {['Open', 'In Progress', 'Completed'].map((s) => <li key={s} className={gig.status === s ? 'on' : ''}>{s}</li>)}
          {['Expired', 'Cancelled'].includes(gig.status) && <li className="on off">{gig.status}</li>}
        </ol>
        {gig.accepted_applicant && <p>Accepted applicant: <b>{gig.accepted_applicant.name}</b> ({rating(gig.accepted_applicant)})</p>}

        {v?.is_owner && v.status_actions.length > 0 && (
          <div className="row">
            {v.status_actions.map((s) => (
              <button key={s} className={s === 'Cancelled' ? 'btn danger' : 'btn'}
                onClick={() => window.confirm(`Change this gig to ${s}? This cannot be undone.`) && act(patch(`/gigs/${gig.id}`, { status: s }), `Gig marked ${s}.`)}>
                Mark {s}
              </button>
            ))}
          </div>
        )}

        {v?.is_owner ? (
          <section>
            <h3>Applicants ({gig.applications.length})</h3>
            {gig.applications.length === 0 && <p className="muted">No applications yet.</p>}
            {gig.applications.map((a) => (
              <div key={a.id} className="item">
                <div>
                  <b>{a.applicant.name}</b> <span className="muted small">{rating(a.applicant)}</span> <Badge status={a.status} />
                  <p>{a.message}</p>
                </div>
                {a.status === 'Pending' && (
                  <div className="row">
                    <button className="btn"
                      onClick={() => window.confirm(`Accept ${a.applicant.name}? The gig moves to In Progress and all other pending applicants are rejected.`) && act(patch(`/applications/${a.id}`, { status: 'Accepted' }), `${a.applicant.name} accepted. Gig is now In Progress.`)}>
                      Accept
                    </button>
                    <button className="btn ghost"
                      onClick={() => window.confirm(`Reject ${a.applicant.name}?`) && act(patch(`/applications/${a.id}`, { status: 'Rejected' }), 'Application rejected.')}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        ) : v?.can_apply.ok ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (await act(() => api('/applications', { as: me, method: 'POST', body: { gig_id: gig.id, message } }), 'Application sent!')) setMessage('');
          }}>
            <label className="field"><span>Apply with a short message (10–500 characters)</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={500} placeholder="Why are you a good fit?" />
            </label>
            <button className="btn">Send application</button>
          </form>
        ) : v && (
          <p className="notice info">{v.application && <>Your application: <Badge status={v.application.status} /> </>}{v.can_apply.message}</p>
        )}

        {v?.can_review.ok && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (await act(() => api('/reviews', { as: me, method: 'POST', body: { gig_id: gig.id, rating: Number(stars), comment } }), 'Review posted. Rating updated!')) setComment('');
          }}>
            <h3>Review {v.is_owner ? gig.accepted_applicant?.name : gig.owner.name}</h3>
            <label className="field"><span>Rating</span>
              <select value={stars} onChange={(e) => setStars(e.target.value)}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
            </label>
            <label className="field"><span>Comment</span>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} required minLength={5} maxLength={500} />
            </label>
            <button className="btn">Submit review</button>
          </form>
        )}
        {v && !v.can_review.ok && v.can_review.code !== 'NOT_PARTICIPANT' && <p className="muted small">{v.can_review.message}</p>}

        {gig.reviews.length > 0 && (
          <section>
            <h3>Reviews</h3>
            {gig.reviews.map((r) => (
              <div key={r.id} className="item">
                <div><b>{r.reviewer.name}</b> → {r.reviewee.name} <span className="stars">{'★'.repeat(r.rating)}</span><p>{r.comment}</p></div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function PostGig({ me, act, onDone }) {
  const [f, setF] = useState({ title: '', description: '', type: 'Requesting', category: 'Programming', payment_type: 'Paid', budget: '', deadline: '' });
  const set = (key) => (value) => setF((old) => ({ ...old, [key]: value }));
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  async function submit(e) {
    e.preventDefault();
    const body = {
      ...f,
      budget: f.payment_type === 'Paid' ? (f.budget === '' ? '' : Number(f.budget)) : null,
      deadline: f.deadline ? new Date(`${f.deadline}T23:59:59`).toISOString() : '',
    };
    if (await act(() => api('/gigs', { as: me, method: 'POST', body }), 'Gig posted!')) onDone();
  }

  return (
    <form className="panel inline" onSubmit={submit}>
      <h2>Post a gig</h2>
      <label className="field"><span>Title</span><input value={f.title} onChange={(e) => set('title')(e.target.value)} required minLength={5} maxLength={100} /></label>
      <label className="field"><span>Description</span><textarea value={f.description} onChange={(e) => set('description')(e.target.value)} required minLength={20} maxLength={1000} /></label>
      <div className="row">
        <Select label="Type" value={f.type} onChange={set('type')} options={GIG_TYPES} any={null} />
        <Select label="Category" value={f.category} onChange={set('category')} options={CATEGORIES} any={null} />
        <Select label="Payment" value={f.payment_type} onChange={set('payment_type')} options={PAYMENT_TYPES} any={null} />
        {f.payment_type === 'Paid' && (
          <label className="field"><span>Budget (Rs)</span><input type="number" min="100" max="500000" step="1" value={f.budget} onChange={(e) => set('budget')(e.target.value)} required /></label>
        )}
        <label className="field"><span>Deadline</span><input type="date" min={tomorrow} value={f.deadline} onChange={(e) => set('deadline')(e.target.value)} required /></label>
      </div>
      <button className="btn">Post gig</button>
    </form>
  );
}
