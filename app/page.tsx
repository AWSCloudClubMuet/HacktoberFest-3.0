'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Clock3,
  Compass,
  Filter,
  Heart,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Send,
  Settings,
  Star,
  Users,
  X,
} from 'lucide-react'
import { api, type Application, type Gig, type Review, type Stats, type User } from '@/lib/api'

const COLORS = ['coral', 'lavender', 'mint', 'sky', 'peach', 'butter']
const CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring']

const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('')
const colorFor = (id: number) => COLORS[(id - 1) % COLORS.length]
const yearLabel = (semester: number) => (semester <= 2 ? 'Freshman' : semester <= 4 ? 'Sophomore' : semester <= 6 ? 'Junior' : 'Senior')
const majorLine = (name: string, major: string, semester?: number) => (semester ? `${major} · ${yearLabel(semester)}` : major)
const paymentLabel = (p: Gig['payment_type']) => (p === 'SkillSwap' ? 'Skill swap' : p)
const paymentText = (gig: Gig) => (gig.payment_type === 'Paid' ? `Paid · $${Number(gig.budget)}` : paymentLabel(gig.payment_type))

function deadlineInfo(deadline: string) {
  const date = new Date(`${deadline.slice(0, 10)}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000)
  const label = diff < 0 ? `${-diff}d ago` : diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff} days left`
  return { label, full: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
}

function Avatar({ name, id, size = 'md' }: { name: string; id: number; size?: 'sm' | 'md' | 'lg' }) {
  return <div className={`avatar avatar-${colorFor(id)} avatar-${size}`}>{initials(name)}</div>
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase().replace(' ', '-')}`}>{status}</span>
}

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(rating) ? 'star-on' : 'star-off'} />
      ))}
    </span>
  )
}

type View = 'Discover' | 'My activity' | 'Profile'

export default function Page() {
  const [view, setView] = useState<View>('Discover')
  const [activityTab, setActivityTab] = useState('applications')
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [completeForm, setCompleteForm] = useState({ major: 'Computer Science', semester: '5', skills: '', bio: '' })
  const [stats, setStats] = useState<Stats | null>(null)
  const [allGigs, setAllGigs] = useState<Gig[]>([])
  const [discoverGigs, setDiscoverGigs] = useState<Gig[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [payment, setPayment] = useState('all')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [mode, setMode] = useState('All gigs')
  const [savedOnly, setSavedOnly] = useState(false)
  const [savedIds, setSavedIds] = useState<number[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(window.localStorage.getItem('cg-saved') || '[]') } catch { return [] }
  })

  const [selectedGigId, setSelectedGigId] = useState<number | null>(null)
  const [applyMessage, setApplyMessage] = useState('')
  const [showPost, setShowPost] = useState(false)
  const [postForm, setPostForm] = useState({ title: '', type: 'Requesting', category: 'Programming', payment_type: 'Paid', budget: '', deadline: '', description: '' })
  const [postError, setPostError] = useState('')
  const [reviewGig, setReviewGig] = useState<Gig | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [profileId, setProfileId] = useState<number>(1)
  const [profile, setProfile] = useState<(User & { reviews_received: Review[] }) | null>(null)
  const [toast, setToast] = useState('')

  const me = users.find((u) => u.email && (u.email === authEmail || u.email === session?.user?.email))
  const selectedGig = allGigs.find((g) => g.id === selectedGigId) || discoverGigs.find((g) => g.id === selectedGigId) || null

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const loadAll = useCallback(async () => {
    try {
      const [u, s, g, a, r] = await Promise.all([api.users(), api.stats(), api.gigs(), api.applications(), api.reviews()])
      setUsers(u)
      setStats(s)
      setAllGigs(g)
      setApplications(a)
      setReviews(r)
      setLoadError('')
    } catch {
      setLoadError('Could not reach the API. Is the backend running? (pnpm dev starts both)')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (query.trim()) params.q = query.trim()
    if (category !== 'all') params.category = category
    if (payment !== 'all') params.payment_type = payment
    if (mode !== 'All gigs') params.type = mode
    if (minBudget) params.min_budget = minBudget
    if (maxBudget) params.max_budget = maxBudget
    api.gigs(params).then(setDiscoverGigs).catch(() => setDiscoverGigs([]))
  }, [query, category, payment, mode, minBudget, maxBudget, loadAll, allGigs])

  useEffect(() => {
    if (view === 'Profile') api.user(profileId).then(setProfile).catch(() => setProfile(null))
  }, [view, profileId, allGigs, reviews])

  useEffect(() => { window.localStorage.setItem('cg-saved', JSON.stringify(savedIds)) }, [savedIds])

  // One definitive session check on mount (avoids bouncing to /login on a
  // stale empty session state right after signing in).
  useEffect(() => {
    authClient.getSession()
      .then(({ data }) => {
        setAuthEmail(data?.user?.email ?? null)
        setAuthChecked(true)
        if (!data) router.replace('/login')
      })
      .catch(() => { setAuthChecked(true); router.replace('/login') })
  }, [router])

  async function doSignOut() {
    await authClient.signOut()
    router.push('/login')
  }

  async function doCompleteProfile() {
    try {
      await api.createProfile({ major: completeForm.major, semester: Number(completeForm.semester), bio: completeForm.bio, skills: completeForm.skills })
      notify('Profile saved — welcome to campusloop!')
      await loadAll()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save profile')
    }
  }

  function openProfile(id: number) {
    setProfileId(id)
    setSelectedGigId(null)
    setView('Profile')
  }

  const myApplications = useMemo(() => applications.filter((a) => a.applicant_id === me?.id), [applications, me])
  const myGigs = useMemo(() => allGigs.filter((g) => g.user_id === me?.id), [allGigs, me])
  const appsForGig = useCallback((gigId: number) => applications.filter((a) => a.gig_id === gigId), [applications])
  const myAppFor = useCallback((gigId: number) => applications.find((a) => a.gig_id === gigId && a.applicant_id === me?.id), [applications, me])
  const myReviewFor = useCallback((gigId: number) => reviews.find((r) => r.gig_id === gigId && r.reviewer_id === me?.id), [reviews, me])
  const visibleGigs = savedOnly ? discoverGigs.filter((g) => savedIds.includes(g.id)) : discoverGigs

  const reviewableGigs = useMemo(
    () => allGigs.filter((g) => g.display_status === 'Completed' && (g.user_id === me?.id || g.accepted_applicant_id === me?.id) && !myReviewFor(g.id)),
    [allGigs, me, myReviewFor],
  )

  async function doApply(gig: Gig) {
    if (!me) return
    try {
      await api.apply({ gig_id: gig.id, applicant_id: me.id, message: applyMessage })
      setApplyMessage('')
      setSelectedGigId(null)
      notify('Application sent. Good luck!')
      await loadAll()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not apply')
    }
  }

  async function doReviewApplication(app: Application, status: 'Accepted' | 'Rejected') {
    if (!me) return
    try {
      await api.reviewApplication(app.id, me.id, status)
      notify(status === 'Accepted' ? `${app.applicant_name} accepted — gig is now In Progress` : 'Application rejected')
      await loadAll()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action failed')
    }
  }

  async function doGigStatus(gig: Gig, status: string) {
    if (!me) return
    try {
      await api.setGigStatus(gig.id, me.id, status)
      notify(status === 'Completed' ? 'Gig marked as completed' : 'Gig cancelled')
      await loadAll()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action failed')
    }
  }

  async function doPostGig() {
    if (!me) return
    setPostError('')
    try {
      const gig = await api.createGig({
        user_id: me.id,
        title: postForm.title,
        description: postForm.description,
        type: postForm.type,
        category: postForm.category,
        payment_type: postForm.payment_type,
        budget: postForm.payment_type === 'Paid' ? Number(postForm.budget) : null,
        deadline: postForm.deadline,
      })
      setShowPost(false)
      setPostForm({ title: '', type: 'Requesting', category: 'Programming', payment_type: 'Paid', budget: '', deadline: '', description: '' })
      notify('Your gig is live')
      await loadAll()
      setSelectedGigId(gig.id)
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Could not post gig')
    }
  }

  async function doReview() {
    if (!me || !reviewGig) return
    try {
      await api.createReview({ gig_id: reviewGig.id, reviewer_id: me.id, rating: reviewRating, comment: reviewComment })
      setReviewGig(null)
      setReviewComment('')
      setReviewRating(5)
      notify('Review submitted — thank you!')
      await loadAll()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not submit review')
    }
  }

  if (!authChecked || !authEmail) {
    return (
      <div className="auth-shell">
        <div className="auth-loading"><img src="/logo.png" alt="campusloop logo" className="brand-logo" /><span>campus<span className="brand-accent">loop</span></span></div>
      </div>
    )
  }

  if (authEmail && !loading && !loadError && !me) {
    return (
      <div className="auth-shell">
        <Card className="auth-card">
          <div className="auth-brand"><img src="/logo.png" alt="campusloop logo" className="brand-logo" /><span>campus<span className="brand-accent">loop</span></span></div>
          <h1 className="auth-title">Finish your profile</h1>
          <p className="modal-description">Signed in as {authEmail} — add the details other students will see.</p>
          <div className="dialog-form auth-form">
            <div className="form-row">
              <div>
                <Label>Major</Label>
                <Input value={completeForm.major} onChange={(e) => setCompleteForm({ ...completeForm, major: e.target.value })} placeholder="Your major" />
              </div>
              <div>
                <Label>Semester</Label>
                <Input type="number" min="1" max="12" value={completeForm.semester} onChange={(e) => setCompleteForm({ ...completeForm, semester: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Skills (comma separated)</Label>
              <Input value={completeForm.skills} onChange={(e) => setCompleteForm({ ...completeForm, skills: e.target.value })} placeholder="e.g. React, Figma, Proofreading" />
            </div>
            <div>
              <Label>Short bio</Label>
              <Textarea value={completeForm.bio} onChange={(e) => setCompleteForm({ ...completeForm, bio: e.target.value })} rows={3} placeholder="What do you study, what are you good at..." />
            </div>
            <Button className="auth-submit" onClick={doCompleteProfile}>Save profile <ArrowRight data-icon="inline-end" /></Button>
            <Button variant="outline" onClick={doSignOut}>Sign out</Button>
          </div>
        </Card>
        {toast && <div className="toast"><Check />{toast}</div>}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img src="/logo.png" alt="campusloop logo" className="brand-logo" /><span>campus<span className="brand-accent">loop</span></span></div>
        <nav className="main-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          <button className={`nav-item ${view === 'Discover' ? 'active' : ''}`} onClick={() => { setView('Discover'); setSavedOnly(false) }}><Compass />Discover</button>
          <button className={`nav-item ${view === 'My activity' ? 'active' : ''}`} onClick={() => setView('My activity')}><LayoutDashboard />My activity{(myApplications.length + reviewableGigs.length) > 0 && <span className="nav-count">{myApplications.length + reviewableGigs.length}</span>}</button>
          <span className="nav-label nav-label-spaced">Your space</span>
          <button className="nav-item" onClick={() => { setActivityTab('my-gigs'); setView('My activity') }}><BriefcaseBusiness />My gigs{myGigs.length > 0 && <span className="nav-count">{myGigs.length}</span>}</button>
          <button className="nav-item" onClick={() => { setSavedOnly(true); setView('Discover') }}><Heart />Saved <span className="nav-count">{savedIds.length || 0}</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => me && openProfile(me.id)}><Settings />My profile</button>
          {me && (
            <button className="profile-mini profile-mini-button" onClick={() => openProfile(me.id)}>
              <Avatar name={me.name} id={me.id} />
              <div><strong>{me.name}</strong><span>{majorLine(me.name, me.major, me.semester)}</span></div>
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><img src="/logo.png" alt="campusloop logo" className="brand-logo" /><span>campus<span className="brand-accent">loop</span></span></div>
          <div className="topbar-actions">
            {me && <span className="acting-as-label signed-in-as">Signed in as {me.name}</span>}
            <button className="icon-button" aria-label="Sign out" title="Sign out" onClick={doSignOut}><LogOut /></button>
            {me && <button className="profile-trigger" onClick={() => openProfile(me.id)}><Avatar name={me.name} id={me.id} size="sm" /></button>}
          </div>
        </header>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          <button className={view === 'Discover' ? 'active' : ''} onClick={() => { setView('Discover'); setSavedOnly(false) }}><Compass />Discover</button>
          <button className={view === 'My activity' ? 'active' : ''} onClick={() => setView('My activity')}><LayoutDashboard />My activity</button>
          <button className={view === 'Profile' ? 'active' : ''} onClick={() => me && openProfile(me.id)}><Users />Profile</button>
        </nav>

        <div className="content-wrap">
          {loadError && <div className="error-banner">{loadError}</div>}

          {view === 'Discover' && (
            <>
              <section className="welcome-row">
                <div>
                  <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  <h1>Campus gigs</h1>
                  <p className="welcome-copy">Small jobs and skill swaps posted by Northwestern students.</p>
                  {stats && <p className="stats-line">{stats.open_gigs} open · {stats.active_students} students · {stats.avg_rating} average rating from {stats.review_count} reviews</p>}
                </div>
                <Button className="post-button" onClick={() => setShowPost(true)}><Plus data-icon="inline-start" />Post a gig</Button>
              </section>


              <div className="section-heading">
                <div><h2>{savedOnly ? 'Saved gigs' : 'Latest gigs'}</h2></div>
                <button className="text-button" onClick={() => { setQuery(''); setCategory('all'); setPayment('all'); setMinBudget(''); setMaxBudget(''); setMode('All gigs'); setSavedOnly(false) }}>View all <ArrowRight /></button>
              </div>

              <div className="filters">
                <div className="search-wrap"><Search /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gigs, skills, or keywords..." aria-label="Search gigs" /></div>
                <Select items={[{ label: 'All categories', value: 'all' }, ...CATEGORIES.map((c) => ({ label: c, value: c }))]} value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger className="filter-select" aria-label="Filter by category"><SelectValue>{category === 'all' ? 'All categories' : category}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="all">All categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Select items={[{ label: 'Any payment', value: 'all' }, { label: 'Paid', value: 'Paid' }, { label: 'Skill swap', value: 'SkillSwap' }, { label: 'Free', value: 'Free' }]} value={payment} onValueChange={(v) => v && setPayment(v)}>
                  <SelectTrigger className="filter-select" aria-label="Filter by payment type"><SelectValue>{payment === 'all' ? 'Any payment' : payment === 'SkillSwap' ? 'Skill swap' : payment}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="all">Any payment</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="SkillSwap">Skill swap</SelectItem><SelectItem value="Free">Free</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="filters filters-budget">
                <span className="budget-label"><Filter /> Budget</span>
                <Input type="number" min="0" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} placeholder="Min $" aria-label="Minimum budget" className="budget-input" />
                <span className="budget-dash">–</span>
                <Input type="number" min="0" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} placeholder="Max $" aria-label="Maximum budget" className="budget-input" />
                {(minBudget || maxBudget) && <button className="text-button" onClick={() => { setMinBudget(''); setMaxBudget('') }}><X /> Clear</button>}
              </div>

              <div className="mode-tabs" role="tablist">
                {['All gigs', 'Offering', 'Requesting'].map((item) => (
                  <button key={item} className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{item}{item === 'All gigs' && <span>{discoverGigs.length}</span>}</button>
                ))}
              </div>

              {loading ? (
                <div className="empty-state"><Search /><h3>Loading gigs…</h3><p>Fetching the latest from the campus board.</p></div>
              ) : (
                <div className="gig-grid">
                  {visibleGigs.map((gig) => (
                    <article className="gig-card" key={gig.id} onClick={() => setSelectedGigId(gig.id)}>
                      <div className="gig-card-top">
                        <span className="type-status">
                          <span className={`type-label type-${gig.type.toLowerCase()}`}>{gig.type === 'Offering' ? 'Offering help' : 'Looking for help'}</span>
                          {gig.display_status !== 'Open' && <StatusBadge status={gig.display_status} />}
                        </span>
                        <button className={`save-button ${savedIds.includes(gig.id) ? 'saved' : ''}`} aria-label="Save gig" onClick={(e) => { e.stopPropagation(); setSavedIds((ids) => ids.includes(gig.id) ? ids.filter((id) => id !== gig.id) : [...ids, gig.id]) }}><Heart /></button>
                      </div>
                      <h3>{gig.title}</h3>
                      <p className="gig-description">{gig.description}</p>
                      <p className="gig-meta-line">{gig.category} · {paymentText(gig)}{(gig.applications_count ?? 0) > 0 ? ` · ${gig.applications_count} applicant${gig.applications_count === 1 ? '' : 's'}` : ''}</p>
                      <div className="gig-card-footer">
                        <div className="person"><Avatar name={gig.owner_name} id={gig.user_id} size="sm" /><div><strong>{gig.owner_name}</strong><span>{gig.owner_major}</span></div></div>
                        <span className="deadline"><Clock3 />{deadlineInfo(gig.deadline).label}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {!loading && visibleGigs.length === 0 && <div className="empty-state"><Search /><h3>No gigs found</h3><p>Try another keyword or reset your filters.</p></div>}

            </>
          )}

          {view === 'My activity' && me && (
            <>
              <div className="section-heading view-heading">
                <div><h2>My activity</h2><p>Everything you have posted and applied to.</p></div>
                <Button className="post-button" onClick={() => setShowPost(true)}><Plus data-icon="inline-start" />Post a gig</Button>
              </div>
              <Tabs value={activityTab} onValueChange={setActivityTab}>
                <TabsList className="activity-tabs">
                  <TabsTrigger value="applications">My applications ({myApplications.length})</TabsTrigger>
                  <TabsTrigger value="my-gigs">My gigs ({myGigs.length})</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({reviewableGigs.length} to leave)</TabsTrigger>
                </TabsList>

                <TabsContent value="applications">
                  {myApplications.length === 0 && <div className="empty-state"><Send /><h3>No applications yet</h3><p>When you apply to a gig, its status will show up here.</p></div>}
                  <div className="activity-list">
                    {myApplications.map((app) => (
                      <Card key={app.id} className="activity-card">
                        <div className="row-between">
                          <button className="link-title" onClick={() => setSelectedGigId(app.gig_id)}>{app.gig_title}</button>
                          <span className="badge-row"><StatusBadge status={app.gig_status} /><StatusBadge status={app.status} /></span>
                        </div>
                        <p className="activity-message">“{app.message}”</p>
                        <span className="activity-meta">Applied {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="my-gigs">
                  {myGigs.length === 0 && <div className="empty-state"><BriefcaseBusiness /><h3>No gigs posted yet</h3><p>Post your first gig and applications will land here.</p></div>}
                  <div className="activity-list">
                    {myGigs.map((gig) => {
                      const gigApps = appsForGig(gig.id)
                      const accepted = gigApps.find((a) => a.status === 'Accepted')
                      return (
                        <Card key={gig.id} className="activity-card">
                          <div className="row-between">
                            <button className="link-title" onClick={() => setSelectedGigId(gig.id)}>{gig.title}</button>
                            <StatusBadge status={gig.display_status} />
                          </div>
                          <span className="activity-meta">{gig.type} · {gig.category} · {paymentLabel(gig.payment_type)}{gig.budget ? ` · $${Number(gig.budget)}` : ''} · Deadline {deadlineInfo(gig.deadline).full}</span>
                          {accepted && <p className="activity-message">Working with <button className="link-inline" onClick={() => openProfile(accepted.applicant_id)}>{accepted.applicant_name}</button></p>}
                          {gigApps.length > 0 && (
                            <div className="applicant-list">
                              {gigApps.map((app) => (
                                <div key={app.id} className="applicant-row">
                                  <div className="person"><Avatar name={app.applicant_name} id={app.applicant_id} size="sm" /><div><button className="link-inline strong" onClick={() => openProfile(app.applicant_id)}>{app.applicant_name}</button><span>{app.applicant_major}</span></div></div>
                                  <span className="applicant-message">“{app.message}”</span>
                                  {app.status === 'Pending' && gig.display_status === 'Open' ? (
                                    <span className="applicant-actions">
                                      <Button size="sm" onClick={() => doReviewApplication(app, 'Accepted')}><Check data-icon="inline-start" />Accept</Button>
                                      <Button size="sm" variant="outline" onClick={() => doReviewApplication(app, 'Rejected')}>Reject</Button>
                                    </span>
                                  ) : <StatusBadge status={app.status} />}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="card-actions">
                            {gig.display_status === 'In Progress' && <Button size="sm" onClick={() => doGigStatus(gig, 'Completed')}><Check data-icon="inline-start" />Mark completed</Button>}
                            {gig.display_status === 'Open' && <Button size="sm" variant="outline" onClick={() => doGigStatus(gig, 'Cancelled')}>Cancel gig</Button>}
                            {gig.display_status === 'Completed' && !myReviewFor(gig.id) && gig.accepted_applicant_id && (
                              <Button size="sm" variant="outline" onClick={() => { setReviewGig(gig); setReviewRating(5); setReviewComment('') }}><Star data-icon="inline-start" />Leave a review</Button>
                            )}
                            {gig.display_status === 'Completed' && myReviewFor(gig.id) && <span className="reviewed-note"><Check /> You reviewed this gig</span>}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="reviews">
                  <div className="activity-list">
                    {reviewableGigs.map((gig) => {
                      const otherId = gig.user_id === me.id ? gig.accepted_applicant_id : gig.user_id
                      const other = users.find((u) => u.id === otherId)
                      return (
                        <Card key={gig.id} className="activity-card">
                          <div className="row-between">
                            <button className="link-title" onClick={() => setSelectedGigId(gig.id)}>{gig.title}</button>
                            <StatusBadge status="Completed" />
                          </div>
                          <p className="activity-message">How did it go with {other?.name}?</p>
                          <div className="card-actions"><Button size="sm" onClick={() => { setReviewGig(gig); setReviewRating(5); setReviewComment('') }}><Star data-icon="inline-start" />Review {other?.name.split(' ')[0]}</Button></div>
                        </Card>
                      )
                    })}
                    {reviews.filter((r) => r.reviewer_id === me.id).map((r) => (
                      <Card key={r.id} className="activity-card">
                        <div className="row-between"><span className="strong-text">{r.gig_title}</span><Stars rating={r.rating} /></div>
                        <p className="activity-message">You reviewed {users.find((u) => u.id === r.reviewee_id)?.name}: “{r.comment}”</p>
                      </Card>
                    ))}
                    {reviewableGigs.length === 0 && reviews.filter((r) => r.reviewer_id === me.id).length === 0 && (
                      <div className="empty-state"><Star /><h3>Nothing to review</h3><p>Reviews unlock once a gig you are part of is completed.</p></div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}

          {view === 'Profile' && (
            <>
              <div className="section-heading view-heading">
                <div><h2>{profile?.id === me?.id ? 'My profile' : 'Profile'}</h2><p>Ratings come from completed-gig reviews.</p></div>
                <button className="text-button" onClick={() => setView('Discover')}><ArrowRight /> Back to Discover</button>
              </div>
              {!profile ? (
                <div className="empty-state"><Users /><h3>Loading profile…</h3></div>
              ) : (
                <>
                  <Card className="profile-card">
                    <div className="profile-head">
                      <Avatar name={profile.name} id={profile.id} size="lg" />
                      <div>
                        <h3>{profile.name}</h3>
                        <span>{majorLine(profile.name, profile.major, profile.semester)} · Semester {profile.semester}</span>
                        <div className="profile-rating">
                          {profile.average_rating ? <><Stars rating={profile.average_rating} size={15} /><strong>{profile.average_rating}</strong><span>({profile.review_count} review{profile.review_count === 1 ? '' : 's'})</span></> : <span>No reviews yet</span>}
                        </div>
                      </div>
                    </div>
                    <p className="modal-description">{profile.bio}</p>
                    {profile.skills.length > 0 && <p className="gig-meta-line profile-skills-line">Skills: {profile.skills.join(' · ')}</p>}
                    <Separator />
                    <div className="profile-stats">
                      <div><strong>{profile.gigs_posted}</strong><span>Gigs posted</span></div>
                      <div><strong>{profile.gigs_completed}</strong><span>Gigs completed</span></div>
                      <div><strong>{profile.average_rating ?? '—'}</strong><span>Average rating</span></div>
                    </div>
                  </Card>

                  <div className="section-heading profile-section"><div><h2>Reviews received</h2></div></div>
                  {profile.reviews_received.length === 0 && <div className="empty-state"><Star /><h3>No reviews yet</h3><p>Completed gigs will bring reviews here.</p></div>}
                  <div className="activity-list">
                    {profile.reviews_received.map((r) => (
                      <Card key={r.id} className="activity-card">
                        <div className="row-between">
                          <span className="strong-text">{r.reviewer_name} · {r.gig_title}</span>
                          <Stars rating={r.rating} />
                        </div>
                        <p className="activity-message">“{r.comment}”</p>
                      </Card>
                    ))}
                  </div>

                  <div className="section-heading profile-section"><div><h2>{profile.id === me?.id ? 'Your gigs' : `Gigs by ${profile.name.split(' ')[0]}`}</h2></div></div>
                  <div className="activity-list">
                    {allGigs.filter((g) => g.user_id === profile.id).map((g) => (
                      <Card key={g.id} className="activity-card">
                        <div className="row-between">
                          <button className="link-title" onClick={() => setSelectedGigId(g.id)}>{g.title}</button>
                          <StatusBadge status={g.display_status} />
                        </div>
                        <span className="activity-meta">{g.type} · {g.category} · {paymentLabel(g.payment_type)}{g.budget ? ` · $${Number(g.budget)}` : ''} · Deadline {deadlineInfo(g.deadline).full}</span>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Gig detail / apply / manage */}
      <Dialog open={selectedGig !== null} onOpenChange={(open) => { if (!open) { setSelectedGigId(null); setApplyMessage('') } }}>
        <DialogContent className="gig-dialog">
          {selectedGig && me && (
            <>
              <DialogHeader>
                <span className="type-status">
                  <span className={`type-label type-${selectedGig.type.toLowerCase()}`}>{selectedGig.type === 'Offering' ? 'Offering help' : 'Looking for help'}</span>
                  <StatusBadge status={selectedGig.display_status} />
                </span>
                <DialogTitle className="dialog-title">{selectedGig.title}</DialogTitle>
                <DialogDescription className="sr-only">Gig details and actions</DialogDescription>
              </DialogHeader>
              <button className="modal-person modal-person-button" onClick={() => openProfile(selectedGig.user_id)}>
                <Avatar name={selectedGig.owner_name} id={selectedGig.user_id} />
                <div><strong>{selectedGig.owner_name}</strong><span>{selectedGig.owner_major} — view profile</span></div>
              </button>
              <p className="modal-description">{selectedGig.description}</p>
              <div className="modal-details">
                <div><span>Category</span><strong>{selectedGig.category}</strong></div>
                <div><span>Compensation</span><strong>{paymentLabel(selectedGig.payment_type)}{selectedGig.budget && ` · $${Number(selectedGig.budget)}`}</strong></div>
                <div><span>Deadline</span><strong>{deadlineInfo(selectedGig.deadline).full}</strong></div>
              </div>

              {selectedGig.user_id === me.id ? (
                <>
                  <Separator className="dialog-sep" />
                  <h4 className="dialog-subtitle">Applications ({appsForGig(selectedGig.id).length})</h4>
                  {appsForGig(selectedGig.id).length === 0 && <p className="activity-message">No applications yet.</p>}
                  {appsForGig(selectedGig.id).map((app) => (
                    <div key={app.id} className="applicant-row">
                      <div className="person"><Avatar name={app.applicant_name} id={app.applicant_id} size="sm" /><div><button className="link-inline strong" onClick={() => openProfile(app.applicant_id)}>{app.applicant_name}</button><span>{app.applicant_major}</span></div></div>
                      {app.status === 'Pending' && selectedGig.display_status === 'Open' ? (
                        <span className="applicant-actions">
                          <Button size="sm" onClick={() => doReviewApplication(app, 'Accepted')}><Check data-icon="inline-start" />Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => doReviewApplication(app, 'Rejected')}>Reject</Button>
                        </span>
                      ) : <StatusBadge status={app.status} />}
                    </div>
                  ))}
                  <div className="modal-actions">
                    {selectedGig.display_status === 'In Progress' && <Button onClick={() => doGigStatus(selectedGig, 'Completed')}><Check data-icon="inline-start" />Mark completed</Button>}
                    {selectedGig.display_status === 'Open' && <Button variant="outline" onClick={() => doGigStatus(selectedGig, 'Cancelled')}>Cancel gig</Button>}
                    {selectedGig.display_status === 'Completed' && selectedGig.accepted_applicant_id && !myReviewFor(selectedGig.id) && (
                      <Button onClick={() => { setReviewGig(selectedGig); setReviewRating(5); setReviewComment('') }}><Star data-icon="inline-start" />Leave a review</Button>
                    )}
                    {selectedGig.display_status === 'Completed' && myReviewFor(selectedGig.id) && <span className="reviewed-note"><Check /> You reviewed this gig</span>}
                  </div>
                </>
              ) : (
                <>
                  {(() => {
                    const mine = myAppFor(selectedGig.id)
                    if (mine) return <div className="applied-note"><Check /> You applied — status: <StatusBadge status={mine.status} /></div>
                    if (selectedGig.display_status !== 'Open') return <p className="activity-message">This gig is {selectedGig.display_status} and is not accepting applications.</p>
                    return (
                      <div className="apply-box">
                        <Label htmlFor="apply-message">Your application message</Label>
                        <Textarea id="apply-message" value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} placeholder="A short note on why you are a good fit..." rows={3} />
                        <div className="modal-actions">
                          <Button onClick={() => doApply(selectedGig)} disabled={!applyMessage.trim()}><Send data-icon="inline-start" />Apply to this gig</Button>
                          <Button variant="outline" onClick={() => setSelectedGigId(null)}>Maybe later</Button>
                        </div>
                      </div>
                    )
                  })()}
                  {selectedGig.display_status === 'Completed' && selectedGig.accepted_applicant_id === me.id && !myReviewFor(selectedGig.id) && (
                    <div className="modal-actions">
                      <Button variant="outline" onClick={() => { setReviewGig(selectedGig); setReviewRating(5); setReviewComment('') }}><Star data-icon="inline-start" />Review {selectedGig.owner_name.split(' ')[0]}</Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Post a gig */}
      <Dialog open={showPost} onOpenChange={(open) => { setShowPost(open); if (!open) setPostError('') }}>
        <DialogContent className="gig-dialog">
          <DialogHeader>
            <DialogTitle className="dialog-title">Post a gig</DialogTitle>
            <DialogDescription className="modal-description">Say what you need, or what you can do.</DialogDescription>
          </DialogHeader>
          <div className="dialog-form">
            <div>
              <Label htmlFor="post-title">Gig title</Label>
              <Input id="post-title" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="e.g. Help me build a portfolio site" />
            </div>
            <div className="form-row">
              <div>
                <Label>What are you posting?</Label>
                <Select items={[{ label: "I'm looking for help", value: 'Requesting' }, { label: "I'm offering help", value: 'Offering' }]} value={postForm.type} onValueChange={(v) => v && setPostForm({ ...postForm, type: v })}>
                  <SelectTrigger className="form-select"><SelectValue>{postForm.type === 'Requesting' ? "I'm looking for help" : "I'm offering help"}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="Requesting">I&apos;m looking for help</SelectItem><SelectItem value="Offering">I&apos;m offering help</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select items={CATEGORIES.map((c) => ({ label: c, value: c }))} value={postForm.category} onValueChange={(v) => v && setPostForm({ ...postForm, category: v })}>
                  <SelectTrigger className="form-select"><SelectValue>{postForm.category}</SelectValue></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="form-row">
              <div>
                <Label>Payment type</Label>
                <Select items={[{ label: 'Paid', value: 'Paid' }, { label: 'Skill swap', value: 'SkillSwap' }, { label: 'Free', value: 'Free' }]} value={postForm.payment_type} onValueChange={(v) => v && setPostForm({ ...postForm, payment_type: v })}>
                  <SelectTrigger className="form-select"><SelectValue>{postForm.payment_type === 'SkillSwap' ? 'Skill swap' : postForm.payment_type}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="SkillSwap">Skill swap</SelectItem><SelectItem value="Free">Free</SelectItem></SelectContent>
                </Select>
              </div>
              {postForm.payment_type === 'Paid' ? (
                <div>
                  <Label htmlFor="post-budget">Budget ($)</Label>
                  <Input id="post-budget" type="number" min="1" value={postForm.budget} onChange={(e) => setPostForm({ ...postForm, budget: e.target.value })} placeholder="e.g. 100" />
                </div>
              ) : (
                <div>
                  <Label htmlFor="post-deadline">Deadline</Label>
                  <Input id="post-deadline" type="date" value={postForm.deadline} onChange={(e) => setPostForm({ ...postForm, deadline: e.target.value })} />
                </div>
              )}
            </div>
            {postForm.payment_type === 'Paid' && (
              <div>
                <Label htmlFor="post-deadline-paid">Deadline</Label>
                <Input id="post-deadline-paid" type="date" value={postForm.deadline} onChange={(e) => setPostForm({ ...postForm, deadline: e.target.value })} />
              </div>
            )}
            <div>
              <Label htmlFor="post-desc">Describe your gig</Label>
              <Textarea id="post-desc" value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} placeholder="Add details about the project, expectations, and timeline..." rows={4} />
            </div>
            {postError && <p className="form-error">{postError}</p>}
          </div>
          <div className="modal-actions">
            <Button onClick={doPostGig}>Publish gig <ArrowRight data-icon="inline-end" /></Button>
            <Button variant="outline" onClick={() => setShowPost(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review */}
      <Dialog open={reviewGig !== null} onOpenChange={(open) => { if (!open) setReviewGig(null) }}>
        <DialogContent className="gig-dialog">
          {reviewGig && me && (
            <>
              <DialogHeader>
                <DialogTitle className="dialog-title">Review this gig</DialogTitle>
                <DialogDescription className="modal-description">
                  {reviewGig.title} — your rating goes to {users.find((u) => u.id === (reviewGig.user_id === me.id ? reviewGig.accepted_applicant_id : reviewGig.user_id))?.name} and counts toward their profile average.
                </DialogDescription>
              </DialogHeader>
              <div className="dialog-form">
                <div>
                  <Label>Your rating</Label>
                  <div className="star-input">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} type="button" onClick={() => setReviewRating(i)} aria-label={`${i} stars`}>
                        <Star className={i <= reviewRating ? 'star-on' : 'star-off'} />
                      </button>
                    ))}
                    <span>{reviewRating}/5</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="review-comment">Comment</Label>
                  <Textarea id="review-comment" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How did it go? Were they reliable, skilled, on time..." rows={3} />
                </div>
              </div>
              <div className="modal-actions">
                <Button onClick={doReview}><Star data-icon="inline-start" />Submit review</Button>
                <Button variant="outline" onClick={() => setReviewGig(null)}>Cancel</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {toast && <div className="toast"><Check />{toast}</div>}
    </div>
  )
}
