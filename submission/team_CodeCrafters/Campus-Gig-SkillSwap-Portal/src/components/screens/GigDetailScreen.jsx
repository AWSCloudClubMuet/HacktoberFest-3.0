import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { RatingStars } from '../common/RatingStars';
import { GigCard } from '../cards/GigCard';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Share2,
  ExternalLink
} from 'lucide-react';

export function GigDetailScreen() {
  const {
    selectedGigId,
    gigs,
    users,
    currentUser,
    applications,
    reviews,
    setCurrentScreen,
    viewProfile,
    bookmarks,
    toggleBookmark,
    applyToGig,
    isGigExpired,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('details');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [pitchMessage, setPitchMessage] = useState('');
  const [applyError, setApplyError] = useState('');

  const gig = gigs.find(g => g.id === selectedGigId) || gigs[0];
  const poster = users.find(u => u.id === gig.user_id) || {
    id: gig.user_id,
    name: gig.poster_name,
    avatar: gig.poster_avatar,
    rating: gig.poster_rating,
    major: "Campus Student",
    semester: "4th Sem",
    bio: "Student collaborator on CampusLoop.",
    skills: gig.skills_required || []
  };

  const isSaved = bookmarks.includes(gig.id);
  const isOwner = gig.user_id === currentUser.id;
  const isExpired = isGigExpired(gig);
  const hasApplied = applications.some(a => a.gig_id === gig.id && a.applicant_id === currentUser.id);

  // Poster reviews
  const posterReviews = reviews.filter(r => r.reviewee_id === poster.id);

  // Related gigs in same category
  const relatedGigs = gigs
    .filter(g => g.id !== gig.id && g.category === gig.category && g.status === 'Open')
    .slice(0, 3);

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!pitchMessage.trim()) {
      setApplyError('Please write a short pitch or intro explaining how you can help.');
      return;
    }
    if (pitchMessage.trim().length < 15) {
      setApplyError('Please provide at least 15 characters describing your relevant skills.');
      return;
    }

    const success = applyToGig(gig.id, pitchMessage);
    if (success) {
      setPitchMessage('');
      setApplyError('');
      setIsApplyModalOpen(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast("Gig link copied to clipboard!", 'info');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Navigation Row: Back button & Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentScreen('explore')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Share Opportunity"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleBookmark(gig.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isSaved
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Details Card (Hero Section) */}
      <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle overflow-hidden transition-colors duration-200">
        
        {/* Banner image */}
        {gig.image && (
          <div className="relative h-64 sm:h-80 w-full bg-[var(--bg-surface-secondary)] overflow-hidden">
            <img
              src={gig.image}
              alt={gig.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 sm:left-6 flex flex-wrap gap-2 items-center">
              <Badge variant={gig.category} size="md">{gig.category}</Badge>
              <Badge variant={gig.type} size="md">{gig.type}</Badge>
              <Badge variant={gig.payment_type} size="md">
                {gig.payment_type === 'Paid' && gig.budget ? `₹${gig.budget}` : gig.payment_type}
              </Badge>
              {gig.status !== 'Open' && (
                <Badge variant={gig.status} size="md">{gig.status}</Badge>
              )}
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Title & CTA Actions */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
            <div className="space-y-3 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-snug">
                {gig.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[var(--text-secondary)]">
                <div
                  onClick={() => viewProfile(poster.id)}
                  className="flex items-center gap-2 cursor-pointer hover:text-[var(--primary-emerald)] font-medium"
                >
                  <img
                    src={poster.avatar}
                    alt={poster.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-[var(--border-color)]"
                  />
                  <span>By {poster.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <RatingStars rating={poster.rating} size="xs" />
                  <span className="font-semibold text-[var(--text-primary)]">{poster.rating}</span>
                  <span className="text-[var(--text-muted)]">({posterReviews.length} reviews)</span>
                </div>

                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Deadline: {gig.deadline || "Flexible"}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Users className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>{gig.applicants_count || 0} applicants</span>
                </div>
              </div>
            </div>

            {/* Main Action Button */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px]">
              {isOwner ? (
                <button
                  onClick={() => setCurrentScreen('manage-applications')}
                  className="w-full px-6 py-3 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white font-bold text-sm shadow-md transition-all text-center"
                >
                  Manage Applications ({gig.applicants_count || 0})
                </button>
              ) : hasApplied ? (
                <div className="w-full px-5 py-3 rounded-xl bg-[var(--primary-emerald-light)] border border-[var(--primary-emerald)]/30 text-[var(--primary-emerald-text)] text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--primary-emerald)]" />
                  <span>Application Submitted</span>
                </div>
              ) : isExpired ? (
                <div className="w-full px-5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold text-center">
                  This gig has expired
                </div>
              ) : gig.status !== 'Open' ? (
                <div className="w-full px-5 py-3 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-semibold text-center">
                  Gig is {gig.status}
                </div>
              ) : (
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="w-full px-6 py-3 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Apply Now</span>
                </button>
              )}

              <button
                onClick={() => setCurrentScreen('messages')}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-primary)] font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message Poster</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--border-color)] gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'details' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Project Details</span>
              {activeTab === 'details' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('about-poster')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'about-poster' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>About Poster</span>
              {activeTab === 'about-poster' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 relative transition-colors ${
                activeTab === 'reviews' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Poster Reviews ({posterReviews.length})</span>
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
            
            {/* Left 8 Cols: Description & Details */}
            <div className="lg:col-span-8 space-y-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Project Description</h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">
                      {gig.description}
                    </p>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Desired Skills & Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {(gig.skills_required || [gig.category]).map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-xl bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-semibold"
                        >
                          #{s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Gig Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                      <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                        Discipline
                      </span>
                      <span className="font-bold text-sm text-[var(--text-primary)]">{gig.category}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                      <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                        Compensation
                      </span>
                      <span className="font-bold text-sm text-[var(--primary-emerald)]">
                        {gig.payment_type === 'Paid' ? `₹${gig.budget}` : gig.payment_type}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)]">
                      <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                        Engagement Type
                      </span>
                      <span className="font-bold text-sm text-[var(--text-primary)]">{gig.type}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about-poster' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={poster.avatar}
                      alt={poster.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[var(--primary-emerald)]/30"
                    />
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] text-base">{poster.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">{poster.major} • {poster.semester}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <RatingStars rating={poster.rating} size="xs" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">{poster.rating}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {poster.bio}
                  </p>

                  <div className="pt-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] block mb-2">Student Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {poster.skills?.map((sk, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-[var(--primary-emerald-light)] text-[var(--primary-emerald-text)] text-xs font-medium border border-[var(--primary-emerald)]/20">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => viewProfile(poster.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary-emerald)] hover:underline pt-2"
                  >
                    <span>View full student profile and past work</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {posterReviews.length > 0 ? (
                    posterReviews.map(r => (
                      <div key={r.id} className="p-4 rounded-xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img
                              src={r.reviewer_avatar}
                              alt={r.reviewer_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-bold text-[var(--text-primary)]">{r.reviewer_name}</span>
                          </div>
                          <RatingStars rating={r.rating} size="xs" />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
                          "{r.comment}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                      No peer reviews posted for this student yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right 4 Cols: Poster Quick Card & Safety */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Poster Profile Widget */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={poster.avatar}
                    alt={poster.name}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-[var(--border-color)]"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">{poster.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{poster.major}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{poster.semester}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-[var(--border-color)]">
                  <div className="bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-color)]">
                    <span className="text-xs font-extrabold text-[var(--text-primary)]">{poster.gigs_posted || 0}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">Gigs Posted</span>
                  </div>
                  <div className="bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-color)]">
                    <span className="text-xs font-extrabold text-[var(--primary-emerald)]">{poster.gigs_completed || 0}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">Completed</span>
                  </div>
                </div>

                <button
                  onClick={() => viewProfile(poster.id)}
                  className="w-full py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] transition-colors"
                >
                  View Profile
                </button>
              </div>

              {/* Campus Verified Banner */}
              <div className="p-4 rounded-2xl bg-[var(--primary-emerald-light)] border border-[var(--primary-emerald)]/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--primary-emerald)] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-[var(--primary-emerald-text)]">Campus Verified Project</p>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-[11px]">
                    Collaborations are tracked on-platform with verified mutual ratings upon task completion.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Application Pitch Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-surface)] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">
                Apply for Opportunity
              </h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1">Applying for:</p>
              <p className="font-bold text-[var(--text-primary)] text-sm">{gig.title}</p>
              <div className="flex gap-2 items-center mt-1">
                <span className="text-xs font-medium text-[var(--primary-emerald-text)] bg-[var(--primary-emerald-light)] px-2 py-0.5 rounded">
                  {gig.payment_type === 'Paid' ? `Budget: ₹${gig.budget}` : gig.payment_type}
                </span>
                <span className="text-xs text-[var(--text-muted)]">• Deadline: {gig.deadline}</span>
              </div>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Your Pitch & Proposal Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={pitchMessage}
                  onChange={(e) => {
                    setPitchMessage(e.target.value);
                    setApplyError('');
                  }}
                  rows={4}
                  placeholder="Introduce yourself, your relevant coursework or projects, and when you can deliver..."
                  className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-outline)]/30 focus:border-[var(--primary-emerald)] placeholder:text-[var(--text-muted)]"
                />
                {applyError && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{applyError}</span>
                  </p>
                )}
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Applying as <span className="font-semibold text-[var(--text-primary)]">{currentUser.name}</span> ({currentUser.major})
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Related Opportunities */}
      {relatedGigs.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="font-bold text-lg text-[var(--text-primary)]">
            Similar Opportunities in {gig.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedGigs.map(rel => (
              <GigCard key={rel.id} gig={rel} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
