import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RatingStars } from '../common/RatingStars';
import { EmptyState } from '../common/EmptyState';
import {
  Star,
  ShieldCheck
} from 'lucide-react';

export function ReviewsScreen() {
  const { currentUser, reviews, gigs, setCurrentScreen, viewGig } = useApp();
  const [activeTab, setActiveTab] = useState('received');

  const receivedReviews = reviews.filter(r => r.reviewee_id === currentUser.id);
  const givenReviews = reviews.filter(r => r.reviewer_id === currentUser.id);

  // Overall rating calculations
  const totalReceived = receivedReviews.length;
  const avgRating = totalReceived
    ? (receivedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReceived).toFixed(1)
    : currentUser.rating || "5.0";

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Campus Reputation & Reviews
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          Share your feedback and build trust. Verified ratings earned through completed collaborations.
        </p>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Rating Score */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-subtle flex flex-col items-center justify-center text-center transition-colors duration-200">
          <div className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
            {avgRating}
          </div>
          <RatingStars rating={Number(avgRating)} size="md" className="mb-2" />
          <p className="text-xs text-[var(--text-muted)]">
            Based on {totalReceived} peer review{totalReceived === 1 ? '' : 's'}
          </p>
        </div>

        {/* Breakdown bar */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-subtle space-y-2 flex flex-col justify-center transition-colors duration-200">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = receivedReviews.filter(r => r.rating === star).length;
            const pct = totalReceived > 0 ? (count / totalReceived) * 100 : star === 5 ? 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <span>{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-surface-secondary)] overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-[var(--text-muted)] font-medium">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="p-6 rounded-3xl bg-[var(--primary-emerald-light)] border border-[var(--primary-emerald)]/30 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--primary-emerald-text)] font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-[var(--primary-emerald)]" />
              <span>Verified Campus Transcript</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Reviews can only be written after an opportunity is verified as "Completed". Duplicate reviews and fake reviews are mathematically rejected.
            </p>
          </div>
          <button
            onClick={() => setCurrentScreen('my-work')}
            className="w-full py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] active:scale-95 text-white text-xs font-bold transition-all shadow-2xs"
          >
            Review Finished Work
          </button>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'received' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Received ({receivedReviews.length})</span>
          {activeTab === 'received' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('given')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'given' ? 'text-[var(--primary-emerald)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>Given ({givenReviews.length})</span>
          {activeTab === 'given' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-emerald)] rounded-full" />
          )}
        </button>
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {activeTab === 'received' ? (
          receivedReviews.length > 0 ? (
            receivedReviews.map(r => {
              const relatedGig = gigs.find(g => g.id === r.gig_id);
              return (
                <div
                  key={r.id}
                  className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle p-5 sm:p-6 space-y-3 transition-colors duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.reviewer_avatar}
                        alt={r.reviewer_name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-[var(--border-color)]"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-[var(--text-primary)]">{r.reviewer_name}</span>
                          <span className="text-[var(--text-muted)] text-xs">➔</span>
                          <span className="text-xs font-semibold text-[var(--primary-emerald)]">Me</span>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <RatingStars rating={r.rating} size="sm" />
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-surface-secondary)] p-3.5 rounded-2xl border border-[var(--border-subtle)]">
                    "{r.comment}"
                  </p>

                  {relatedGig && (
                    <div className="pt-2 flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-color)]">
                      <span className="truncate max-w-sm">Project: {relatedGig.title}</span>
                      <button
                        onClick={() => viewGig(relatedGig.id)}
                        className="text-[var(--primary-emerald)] font-semibold hover:underline shrink-0"
                      >
                        View Project
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No reviews received yet"
              description="Complete gigs in 'My Work' to earn verified reviews and ratings from peers."
              actionText="Discover Opportunities"
              onAction={() => setCurrentScreen('explore')}
            />
          )
        ) : (
          givenReviews.length > 0 ? (
            givenReviews.map(r => (
              <div
                key={r.id}
                className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-subtle p-5 sm:p-6 space-y-3 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      Reviewed for {r.reviewee_name}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] block">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <RatingStars rating={r.rating} size="sm" />
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-surface-secondary)] p-3.5 rounded-2xl border border-[var(--border-subtle)]">
                  "{r.comment}"
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              title="No reviews given yet"
              description="When you finish a collaboration, leave honest feedback to help fellow students."
              actionText="View My Work"
              onAction={() => setCurrentScreen('my-work')}
            />
          )
        )}
      </div>

    </div>
  );
}
