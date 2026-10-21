import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Bell, BookOpen, BriefcaseBusiness, Check, ChevronDown,
  CircleDollarSign, Clock3, Code2, GraduationCap, Handshake, LayoutGrid, Menu,
  LogOut, MessageSquareText, Palette, Plus, Search, Settings, SlidersHorizontal,
  Sparkles, Star, Bookmark, UserRound, UsersRound, X, Zap,
} from 'lucide-react'
import Auth from './Auth.jsx'

const categories = ['All', 'Programming', 'Design', 'Writing', 'Tutoring']
const types = ['All', 'Offering', 'Requesting']
const payments = ['All', 'Paid', 'SkillSwap', 'Free']
const statusClass = (value) => `status status-${value.toLowerCase().replaceAll(' ', '-')}`
const initials = (name = '') => name.split(' ').map((part) => part[0]).join('').slice(0, 2)
const money = (value) => new Intl.NumberFormat('en-PK').format(value)
const api = async (url, options) => {
  const token = localStorage.getItem('campusloop_token')
  const response = await fetch(`/api${url}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options?.headers || {}) } })
  const data = await response.json().catch(() => ({ error: 'The server returned an unexpected response.' }))
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}

function Avatar({ user, size = 'md' }) {
  return <span className={`avatar avatar-${size}`} style={{ background: user?.avatar_color || '#567368' }}>{initials(user?.name)}</span>
}

function Stars({ value = 0, interactive = false, onChange }) {
  return <span className={`stars ${interactive ? 'interactive' : ''}`} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} disabled={!interactive} onClick={() => onChange?.(star)} aria-label={`${star} stars`}><Star size={interactive ? 25 : 14} fill={star <= value ? 'currentColor' : 'none'} /></button>)}
  </span>
}

function Toast({ toast, close }) {
  if (!toast) return null
  return <div className={`toast ${toast.type || ''}`}><span className="toast-icon">{toast.type === 'error' ? <X size={16} /> : <Check size={16} />}</span><span>{toast.message}</span><button onClick={close}><X size={15} /></button></div>
}

function Navbar({ currentUser, page, setPage, openCreate, logout, savedCount }) {
  const [mobile, setMobile] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  return <header className="navbar">
    <button className="brand" onClick={() => setPage('discover')}><span className="brand-mark"><Handshake size={22} /></span><span>Campus<span>Loop</span></span></button>
    <nav className={mobile ? 'nav-open' : ''}>
      <button className={page === 'discover' ? 'active' : ''} onClick={() => { setPage('discover'); setMobile(false) }}>Discover</button>
      <button className={page === 'my-gigs' ? 'active' : ''} onClick={() => { setPage('my-gigs'); setMobile(false) }}>My gigs</button>
      <button className={page === 'applications' ? 'active' : ''} onClick={() => { setPage('applications'); setMobile(false) }}>Applications</button>
      <button className={page === 'saved' ? 'active' : ''} onClick={() => { setPage('saved'); setMobile(false) }}>Saved {savedCount > 0 && <span className="nav-count">{savedCount}</span>}</button>
      <button className={page === 'profile' ? 'active' : ''} onClick={() => { setPage('profile'); setMobile(false) }}>Profile</button>
    </nav>
    <div className="nav-actions">
      <button className="create-nav" onClick={openCreate}><Plus size={17} /> Post a gig</button>
      <button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>
      <button className="user-switch" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}>
        <Avatar user={currentUser} size="sm" />
        <span>{currentUser?.name?.split(' ')[0]}</span><ChevronDown size={14} />
      </button>
      {accountOpen && <div className="account-menu"><div><Avatar user={currentUser} /><span><strong>{currentUser.name}</strong><small>{currentUser.email}</small></span></div><button onClick={() => { setPage('profile'); setAccountOpen(false) }}><Settings size={16} /> Profile settings</button><button className="logout" onClick={logout}><LogOut size={16} /> Sign out</button></div>}
      <button className="mobile-menu" onClick={() => setMobile(!mobile)} aria-label="Open menu"><Menu /></button>
    </div>
  </header>
}

function Hero({ count, setSearch, openCreate }) {
  const [term, setTerm] = useState('')
  const submit = (e) => { e.preventDefault(); setSearch(term); document.querySelector('.browse-section')?.scrollIntoView({ behavior: 'smooth' }) }
  return <section className="hero">
    <div className="hero-scribble scribble-one" /><div className="hero-scribble scribble-two" />
    <div className="hero-kicker"><Sparkles size={14} /> BUILT FOR CAMPUS, BY CAMPUS</div>
    <h1>Skills to share.<br /><em>Things to get done.</em></h1>
    <p>Find trusted students for your next project, or turn what you know into your next opportunity.</p>
    <form className="hero-search" onSubmit={submit}>
      <Search size={20} /><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="What do you need help with?" /><button>Find a gig <ArrowRight size={17} /></button>
    </form>
    <div className="hero-meta"><span><span className="avatar-stack"><i>AK</i><i>HM</i><i>SR</i></span><strong>240+</strong> students onboard</span><span className="dot" /><span><strong>{count}</strong> gigs live right now</span></div>
    <button className="hero-post" onClick={openCreate}><Plus /> Post your own gig</button>
  </section>
}

const categoryIcons = { Programming: Code2, Design: Palette, Writing: BookOpen, Tutoring: GraduationCap }

function FilterBar({ filters, setFilters }) {
  const set = (key, value) => setFilters((old) => ({ ...old, [key]: value }))
  const activeCount = ['type', 'payment_type'].filter((k) => filters[k] !== 'All').length
  return <div className="filter-wrap">
    <div className="category-tabs">
      {categories.map((item) => { const Icon = item === 'All' ? LayoutGrid : categoryIcons[item]; return <button key={item} className={filters.category === item ? 'active' : ''} onClick={() => set('category', item)}><Icon size={16} /> {item}</button> })}
    </div>
    <div className="filter-controls">
      <label><SlidersHorizontal size={16} /><select value={filters.type} onChange={(e) => set('type', e.target.value)}>{types.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label><CircleDollarSign size={16} /><select value={filters.payment_type} onChange={(e) => set('payment_type', e.target.value)}>{payments.map((x) => <option key={x}>{x}</option>)}</select></label>
      {activeCount > 0 && <button className="clear-filter" onClick={() => setFilters((f) => ({ ...f, type: 'All', payment_type: 'All' }))}>Clear {activeCount}</button>}
    </div>
  </div>
}

function GigCard({ gig, open, saved = false, toggleSaved }) {
  const Icon = categoryIcons[gig.category]
  const days = Math.max(0, Math.ceil((new Date(gig.deadline) - new Date()) / 86400000))
  return <article className="gig-card" onClick={() => open(gig)} tabIndex="0" onKeyDown={(e) => e.key === 'Enter' && open(gig)}>
    <div className="gig-top"><span className={`category-icon cat-${gig.category.toLowerCase()}`}><Icon size={19} /></span><span className={statusClass(gig.type)}>{gig.type}</span>{toggleSaved && <button className={`save-gig ${saved ? 'saved' : ''}`} aria-label={saved ? 'Remove from saved gigs' : 'Save gig'} onClick={(event) => { event.stopPropagation(); toggleSaved(gig.id) }}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button>}<button aria-label="Open gig"><ArrowRight size={18} /></button></div>
    <h3>{gig.title}</h3><p>{gig.description}</p>
    <div className="gig-tags"><span>{gig.category}</span><span className={`pay-${gig.payment_type.toLowerCase()}`}>{gig.payment_type === 'SkillSwap' ? 'Skill swap' : gig.payment_type}</span></div>
    <div className="gig-footer">
      <span className="owner"><Avatar user={gig.owner} size="xs" /><span>{gig.owner?.name}<small><Star size={11} fill="currentColor" /> {gig.owner?.average_rating || 'New'}</small></span></span>
      <span className="gig-price">{gig.payment_type === 'Paid' ? <>PKR {money(gig.budget)}<small>fixed budget</small></> : <>{gig.payment_type === 'Free' ? 'Goodwill' : 'Skill for skill'}<small>{days} days left</small></>}</span>
    </div>
  </article>
}

function CategoryMark({ category, size = 19 }) {
  const Icon = categoryIcons[category]
  return <span className={`category-icon cat-${category.toLowerCase()}`}><Icon size={size} /></span>
}

function EmptyState({ title, copy, action }) {
  return <div className="empty"><span><Search /></span><h3>{title}</h3><p>{copy}</p>{action}</div>
}

function Discover({ gigs, filters, setFilters, loading, openGig, openCreate, savedIds, toggleSaved }) {
  const open = gigs.filter((g) => g.status === 'Open')
  return <>
    <Hero count={open.length} setSearch={(q) => setFilters((f) => ({ ...f, q }))} openCreate={openCreate} />
    <main className="page browse-section">
      <div className="section-head"><div><span className="eyebrow">EXPLORE OPPORTUNITIES</span><h2>Find your next campus gig</h2><p>Fresh opportunities from students across campus.</p></div><div className="inline-search"><Search size={17} /><input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search gigs" />{filters.q && <button onClick={() => setFilters((f) => ({ ...f, q: '' }))}><X size={15} /></button>}</div></div>
      <FilterBar filters={filters} setFilters={setFilters} />
      <div className="results-line"><strong>{open.length} opportunities</strong><span>Sorted by newest</span></div>
      {loading ? <div className="skeleton-grid">{[1,2,3,4,5,6].map((x) => <div key={x} />)}</div> : open.length ? <div className="gig-grid">{open.map((gig) => <GigCard key={gig.id} gig={gig} open={openGig} saved={savedIds.includes(gig.id)} toggleSaved={toggleSaved} />)}</div> : <EmptyState title="No gigs found" copy="Try a different search or clear your filters." action={<button className="primary" onClick={() => setFilters({ category: 'All', type: 'All', payment_type: 'All', q: '' })}>Clear filters</button>} />}
      <section className="cta-band"><div><span className="cta-icon"><Zap /></span><div><h3>Have a skill someone needs?</h3><p>Post an offering and start building your campus reputation.</p></div></div><button onClick={openCreate}>Share your skill <ArrowRight size={17} /></button></section>
    </main>
  </>
}

function PanelHeader({ eyebrow, title, copy, action }) {
  return <div className="panel-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</div>
}

function MyGigs({ gigs, currentUser, openGig, openCreate }) {
  const own = gigs.filter((g) => g.user_id === currentUser.id)
  return <main className="page inner-page"><PanelHeader eyebrow="YOUR WORKSPACE" title="My gigs" copy="Manage the opportunities you have shared with campus." action={<button className="primary" onClick={openCreate}><Plus size={17} /> Post a gig</button>} />
    <div className="stats-row"><div><BriefcaseBusiness /><strong>{own.length}</strong><span>Total posted</span></div><div><Clock3 /><strong>{own.filter((g) => g.status === 'Open').length}</strong><span>Open now</span></div><div><UsersRound /><strong>{own.reduce((n, g) => n + g.applications_count, 0)}</strong><span>Applications</span></div><div><Check /><strong>{own.filter((g) => g.status === 'Completed').length}</strong><span>Completed</span></div></div>
    {own.length ? <div className="manage-list">{own.map((gig) => <div className="manage-row" key={gig.id} onClick={() => openGig(gig)}><CategoryMark category={gig.category} /><div className="manage-main"><h3>{gig.title}</h3><p>{gig.category} · {gig.type}</p></div><span className={statusClass(gig.status)}>{gig.status}</span><span className="app-count"><UsersRound size={16} /> {gig.applications_count}</span><ArrowRight size={18} /></div>)}</div> : <EmptyState title="No gigs yet" copy="Post your first offer or request to get started." />}
  </main>
}

function Applications({ applications, openGig }) {
  return <main className="page inner-page"><PanelHeader eyebrow="KEEP TRACK" title="Your applications" copy="Follow every opportunity you have reached out for." />
    <div className="application-list">{applications.length ? applications.map((item) => <article key={item.id} className="application-row"><div><span className="application-date">APPLIED {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</span><h3>{item.gig?.title}</h3><p>“{item.message}”</p><button onClick={() => openGig(item.gig)}>View gig <ArrowRight size={14} /></button></div><span className={statusClass(item.status)}>{item.status}</span></article>) : <EmptyState title="No applications yet" copy="Browse open gigs and introduce yourself to another student." />}</div>
  </main>
}

function SavedGigs({ gigs, savedIds, toggleSaved, openGig, setPage }) {
  const saved = gigs.filter((gig) => savedIds.includes(gig.id))
  return <main className="page inner-page"><PanelHeader eyebrow="YOUR SHORTLIST" title="Saved gigs" copy="Keep promising opportunities close while you decide." />
    {saved.length ? <div className="gig-grid">{saved.map((gig) => <GigCard key={gig.id} gig={gig} open={openGig} saved toggleSaved={toggleSaved} />)}</div> : <EmptyState title="Nothing saved yet" copy="Tap the bookmark on a gig to add it to your shortlist." action={<button className="primary" onClick={() => setPage('discover')}>Browse opportunities</button>} />}
  </main>
}

function Profile({ user, reviews, editProfile }) {
  return <main className="page inner-page profile-page">
    <section className="profile-hero"><Avatar user={user} size="xl" /><div className="profile-copy"><span className="eyebrow">STUDENT PROFILE</span><h1>{user.name}</h1><p><GraduationCap size={16} /> {user.major} · Semester {user.semester}</p><div className="profile-rating"><Star size={17} fill="currentColor" /> <strong>{user.average_rating || 'New'}</strong>{user.reviews_count ? <span>from {user.reviews_count} review{user.reviews_count !== 1 ? 's' : ''}</span> : <span>No reviews yet</span>}</div></div><button className="secondary" onClick={editProfile}>Edit profile</button></section>
    <div className="profile-grid"><section className="profile-card"><h2>About</h2><p>{user.bio}</p><h3>Skills</h3><div className="skills">{user.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></section><section className="profile-card profile-numbers"><h2>Campus activity</h2><div><span><strong>{user.gigs_posted}</strong>Gigs posted</span><span><strong>{user.gigs_completed}</strong>Gigs completed</span><span><strong>{user.reviews_count}</strong>Reviews earned</span></div></section></div>
    <section className="reviews-section"><h2>What students say</h2>{reviews.length ? <div className="review-grid">{reviews.map((review) => <article key={review.id}><Stars value={review.rating} /><p>“{review.comment}”</p><span><Avatar user={review.reviewer} size="xs" /> {review.reviewer?.name}</span></article>)}</div> : <p className="muted">No reviews yet. Complete a gig to start building reputation.</p>}</section>
  </main>
}

function EditProfile({ user, close, saved, notify }) {
  const [form, setForm] = useState({ name: user.name, major: user.major, bio: user.bio || '', skills: user.skills.join(', ') })
  const [busy, setBusy] = useState(false)
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const submit = async (event) => { event.preventDefault(); setBusy(true); try { const updated = await api('/users/me', { method: 'PATCH', body: JSON.stringify({ ...form, skills: form.skills.split(',') }) }); saved(updated); notify('Profile updated.'); close() } catch (err) { notify(err.message, 'error') } finally { setBusy(false) } }
  return <Modal close={close}><div className="modal-title"><span className="modal-icon"><UserRound /></span><div><span className="eyebrow">PROFILE SETTINGS</span><h2>Edit your profile</h2><p>Help other students understand what you do best.</p></div></div><form className="gig-form" onSubmit={submit}><label>Full name<input required value={form.name} onChange={(e) => set('name', e.target.value)} /></label><label>Major<input required value={form.major} onChange={(e) => set('major', e.target.value)} /></label><label>About you<textarea rows="4" maxLength="280" value={form.bio} onChange={(e) => set('bio', e.target.value)} /></label><label>Skills <small className="field-hint">Separate skills with commas</small><input value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="React, Figma, Tutoring" /></label><div className="modal-actions"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div></form></Modal>
}

function CreateGig({ currentUser, close, onCreated, notify }) {
  const [form, setForm] = useState({ type: 'Requesting', title: '', description: '', category: 'Programming', payment_type: 'Paid', budget: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const submit = async (e) => { e.preventDefault(); setSaving(true); try { const gig = await api('/gigs', { method: 'POST', body: JSON.stringify(form) }); onCreated(gig); notify('Your gig is live!'); close() } catch (err) { notify(err.message, 'error') } finally { setSaving(false) } }
  return <Modal close={close} wide><div className="modal-title"><span className="modal-icon"><Plus /></span><div><span className="eyebrow">CREATE AN OPPORTUNITY</span><h2>Post a new gig</h2><p>Share what you need—or what you can offer.</p></div></div>
    <form className="gig-form" onSubmit={submit}>
      <fieldset><legend>What kind of gig is this?</legend><div className="segmented"><button type="button" className={form.type === 'Requesting' ? 'active' : ''} onClick={() => set('type', 'Requesting')}><Search /> I need help<small>Request a skill</small></button><button type="button" className={form.type === 'Offering' ? 'active' : ''} onClick={() => set('type', 'Offering')}><Sparkles /> I can help<small>Offer your skill</small></button></div></fieldset>
      <label>Gig title<input required maxLength="80" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Design a poster for our society event" /></label>
      <label>Description<textarea required rows="4" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the outcome, context, and what a great collaboration looks like…" /></label>
      <div className="form-row"><label>Category<select value={form.category} onChange={(e) => set('category', e.target.value)}>{categories.slice(1).map((x) => <option key={x}>{x}</option>)}</select></label><label>Payment type<select value={form.payment_type} onChange={(e) => set('payment_type', e.target.value)}>{payments.slice(1).map((x) => <option key={x}>{x === 'SkillSwap' ? 'Skill swap' : x}</option>)}</select></label></div>
      <div className="form-row">{form.payment_type === 'Paid' && <label>Budget (PKR)<input required type="number" min="1" value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="2500" /></label>}<label>Deadline<input required type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} /></label></div>
      <div className="modal-actions"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Publishing…' : 'Publish gig'} <ArrowRight size={16} /></button></div>
    </form>
  </Modal>
}

function Modal({ children, close, wide = false }) {
  useEffect(() => { const fn = (e) => e.key === 'Escape' && close(); document.addEventListener('keydown', fn); document.body.classList.add('modal-open'); return () => { document.removeEventListener('keydown', fn); document.body.classList.remove('modal-open') } }, [close])
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className={`modal ${wide ? 'modal-wide' : ''}`}><button className="modal-close" onClick={close} aria-label="Close"><X /></button>{children}</div></div>
}

function ApplyForm({ gig, user, submitted, notify }) {
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e) => { e.preventDefault(); setSaving(true); try { await api('/applications', { method: 'POST', body: JSON.stringify({ gig_id: gig.id, message }) }); submitted(); notify('Application sent! Good luck.'); } catch (err) { notify(err.message, 'error') } finally { setSaving(false) } }
  return <form className="apply-box" onSubmit={submit}><div><MessageSquareText /><span><strong>Interested?</strong><small>Introduce yourself to {gig.owner.name.split(' ')[0]}.</small></span></div><textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share why you’re a great fit…" rows="3" /><button className="primary" disabled={saving}>{saving ? 'Sending…' : 'Send application'} <ArrowRight size={16} /></button></form>
}

function ReviewForm({ gig, currentUser, users, close, done, notify }) {
  const [rating, setRating] = useState(5); const [comment, setComment] = useState('')
  const revieweeId = gig.user_id === currentUser.id ? gig.accepted_applicant_id : gig.user_id
  const reviewee = users.find((u) => u.id === revieweeId)
  const submit = async (e) => { e.preventDefault(); try { await api('/reviews', { method: 'POST', body: JSON.stringify({ gig_id: gig.id, reviewee_id: revieweeId, rating, comment }) }); notify(`Review shared for ${reviewee.name}.`); done(); close() } catch (err) { notify(err.message, 'error') } }
  return <Modal close={close}><div className="review-form"><span className="modal-icon"><Star /></span><h2>How was working with {reviewee?.name.split(' ')[0]}?</h2><p>Your review helps everyone build trust on campus.</p><form onSubmit={submit}><Stars value={rating} interactive onChange={setRating} /><textarea required rows="4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share something helpful about the collaboration…" /><button className="primary">Share review</button></form></div></Modal>
}

function GigDetail({ gig, currentUser, users, close, refresh, notify }) {
  const [applications, setApplications] = useState([]); const [showReview, setShowReview] = useState(false); const [busy, setBusy] = useState(false)
  const owner = gig.user_id === currentUser.id
  const participant = gig.accepted_applicant_id === currentUser.id
  const loadApps = () => api(`/applications?gig_id=${gig.id}`).then(setApplications)
  useEffect(() => { loadApps() }, [gig.id])
  const updateApplication = async (id, status) => { setBusy(true); try { await api(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); notify(status === 'Accepted' ? 'Applicant selected. The gig is now in progress.' : 'Application declined.'); await loadApps(); await refresh() } catch (err) { notify(err.message, 'error') } finally { setBusy(false) } }
  const complete = async () => { setBusy(true); try { await api(`/gigs/${gig.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Completed' }) }); notify('Gig completed—nice work!'); await refresh(); close() } catch (err) { notify(err.message, 'error') } finally { setBusy(false) } }
  const alreadyApplied = applications.some((a) => a.applicant_id === currentUser.id)
  return <><Modal close={close} wide><div className="detail-head"><CategoryMark category={gig.category} size={22} /><div><div className="detail-badges"><span className={statusClass(gig.type)}>{gig.type}</span><span className={statusClass(gig.status)}>{gig.status}</span></div><h2>{gig.title}</h2></div></div>
    <div className="detail-layout"><div className="detail-main"><h3>About this gig</h3><p>{gig.description}</p><div className="detail-meta"><span><Palette />Category<strong>{gig.category}</strong></span><span><CircleDollarSign />Compensation<strong>{gig.payment_type === 'Paid' ? `PKR ${money(gig.budget)}` : gig.payment_type === 'SkillSwap' ? 'Skill swap' : 'Free'}</strong></span><span><Clock3 />Deadline<strong>{new Date(gig.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span></div>
      {owner && <section className="applicants"><div className="subhead"><h3>Applicants</h3><span>{applications.length}</span></div>{applications.length ? applications.map((item) => <article key={item.id}><Avatar user={item.applicant} /><div><h4>{item.applicant.name}<span>{item.applicant.major}</span></h4><p>“{item.message}”</p><div className="skills">{item.applicant.skills.slice(0, 3).map((x) => <span key={x}>{x}</span>)}</div></div><div className="app-actions">{item.status === 'Pending' && gig.status === 'Open' ? <><button disabled={busy} className="accept" onClick={() => updateApplication(item.id, 'Accepted')}><Check size={15} /> Accept</button><button disabled={busy} onClick={() => updateApplication(item.id, 'Rejected')}><X size={15} /> Decline</button></> : <span className={statusClass(item.status)}>{item.status}</span>}</div></article>) : <p className="muted">No applications yet. Check back soon.</p>}</section>}
    </div><aside className="detail-aside"><div className="owner-card"><span>POSTED BY</span><Avatar user={gig.owner} size="lg" /><h3>{gig.owner.name}</h3><p>{gig.owner.major}</p><div><Star size={15} fill="currentColor" /><strong>{gig.owner.average_rating || 'New'}</strong><span>{gig.owner.reviews_count ? `${gig.owner.reviews_count} reviews` : 'No reviews yet'}</span></div><div className="skills">{gig.owner.skills.map((x) => <span key={x}>{x}</span>)}</div></div>
      {!owner && gig.status === 'Open' && (alreadyApplied ? <div className="already-applied"><Check /> Application sent<span>We’ll keep the status updated.</span></div> : <ApplyForm gig={gig} user={currentUser} submitted={loadApps} notify={notify} />)}
      {owner && gig.status === 'In Progress' && <button className="primary full" onClick={complete} disabled={busy}><Check size={17} /> Mark as completed</button>}
      {(owner || participant) && gig.status === 'Completed' && <button className="primary full" onClick={() => setShowReview(true)}><Star size={17} /> Leave a review</button>}
    </aside></div>
  </Modal>{showReview && <ReviewForm gig={gig} currentUser={currentUser} users={users} close={() => setShowReview(false)} done={refresh} notify={notify} />}</>
}

export default function App() {
  const [users, setUsers] = useState([]); const [currentUser, setCurrentUser] = useState(null); const [gigs, setGigs] = useState([]); const [allGigs, setAllGigs] = useState([]); const [applications, setApplications] = useState([]); const [reviews, setReviews] = useState([])
  const [page, setPage] = useState('discover'); const [filters, setFilters] = useState({ category: 'All', type: 'All', payment_type: 'All', q: '' }); const [loading, setLoading] = useState(true); const [authReady, setAuthReady] = useState(false); const [createOpen, setCreateOpen] = useState(false); const [editOpen, setEditOpen] = useState(false); const [selected, setSelected] = useState(null); const [toast, setToast] = useState(null); const [savedIds, setSavedIds] = useState([])
  const notify = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 4200) }
  const loadUsers = async () => { const rows = await api('/users'); setUsers(rows); return rows }
  const loadGigs = async () => { setLoading(true); try { const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v && v !== 'All')); const rows = await api(`/gigs?${params}`); setGigs(rows) } catch (err) { notify(err.message, 'error') } finally { setLoading(false) } }
  const loadAllGigs = async () => setAllGigs(await api('/gigs'))
  const loadPersonal = async (userId) => { if (!userId) return; const [apps, revs] = await Promise.all([api(`/applications?applicant_id=${userId}`), api('/reviews')]); setApplications(apps); setReviews(revs.filter((r) => r.reviewee_id === userId)) }
  useEffect(() => { const token = localStorage.getItem('campusloop_token'); if (!token) { setAuthReady(true); return } api('/auth/me').then(setCurrentUser).catch(() => localStorage.removeItem('campusloop_token')).finally(() => setAuthReady(true)) }, [])
  useEffect(() => { if (!currentUser) return; loadUsers(); loadAllGigs(); loadPersonal(currentUser.id); const saved = JSON.parse(localStorage.getItem(`campusloop_saved_${currentUser.id}`) || '[]'); setSavedIds(saved) }, [currentUser?.id])
  useEffect(() => { if (!currentUser) return; const timer = setTimeout(loadGigs, 180); return () => clearTimeout(timer) }, [filters, currentUser?.id])
  const refresh = async () => { const [, , , profile] = await Promise.all([loadUsers(), loadGigs(), loadAllGigs(), api('/auth/me')]); setCurrentUser(profile); await loadPersonal(profile.id); if (selected) { const fresh = await api(`/gigs/${selected.id}`); setSelected(fresh) } }
  const handleAuth = async () => { const profile = await api('/auth/me'); setCurrentUser(profile); setAuthReady(true); setPage('discover') }
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }) } catch { /* clear the local session either way */ } localStorage.removeItem('campusloop_token'); setCurrentUser(null); setUsers([]); setGigs([]); setAllGigs([]); setApplications([]); setSelected(null); setPage('discover') }
  const toggleSaved = (id) => setSavedIds((old) => { const next = old.includes(id) ? old.filter((item) => item !== id) : [...old, id]; localStorage.setItem(`campusloop_saved_${currentUser.id}`, JSON.stringify(next)); return next })
  const currentProfile = useMemo(() => ({ ...currentUser, ...(users.find((u) => u.id === currentUser?.id) || {}) }), [users, currentUser])
  if (!authReady) return <div className="app-loader"><span className="brand-mark"><Handshake /></span><strong>CampusLoop</strong></div>
  if (!currentUser) return <Auth onAuth={handleAuth} />
  return <div><Navbar currentUser={currentProfile} page={page} setPage={setPage} openCreate={() => setCreateOpen(true)} logout={logout} savedCount={savedIds.length} />
    {page === 'discover' && <Discover gigs={gigs} filters={filters} setFilters={setFilters} loading={loading} openGig={setSelected} openCreate={() => setCreateOpen(true)} savedIds={savedIds} toggleSaved={toggleSaved} />}
    {page === 'my-gigs' && <MyGigs gigs={allGigs} currentUser={currentProfile} openGig={setSelected} openCreate={() => setCreateOpen(true)} />}
    {page === 'applications' && <Applications applications={applications} openGig={async (gig) => setSelected(await api(`/gigs/${gig.id}`))} />}
    {page === 'saved' && <SavedGigs gigs={allGigs} savedIds={savedIds} toggleSaved={toggleSaved} openGig={setSelected} setPage={setPage} />}
    {page === 'profile' && <Profile user={currentProfile} reviews={reviews} editProfile={() => setEditOpen(true)} />}
    <footer><div className="brand"><span className="brand-mark"><Handshake size={18} /></span><span>Campus<span>Loop</span></span></div><p>Campus skills, shared. Built for students.</p><span>© 2026 CampusLoop · Built by <strong>LahootiX</strong></span></footer>
    {createOpen && <CreateGig currentUser={currentProfile} close={() => setCreateOpen(false)} onCreated={(gig) => { setGigs((old) => [gig, ...old]); setAllGigs((old) => [gig, ...old]) }} notify={notify} />}
    {editOpen && <EditProfile user={currentProfile} close={() => setEditOpen(false)} saved={(updated) => { setCurrentUser((old) => ({ ...old, ...updated })); setUsers((old) => old.map((user) => user.id === updated.id ? { ...user, ...updated } : user)) }} notify={notify} />}
    {selected && <GigDetail gig={selected} currentUser={currentProfile} users={users} close={() => setSelected(null)} refresh={refresh} notify={notify} />}
    <Toast toast={toast} close={() => setToast(null)} />
  </div>
}
