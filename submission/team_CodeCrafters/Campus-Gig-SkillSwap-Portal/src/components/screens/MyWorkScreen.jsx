import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Star,
  AlertCircle,
  Award
} from 'lucide-react';

export function MyWorkScreen() {
  const {
    currentUser,
    gigs,
    users,
    reviews,
    completeGig,
    submitReview,
    viewGig,
    viewProfile,
    setCurrentScreen
  } = useApp();

  const [reviewModalGig, setReviewModalGig] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [completingGigId, setCompletingGigId] = useState(null);

  const inProgressWork = gigs.filter(g =>
    (g.accepted_applicant_id === currentUser.id || (g.user_id === currentUser.id && Boolean(g.accepted_applicant_id))) &&
    g.status === 'In Progress'
  );

  const completedWork = gigs.filter(g =>
    (g.accepted_applicant_id === currentUser.id || (g.user_id === currentUser.id && Boolean(g.accepted_applicant_id))) &&
    g.status === 'Completed'
  );

  const handleOpenReview = (gig) => {
    setReviewModalGig(gig);
    setRatingScore(5);
    setReviewComment('');
    setReviewError('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingReview) return;
    if (!reviewComment.trim()) {
      setReviewError('Please write feedback for your collaborator.');
      return;
    }

    const isOwner = reviewModalGig.user_id === currentUser.id;
    const revieweeId = isOwner ? reviewModalGig.accepted_applicant_id : reviewModalGig.user_id;

    setIsSubmittingReview(true);
    try {
      const success = await submitReview({
        gigId: reviewModalGig.id,
        revieweeId,
        rating: ratingScore,
        comment: reviewComment
      });

      if (success) {
        setReviewModalGig(null);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCompleteGig = async (gigId) => {
    if (completingGigId) return;
    setCompletingGigId(gigId);
    try {
      await completeGig(gigId);
    } finally {
      setCompletingGigId(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          My Active Work & Collaborations
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Track deliverables for projects in progress, complete milestones, and submit mutual peer reviews.
        </p>
      </div>

      {/* Active Work In Progress Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span>In Progress Work ({inProgressWork.length})</span>
          </h2>
        </div>

        {inProgressWork.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {inProgressWork.map(gig => {
              const isOwner = gig.user_id === currentUser.id;
              const counterpartId = isOwner ? gig.accepted_applicant_id : gig.user_id;
              const counterpart = users.find(u => u.id === counterpartId);

              return (
                <div
                  key={gig.id}
                  className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle p-5 sm:p-6 space-y-4 flex flex-col justify-between transition-colors duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1.5 items-center">
                        <Badge variant="In Progress">In Progress</Badge>
                        <Badge variant={gig.category}>{gig.category}</Badge>
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {gig.payment_type === 'Paid' ? `₹${gig.budget}` : gig.payment_type}
                      </span>
                    </div>

                    <h3
                      onClick={() => viewGig(gig.id)}
                      className="font-bold text-[var(--text-primary)] hover:text-[var(--primary-emerald)] cursor-pointer text-base line-clamp-1"
                    >
                      {gig.title}
                    </h3>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {gig.description}
                    </p>

                    {/* Collaborator Card */}
                    {counterpart && (
                      <div
                        onClick={() => viewProfile(counterpart.id)}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                      >
                        <img
                          src={counterpart.avatar}
                          alt={counterpart.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-[var(--border-color)]"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-[var(--text-muted)] font-semibold block uppercase">
                            {isOwner ? "Accepted Contributor" : "Gig Poster / Client"}
                          </span>
                          <span className="font-bold text-xs text-[var(--text-primary)] block truncate">
                            {counterpart.name}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] truncate block">
                            {counterpart.major}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentScreen('messages');
                          }}
                          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary-emerald)] hover:bg-[var(--bg-surface)]"
                          title="Message Collaborator"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions & Completion */}
                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>Due: {gig.deadline || "Flexible"}</span>
                    </div>

                    <button
                      onClick={() => handleCompleteGig(gig.id)}
                      disabled={completingGigId === gig.id}
                      className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{completingGigId === gig.id ? 'Completing...' : 'Mark as Complete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center text-[var(--text-secondary)] space-y-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">No active collaborations in progress</p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Once you accept an applicant for your gig or another student accepts your application, the project moves here.
            </p>
          </div>
        )}
      </section>

      {/* Completed Collaborations Section */}
      <section className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Award className="w-5 h-5 text-[var(--primary-emerald)]" />
          <span>Completed Work & Reviews Archive ({completedWork.length})</span>
        </h2>

        {completedWork.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {completedWork.map(gig => {
              const hasReviewed = reviews.some(r => r.gig_id === gig.id && r.reviewer_id === currentUser.id);

              return (
                <div
                  key={gig.id}
                  className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle p-5 sm:p-6 space-y-4 flex flex-col justify-between transition-colors duration-200"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="Completed">Completed</Badge>
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">
                        {gig.payment_type === 'Paid' ? `₹${gig.budget}` : gig.payment_type}
                      </span>
                    </div>

                    <h4
                      onClick={() => viewGig(gig.id)}
                      className="font-bold text-[var(--text-primary)] hover:text-[var(--primary-emerald)] cursor-pointer text-base"
                    >
                      {gig.title}
                    </h4>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {gig.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                    <span className="text-xs text-[var(--primary-emerald)] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Completed</span>
                    </span>

                    {hasReviewed ? (
                      <span className="text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-surface-secondary)] px-3 py-1 rounded-lg">
                        Review Submitted ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenReview(gig)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Leave Review</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center text-[var(--text-muted)] text-xs">
            No completed projects archived yet.
          </div>
        )}
      </section>

      {/* Review Modal */}
      {reviewModalGig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-surface)] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[var(--border-color)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Submit Mutual Peer Review</span>
              </h3>
              <button
                onClick={() => setReviewModalGig(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Reviewing for project: <span className="font-bold text-[var(--text-primary)]">{reviewModalGig.title}</span>
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                  Rating Score (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= ratingScore ? 'fill-amber-500' : 'text-slate-300 dark:text-slate-700'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[var(--text-primary)] ml-2">
                    {ratingScore}.0 / 5.0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Peer Review & Feedback <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => {
                    setReviewComment(e.target.value);
                    setReviewError('');
                  }}
                  placeholder="Share details about collaboration quality, responsiveness, technical execution, and reliability..."
                  className="w-full p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-outline)]/30 focus:border-[var(--primary-emerald)] placeholder:text-[var(--text-muted)]"
                />
                {reviewError && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{reviewError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setReviewModalGig(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {isSubmittingReview ? 'Publishing Review...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
