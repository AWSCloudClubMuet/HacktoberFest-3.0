import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { RatingStars } from '../common/RatingStars';
import { EmptyState } from '../common/EmptyState';
import {
  PlusCircle,
  Compass,
  Briefcase,
  Users,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Bell
} from 'lucide-react';

export function DashboardScreen() {
  const {
    currentUser,
    userPostedGigs,
    userAcceptedWork,
    applications,
    gigs,
    notifications,
    recommendedGigs,
    setCurrentScreen,
    viewGig
  } = useApp();

  const [activeTab, setActiveTab] = useState('posted');

  // My applications
  const myApplications = applications.filter(a => a.applicant_id === currentUser.id);

  // My work in progress
  const activeWork = userAcceptedWork.filter(g => g.status === 'In Progress');

  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#008F72] via-[#00765E] to-[#121A2B] rounded-3xl p-6 sm:p-8 text-white shadow-card">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Active Student Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Good morning, {currentUser.name}! 👋
          </h1>
          <p className="text-emerald-50 text-xs sm:text-sm max-w-lg">
            Here's what is happening with your posted gigs, applications, and campus collaborations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setCurrentScreen('create-gig')}
            className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 active:scale-95 text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a Gig</span>
          </button>
          <button
            onClick={() => setCurrentScreen('explore')}
            className="px-5 py-2.5 rounded-xl bg-black/20 hover:bg-black/35 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all border border-white/20 flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Explore</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-subtle flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Posted Gigs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            {userPostedGigs.length}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1">Live opportunities</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-subtle flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Active Applications</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--accent-indigo)]">
            {myApplications.filter(a => a.status === 'Pending').length}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1">{myApplications.length} total submitted</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-subtle flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Completed Gigs</span>
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--primary-emerald)]">
            {currentUser.gigs_completed || 0}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1">Verified collaborations</span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-subtle flex flex-col justify-between transition-colors duration-200">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Avg. Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
              {currentUser.rating || 5.0}
            </span>
            <RatingStars rating={currentUser.rating || 5.0} size="sm" />
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-1">{currentUser.reviews_count || 4} peer reviews</span>
        </div>

      </div>

      {/* Main Grid: Left Tabs (8 cols) & Right Activity (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 8 Columns: Tabbed Dashboard Lists */}
        <div className="lg:col-span-8 bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-6 shadow-subtle space-y-6 transition-colors duration-200">
          
          {/* Tabs bar */}
          <div className="flex border-b border-[var(--border-color)] gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('posted')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'posted' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Posted Gigs ({userPostedGigs.length})</span>
              {activeTab === 'posted' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'applications' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>My Applications ({myApplications.length})</span>
              {activeTab === 'applications' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('in-progress')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'in-progress' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Work in Progress ({activeWork.length})</span>
              {activeTab === 'in-progress' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
              )}
            </button>
          </div>

          {/* Tab 1: Posted Gigs */}
          {activeTab === 'posted' && (
            <div className="space-y-4">
              {userPostedGigs.length > 0 ? (
                userPostedGigs.map(gig => (
                  <div
                    key={gig.id}
                    onClick={() => viewGig(gig.id)}
                    className="p-4 rounded-2xl bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={gig.category}>{gig.category}</Badge>
                        <Badge variant={gig.status}>{gig.status}</Badge>
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {gig.payment_type === 'Paid' ? `₹${gig.budget}` : gig.payment_type}
                        </span>
                      </div>
                      <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary-emerald)] transition-colors text-sm sm:text-base">
                        {gig.title}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                        {gig.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <span className="font-bold text-[var(--text-primary)] block">
                          {gig.applicants_count || 0} applicants
                        </span>
                        <span className="text-[var(--text-muted)] text-[11px]">
                          Due: {gig.deadline || "Flexible"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentScreen('manage-applications');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--primary-emerald)] shadow-2xs"
                      >
                        Applicants
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No posted gigs yet"
                  description="Share your skills with other students or post a request for help."
                  actionText="+ Create Your First Gig"
                  onAction={() => setCurrentScreen('create-gig')}
                />
              )}
            </div>
          )}

          {/* Tab 2: My Applications */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {myApplications.length > 0 ? (
                myApplications.map(app => {
                  const targetGig = gigs.find(g => g.id === app.gig_id);
                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={app.status}>{app.status}</Badge>
                          <span className="text-xs text-[var(--text-muted)]">
                            Applied {new Date(app.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {targetGig && (
                          <button
                            onClick={() => viewGig(targetGig.id)}
                            className="text-xs font-bold text-[var(--primary-emerald)] hover:underline flex items-center gap-1"
                          >
                            <span>View Gig</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <h4 className="font-bold text-[var(--text-primary)] text-sm">
                        {targetGig ? targetGig.title : "Campus Opportunity"}
                      </h4>

                      <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] italic">
                        "{app.message}"
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title="No submitted applications"
                  description="Explore open opportunities and submit a pitch to collaborate with peers."
                  actionText="Explore Gigs"
                  onAction={() => setCurrentScreen('explore')}
                />
              )}
            </div>
          )}

          {/* Tab 3: Work in Progress */}
          {activeTab === 'in-progress' && (
            <div className="space-y-4">
              {activeWork.length > 0 ? (
                activeWork.map(gig => (
                  <div
                    key={gig.id}
                    className="p-5 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--primary-emerald)]/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                        In Progress
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] font-medium">
                        Due: {gig.deadline}
                      </span>
                    </div>

                    <h4 className="font-bold text-[var(--text-primary)] text-base">{gig.title}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{gig.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                      <span className="text-xs font-semibold text-[var(--primary-emerald)]">
                        {gig.payment_type === 'Paid' ? `Compensation: ₹${gig.budget}` : gig.payment_type}
                      </span>
                      <button
                        onClick={() => setCurrentScreen('my-work')}
                        className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-bold shadow-2xs"
                      >
                        Go to My Work
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No active projects in progress"
                  description="When your application is accepted, the project will appear here for progress tracking and completion."
                  actionText="Discover Gigs"
                  onAction={() => setCurrentScreen('explore')}
                />
              )}
            </div>
          )}

        </div>

        {/* Right 4 Columns: Recent Activity & Quick Recommendations */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Recent Activity Card */}
          <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] p-5 sm:p-6 shadow-subtle space-y-4 transition-colors duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-[var(--text-primary)] text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-[var(--primary-emerald)]" />
                <span>Recent Activity</span>
              </h3>
              <span className="text-[11px] font-semibold text-[var(--primary-emerald)]">Live</span>
            </div>

            <div className="space-y-3.5">
              {notifications.slice(0, 4).map(notif => (
                <div key={notif.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[var(--primary-emerald)] mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--text-primary)] leading-tight">{notif.title}</p>
                    <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-[var(--text-muted)] block">{notif.created_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personalized Skills Recommendations */}
          {recommendedGigs.length > 0 && (
            <div className="bg-[var(--bg-surface-secondary)] rounded-3xl border border-[var(--border-color)] p-5 space-y-3 transition-colors duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--primary-emerald)]" />
                <h4 className="font-bold text-[var(--text-primary)] text-xs">Matched For You</h4>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Opportunities fitting your skills ({currentUser.skills.slice(0, 2).join(', ')}):
              </p>

              <div className="space-y-2">
                {recommendedGigs.slice(0, 2).map(g => (
                  <div
                    key={g.id}
                    onClick={() => viewGig(g.id)}
                    className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--primary-emerald)] transition-all cursor-pointer shadow-2xs"
                  >
                    <p className="font-bold text-[var(--text-primary)] text-xs line-clamp-1">{g.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-1">
                      <span className="font-semibold text-[var(--primary-emerald)]">{g.payment_type === 'Paid' ? `₹${gigBudget(g)}` : g.payment_type}</span>
                      <span>{g.poster_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

function gigBudget(g) {
  return g.budget || 0;
}
