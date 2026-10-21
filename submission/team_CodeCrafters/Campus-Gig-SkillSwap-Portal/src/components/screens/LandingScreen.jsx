import React from 'react';
import { useApp } from '../../context/AppContext';
import { GigCard } from '../cards/GigCard';
import {
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Award,
  Zap,
  BookOpen,
  Code2,
  Palette,
  PenTool,
  Repeat
} from 'lucide-react';

export function LandingScreen() {
  const {
    gigs,
    setCurrentScreen,
    globalSearch,
    setGlobalSearch,
    platformStats,
    recommendedGigs,
    currentUser
  } = useApp();

  const handleHeroSearch = (e) => {
    e.preventDefault();
    setCurrentScreen('explore');
  };

  const featuredGigs = gigs.filter(g => g.status === 'Open').slice(0, 4);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-2 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center">
          
          {/* Left Text & Search */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--primary-emerald-light)] text-[var(--primary-emerald-text)] border border-[var(--primary-emerald)]/30 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[var(--primary-emerald)] animate-pulse" />
              <span>CampusLoop Live Portal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight leading-[1.12]">
              Skills connect. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-emerald)] via-teal-500 to-[var(--accent-indigo)]">
                Opportunities grow.
              </span>
            </h1>

            <p className="text-[var(--text-secondary)] text-base sm:text-lg max-w-2xl leading-relaxed">
              Find campus gigs, offer your talents, or request peer assistance. Build your portfolio, exchange skills, and earn reputational trust right on campus.
            </p>

            {/* Hero Search Box */}
            <form
              onSubmit={handleHeroSearch}
              className="p-2 sm:p-2.5 bg-[var(--bg-surface)] rounded-2xl shadow-card border border-[var(--border-color)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl transition-colors duration-200"
            >
              <div className="flex-1 flex items-center px-3 py-1 gap-2">
                <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search gigs, skills, e.g. 'React', 'Logo', 'Calculus'..."
                  className="w-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-transparent focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white text-sm font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Action Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl pt-2">
              <button
                onClick={() => setCurrentScreen('create-gig')}
                className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--primary-emerald)] hover:bg-[var(--bg-hover)] text-left transition-all shadow-subtle group"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)] flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Offer a Gig</div>
                <div className="text-[10px] text-[var(--text-muted)]">Earn & teach</div>
              </button>

              <button
                onClick={() => setCurrentScreen('explore')}
                className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--primary-emerald)] hover:bg-[var(--bg-hover)] text-left transition-all shadow-subtle group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Search className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Find a Gig</div>
                <div className="text-[10px] text-[var(--text-muted)]">26+ opportunities</div>
              </button>

              <button
                onClick={() => {
                  setGlobalSearch('Skill Swap');
                  setCurrentScreen('explore');
                }}
                className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent-indigo)] hover:bg-[var(--bg-hover)] text-left transition-all shadow-subtle group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Skill Swap</div>
                <div className="text-[10px] text-[var(--text-muted)]">Zero cash required</div>
              </button>

              <button
                onClick={() => setCurrentScreen('reviews')}
                className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-amber-400 hover:bg-[var(--bg-hover)] text-left transition-all shadow-subtle group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)]">Reputation</div>
                <div className="text-[10px] text-[var(--text-muted)]">Verified peer reviews</div>
              </button>
            </div>

          </div>

          {/* Right Campus Opportunity Composition (Sophisticated Layered Visuals) */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
            <div className="relative w-full max-w-lg">
              
              {/* Subtle ambient lighting glows */}
              <div className="absolute -top-6 -right-6 w-48 h-48 bg-[var(--primary-emerald)]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-52 h-52 bg-[var(--accent-indigo)]/15 rounded-full blur-3xl pointer-events-none" />

              {/* Main Opportunity Card (Layer 1) */}
              <div className="relative bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
                {/* Header with live status */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary-emerald)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary-emerald)]" />
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">Active Campus Opportunity</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-[var(--primary-emerald)] border border-[var(--primary-emerald)]/20">
                    Skill Swap
                  </span>
                </div>

                {/* Gig Title & Meta */}
                <div className="pt-4 pb-3">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-medium mb-1.5">
                    <span className="text-[var(--accent-indigo)] font-bold">Programming ⇄ Design</span>
                    <span>•</span>
                    <span>Fall Term Project</span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] leading-snug">
                    React Portfolio for Brand Identity & Logo Pack
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                    Collaborating with digital media students to swap a responsive web portal for custom logo vectors and presentation decks.
                  </p>
                </div>

                {/* Collaborators row */}
                <div className="p-3 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-[var(--bg-surface)]">
                        AS
                      </div>
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-[var(--bg-surface)]">
                        SP
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">Aarav S. ⇄ Sneha P.</div>
                      <div className="text-[10px] text-[var(--text-muted)]">CS 6th Sem • Design 4th Sem</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--primary-emerald)] bg-[var(--primary-emerald-light)] px-2 py-0.5 rounded-lg">
                    In Progress
                  </span>
                </div>

                {/* Skill tags */}
                <div className="flex flex-wrap gap-1.5 pt-3">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    #React
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    #Figma
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    #TailwindCSS
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                    #BrandIdentity
                  </span>
                </div>
              </div>

              {/* Floating Top Badge (Peer Rating Notification) */}
              <div className="absolute -top-5 -left-4 sm:-left-6 bg-[var(--bg-surface)]/95 backdrop-blur-md rounded-2xl border border-[var(--border-color)] p-3 shadow-lg flex items-center gap-3 max-w-[260px] sm:max-w-xs">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-bold text-xs">
                  ★ 5.0
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">100% Verified Peer Rating</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">Mutual reviews build campus trust</div>
                </div>
              </div>

              {/* Floating Bottom Badge (Live Gig Counter) */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-[var(--bg-surface)]/95 backdrop-blur-md rounded-2xl border border-[var(--border-color)] p-3 shadow-lg flex items-center gap-3 max-w-[260px] sm:max-w-xs">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text-primary)]">26 Campus Gigs Live</div>
                  <div className="text-[10px] text-[var(--text-muted)]">Verified students across 4 faculties</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Platform Stats Row */}
      <section className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-6 sm:p-8 shadow-subtle transition-colors duration-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              {platformStats.activeGigs}+
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)]">Active Campus Gigs</div>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--primary-emerald)]">
              {platformStats.totalStudents}+
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)]">Verified Students</div>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--accent-indigo)]">
              {platformStats.swapsCompleted}+
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)]">Collaborations Completed</div>
          </div>
          <div className="space-y-1 pt-4 md:pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500">
              {platformStats.avgSatisfaction} ★
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)]">Average Student Rating</div>
          </div>
        </div>
      </section>

      {/* Browse by Disciplines / Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Browse by Academic Discipline
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Targeted student skills ready for immediate collaboration
            </p>
          </div>
          <button
            onClick={() => setCurrentScreen('explore')}
            className="text-xs font-bold text-[var(--primary-emerald)] hover:opacity-80 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <button
            onClick={() => {
              setGlobalSearch('Programming');
              setCurrentScreen('explore');
            }}
            className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-blue-400 hover:shadow-card transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-sm group-hover:text-blue-600">Programming</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Web, Python, App Dev, Firmware</p>
          </button>

          <button
            onClick={() => {
              setGlobalSearch('Design');
              setCurrentScreen('explore');
            }}
            className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-purple-400 hover:shadow-card transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-sm group-hover:text-purple-600">Design & Media</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Figma, Posters, 3D CAD, Video</p>
          </button>

          <button
            onClick={() => {
              setGlobalSearch('Writing');
              setCurrentScreen('explore');
            }}
            className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-amber-400 hover:shadow-card transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PenTool className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-sm group-hover:text-amber-600">Writing & SOPs</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Essays, Research Papers, Editing</p>
          </button>

          <button
            onClick={() => {
              setGlobalSearch('Tutoring');
              setCurrentScreen('explore');
            }}
            className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-emerald-400 hover:shadow-card transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-sm group-hover:text-emerald-600">Tutoring & STEM</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Calculus, Physics, DSA, Mentorship</p>
          </button>

        </div>
      </section>

      {/* Featured Opportunities Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Featured Opportunities
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Top curated gigs currently open for student collaboration
            </p>
          </div>
          <button
            onClick={() => setCurrentScreen('explore')}
            className="text-xs font-bold text-[var(--primary-emerald)] hover:opacity-80 flex items-center gap-1 group"
          >
            <span>View all ({gigs.filter(g => g.status === 'Open').length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {featuredGigs.map(gig => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      </section>

      {/* Recommended for Your Skills Section */}
      {recommendedGigs.length > 0 && (
        <section className="bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 space-y-4 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary-emerald)] text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-lg">
                  Recommended for your skills: {currentUser.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Matches your profile tags: {currentUser.skills.slice(0, 3).join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentScreen('explore')}
              className="text-xs font-bold text-[var(--primary-emerald)] hover:underline"
            >
              Browse match algorithm →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendedGigs.map(gig => (
              <GigCard key={gig.id} gig={gig} compact />
            ))}
          </div>
        </section>
      )}

      {/* How CampusLoop Works */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            How CampusLoop Works
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            A trusted three-step workflow designed for peer accountability
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-color)] shadow-subtle relative transition-colors duration-200">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-emerald-light)] text-[var(--primary-emerald-text)] font-bold flex items-center justify-center text-sm mb-4">
              01
            </div>
            <h4 className="font-bold text-[var(--text-primary)] text-base mb-1">Post or Discover Gigs</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Create an offering or post a request with your budget, skill swap, or free tutoring. Filter by discipline and timeline.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-color)] shadow-subtle relative transition-colors duration-200">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-sm mb-4">
              02
            </div>
            <h4 className="font-bold text-[var(--text-primary)] text-base mb-1">Collaborate Securely</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Review applicant pitches, accept the best collaborator, lock in the timeline, and coordinate via in-app messaging.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-3xl p-6 border border-[var(--border-color)] shadow-subtle relative transition-colors duration-200">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-sm mb-4">
              03
            </div>
            <h4 className="font-bold text-[var(--text-primary)] text-base mb-1">Mutual Reviews & Reputation</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Upon completion, exchange verified ratings and build a permanent campus transcript of practical project experience.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-[#008F72] via-[#00765E] to-[#121A2B] rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-float">
        <div className="max-w-xl mx-auto space-y-2">
          <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to exchange skills on campus?
          </h3>
          <p className="text-slate-200 text-sm">
            Join hundreds of verified university students building real-world projects today.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setCurrentScreen('create-gig')}
            className="px-6 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold transition-all shadow-md hover:bg-slate-100 active:scale-95"
          >
            Post a Gig Now
          </button>
          <button
            onClick={() => setCurrentScreen('explore')}
            className="px-6 py-3 rounded-xl bg-black/30 hover:bg-black/50 active:scale-95 text-white text-sm font-semibold transition-all border border-white/20"
          >
            Explore Opportunities
          </button>
        </div>
      </section>

    </div>
  );
}
