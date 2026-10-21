'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  DollarSign,
  FileText,
  Filter,
  Heart,
  LayoutDashboard,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react'

type Gig = {
  id: number
  title: string
  description: string
  name: string
  major: string
  initials: string
  category: string
  type: 'Offering' | 'Requesting'
  payment: 'Paid' | 'Skill swap' | 'Free'
  budget?: string
  deadline: string
  status: 'Open' | 'In progress' | 'Completed'
  color: string
  applied?: boolean
}

const gigs: Gig[] = [
  { id: 1, title: 'Build a portfolio website', description: 'Looking for a developer to help me create a clean portfolio site before internship applications.', name: 'Maya Chen', major: 'Computer Science · Junior', initials: 'MC', category: 'Programming', type: 'Requesting', payment: 'Paid', budget: '$150–200', deadline: '3 days left', status: 'Open', color: 'coral' },
  { id: 2, title: 'Intro to Figma workshop', description: 'I can walk you through the basics of Figma, components, and a simple design system.', name: 'Jordan Lee', major: 'Design · Senior', initials: 'JL', category: 'Design', type: 'Offering', payment: 'Free', deadline: 'Tomorrow', status: 'Open', color: 'lavender' },
  { id: 3, title: 'Proofread my research paper', description: 'Need a second pair of eyes on a 12-page sociology paper. Happy to trade for design help.', name: 'Sam Rivera', major: 'Sociology · Sophomore', initials: 'SR', category: 'Writing', type: 'Requesting', payment: 'Skill swap', deadline: '5 days left', status: 'Open', color: 'mint' },
  { id: 4, title: 'Calculus II study buddy', description: 'Hosting weekly study sessions for the upcoming midterm. All levels welcome.', name: 'Noah Williams', major: 'Mathematics · Senior', initials: 'NW', category: 'Tutoring', type: 'Offering', payment: 'Free', deadline: 'Next week', status: 'Open', color: 'sky' },
  { id: 5, title: 'Design a club event poster', description: 'Our cultural club needs a bold poster for our spring showcase.', name: 'Aisha Patel', major: 'Media Studies · Junior', initials: 'AP', category: 'Design', type: 'Requesting', payment: 'Paid', budget: '$75–100', deadline: '8 days left', status: 'Open', color: 'peach' },
  { id: 6, title: 'Edit short-form videos', description: 'Offering quick, polished edits for student creators and campus orgs.', name: 'Leo Martin', major: 'Film · Senior', initials: 'LM', category: 'Design', type: 'Offering', payment: 'Paid', budget: '$40/video', deadline: '2 weeks left', status: 'In progress', color: 'butter' },
]

const nav = [
  { label: 'Discover', icon: Compass },
  { label: 'My activity', icon: LayoutDashboard },
  { label: 'Messages', icon: MessageCircle, count: 3 },
]

function Avatar({ initials, color = 'coral', size = 'md' }: { initials: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <div className={`avatar avatar-${color} avatar-${size}`}>{initials}</div>
}

function StatusBadge({ children }: { children: string }) {
  return <span className={`status status-${children.toLowerCase().replace(' ', '-')}`}>{children}</span>
}

export default function Page() {
  const [activeNav, setActiveNav] = useState('Discover')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All categories')
  const [mode, setMode] = useState('All gigs')
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const [showPost, setShowPost] = useState(false)
  const [appliedIds, setAppliedIds] = useState<number[]>([])
  const [savedIds, setSavedIds] = useState<number[]>([])
  const [toast, setToast] = useState('')

  const filteredGigs = useMemo(() => gigs.filter((gig) => {
    const matchesQuery = !query || `${gig.title} ${gig.description} ${gig.category}`.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All categories' || gig.category === category
    const matchesMode = mode === 'All gigs' || gig.type === mode
    return matchesQuery && matchesCategory && matchesMode
  }), [query, category, mode])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  function apply(gig: Gig) {
    setAppliedIds((ids) => ids.includes(gig.id) ? ids : [...ids, gig.id])
    setSelectedGig(null)
    notify('Application sent. Good luck!')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles /></div><span>campus<span className="brand-accent">loop</span></span></div>
        <div className="campus-switcher"><div className="campus-icon">NU</div><div><strong>Northwestern</strong><span>Student community</span></div><ChevronDown className="muted-icon" /></div>
        <nav className="main-nav" aria-label="Main navigation">
          <span className="nav-label">WORKSPACE</span>
          {nav.map(({ label, icon: Icon, count }) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}><Icon />{label}{count && <span className="nav-count">{count}</span>}</button>)}
          <span className="nav-label nav-label-spaced">YOUR SPACE</span>
          <button className="nav-item" onClick={() => notify('Your posted gigs are coming right up')}><BriefcaseBusiness />My gigs</button>
          <button className="nav-item" onClick={() => notify('Saved gigs opened')}><Heart />Saved <span className="nav-count">{savedIds.length || 0}</span></button>
        </nav>
        <div className="sidebar-bottom"><button className="nav-item"><Settings />Settings</button><div className="profile-mini"><Avatar initials="ER" color="coral" /><div><strong>Emma Rodriguez</strong><span>Computer Science · 3rd year</span></div><MoreHorizontal /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><Sparkles /></div><span>campus<span className="brand-accent">loop</span></span></div><div className="topbar-actions"><button className="icon-button notification-button" aria-label="Notifications"><Bell /><span /></button><button className="profile-trigger"><Avatar initials="ER" color="coral" size="sm" /><ChevronDown /></button></div></header>
        <div className="content-wrap">
          <section className="welcome-row"><div><p className="eyebrow">MONDAY, MARCH 18, 2024</p><h1>Find your next <span>collaboration.</span></h1><p className="welcome-copy">Share what you know. Find what you need. Grow together.</p></div><Button className="post-button" onClick={() => setShowPost(true)}><Plus data-icon="inline-start" />Post a gig</Button></section>

          <div className="stats-row"><div className="stat-card"><div className="stat-icon stat-icon-coral"><Compass /></div><div><span>Open gigs</span><strong>24</strong></div><small>+6 this week</small></div><div className="stat-card"><div className="stat-icon stat-icon-mint"><Users /></div><div><span>Active students</span><strong>182</strong></div><small>on campus</small></div><div className="stat-card"><div className="stat-icon stat-icon-yellow"><Star /></div><div><span>Community rating</span><strong>4.8</strong></div><small>from 96 reviews</small></div></div>

          <div className="section-heading"><div><h2>Explore opportunities</h2><p>Discover ways to learn, earn, and connect with your campus community.</p></div><button className="text-button" onClick={() => { setQuery(''); setCategory('All categories'); setMode('All gigs') }}>View all <ArrowRight /></button></div>
          <div className="filters"><div className="search-wrap"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gigs, skills, or keywords..." aria-label="Search gigs" /></div><select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category"><option>All categories</option><option>Programming</option><option>Design</option><option>Writing</option><option>Tutoring</option></select><button className="filter-button"><Filter /> Filters</button></div>
          <div className="mode-tabs" role="tablist">{['All gigs', 'Offering', 'Requesting'].map((item) => <button key={item} className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{item}{item === 'All gigs' && <span>24</span>}</button>)}</div>

          <div className="gig-grid">{filteredGigs.map((gig) => <article className="gig-card" key={gig.id} onClick={() => setSelectedGig(gig)}><div className="gig-card-top"><span className={`type-label type-${gig.type.toLowerCase()}`}>{gig.type === 'Offering' ? 'Offering help' : 'Looking for help'}</span><button className={`save-button ${savedIds.includes(gig.id) ? 'saved' : ''}`} aria-label="Save gig" onClick={(e) => { e.stopPropagation(); setSavedIds((ids) => ids.includes(gig.id) ? ids.filter((id) => id !== gig.id) : [...ids, gig.id]) }}><Heart /></button></div><h3>{gig.title}</h3><p className="gig-description">{gig.description}</p><div className="gig-tags"><span>{gig.category}</span><span className={`payment-${gig.payment.toLowerCase().replace(' ', '-')}`}>{gig.payment === 'Paid' ? <DollarSign /> : gig.payment === 'Free' ? <Sparkles /> : <ArrowRight />}{gig.payment}{gig.budget && ` · ${gig.budget}`}</span></div><div className="gig-card-footer"><div className="person"><Avatar initials={gig.initials} color={gig.color} size="sm" /><div><strong>{gig.name}</strong><span>{gig.major}</span></div></div><span className="deadline"><Clock3 />{gig.deadline}</span></div></article>)}</div>
          {filteredGigs.length === 0 && <div className="empty-state"><Search /><h3>No gigs found</h3><p>Try another keyword or reset your filters.</p></div>}
          <div className="bottom-callout"><div className="callout-icon"><BookOpen /></div><div><strong>Have a skill to share?</strong><p>Post a gig and find a collaborator in your community.</p></div><Button variant="outline" onClick={() => setShowPost(true)}>Share a skill <ArrowRight data-icon="inline-end" /></Button></div>
        </div>
      </main>

      {selectedGig && <div className="modal-backdrop" onClick={() => setSelectedGig(null)}><div className="gig-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelectedGig(null)} aria-label="Close"><X /></button><span className={`type-label type-${selectedGig.type.toLowerCase()}`}>{selectedGig.type === 'Offering' ? 'Offering help' : 'Looking for help'}</span><h2>{selectedGig.title}</h2><div className="modal-person"><Avatar initials={selectedGig.initials} color={selectedGig.color} /><div><strong>{selectedGig.name}</strong><span>{selectedGig.major}</span></div></div><p className="modal-description">{selectedGig.description} I&apos;m hoping to find someone thoughtful and reliable from our campus community.</p><div className="modal-details"><div><span>Category</span><strong>{selectedGig.category}</strong></div><div><span>Compensation</span><strong>{selectedGig.payment}{selectedGig.budget && ` · ${selectedGig.budget}`}</strong></div><div><span>Deadline</span><strong>{selectedGig.deadline}</strong></div></div><div className="modal-actions">{appliedIds.includes(selectedGig.id) ? <Button disabled><Check data-icon="inline-start" />Application sent</Button> : <Button onClick={() => apply(selectedGig)}><Send data-icon="inline-start" />Apply to this gig</Button>}<Button variant="outline" onClick={() => setSelectedGig(null)}>Maybe later</Button></div></div></div>}
      {showPost && <div className="modal-backdrop" onClick={() => setShowPost(false)}><div className="post-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowPost(false)} aria-label="Close"><X /></button><p className="eyebrow">NEW OPPORTUNITY</p><h2>Post a gig</h2><p className="modal-description">Tell your campus community what you need or what you can offer.</p><label>Gig title<input placeholder="e.g. Help me build a portfolio site" /></label><label>What are you posting?<select><option>I&apos;m looking for help</option><option>I&apos;m offering help</option></select></label><label>Describe your gig<textarea placeholder="Add details about the project, expectations, and timeline..." rows={4} /></label><div className="modal-actions"><Button onClick={() => { setShowPost(false); notify('Your gig is ready to publish') }}>Publish gig <ArrowRight data-icon="inline-end" /></Button><Button variant="outline" onClick={() => setShowPost(false)}>Cancel</Button></div></div></div>}
      {toast && <div className="toast"><Check />{toast}</div>}
    </div>
  )
}
