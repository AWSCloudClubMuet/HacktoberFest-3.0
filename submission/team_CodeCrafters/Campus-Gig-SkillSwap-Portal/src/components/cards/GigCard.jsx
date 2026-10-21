import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { RatingStars } from '../common/RatingStars';
import { Bookmark, Clock, Users } from 'lucide-react';

export function GigCard({ gig, compact = false }) {
  const { viewGig, viewProfile, bookmarks, toggleBookmark, isGigExpired } = useApp();
  const isSaved = bookmarks.includes(gig.id);
  const expired = isGigExpired(gig);

  const calculateDaysLeft = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Ends today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const daysLeftText = calculateDaysLeft(gig.deadline);

  return (
    <div
      onClick={() => viewGig(gig.id)}
      className="group bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary-emerald)] shadow-subtle hover:shadow-card dark:hover:shadow-dark-card transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Top Banner image (unless compact) */}
      {!compact && gig.image && (
        <div className="relative h-44 w-full bg-[var(--bg-surface-secondary)] overflow-hidden">
          <img
            src={gig.image}
            alt={gig.title}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div
            style={{ display: 'none' }}
            className="w-full h-full bg-gradient-to-br from-[var(--primary-emerald-light)] to-[var(--bg-surface-secondary)] items-center justify-center text-[var(--primary-emerald)] font-bold text-sm"
          >
            {gig.category} Opportunity
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(gig.id);
            }}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-sm ${
              isSaved
                ? 'bg-rose-500 text-white'
                : 'bg-black/40 hover:bg-black/60 text-white hover:text-rose-400'
            }`}
            aria-label={isSaved ? "Remove bookmark" : "Save opportunity"}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Badges on image */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 items-center">
            <Badge variant={gig.category}>{gig.category}</Badge>
            <Badge variant={gig.type}>{gig.type}</Badge>
            <Badge variant={gig.payment_type}>
              {gig.payment_type === 'Paid' && gig.budget ? `₹${gig.budget}` : gig.payment_type}
            </Badge>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {compact && (
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge variant={gig.category}>{gig.category}</Badge>
                <Badge variant={gig.payment_type}>
                  {gig.payment_type === 'Paid' && gig.budget ? `₹${gig.budget}` : gig.payment_type}
                </Badge>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(gig.id);
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isSaved ? 'text-rose-500' : 'text-[var(--text-muted)] hover:text-rose-500'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}

          <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--primary-emerald)] transition-colors text-base line-clamp-2 leading-snug mb-1.5">
            {gig.title}
          </h3>

          <p className="text-[var(--text-secondary)] text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
            {gig.description}
          </p>

          {/* Skill tags */}
          {gig.skills_required && gig.skills_required.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {gig.skills_required.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)] text-[11px] font-medium border border-[var(--border-subtle)]"
                >
                  #{skill}
                </span>
              ))}
              {gig.skills_required.length > 3 && (
                <span className="text-[11px] text-[var(--text-muted)] font-medium self-center pl-1">
                  +{gig.skills_required.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer info: Poster, rating, applicants, deadline */}
        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2 text-xs">
          {/* Poster info */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              viewProfile(gig.user_id);
            }}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity"
          >
            <div className="relative shrink-0">
              {gig.poster_avatar ? (
                <img
                  src={gig.poster_avatar}
                  alt={gig.poster_name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-[var(--border-color)]"
                />
              ) : null}
              <div
                style={{ display: gig.poster_avatar ? 'none' : 'flex' }}
                className="w-6 h-6 rounded-full bg-[var(--primary-emerald-light)] text-[var(--primary-emerald)] font-bold text-[9px] items-center justify-center ring-1 ring-[var(--border-color)]"
              >
                {(gig.poster_name || 'U').slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-[var(--text-primary)] truncate max-w-[100px] sm:max-w-[120px]">
                {gig.poster_name}
              </span>
              <div className="flex items-center gap-1">
                <RatingStars rating={gig.poster_rating || 4.8} size="xs" />
                <span className="text-[10px] text-[var(--text-muted)] font-medium">{gig.poster_rating || 4.8}</span>
              </div>
            </div>
          </div>

          {/* Stats: Applicants & Deadline */}
          <div className="flex items-center gap-3 text-[var(--text-secondary)] shrink-0">
            <div className="flex items-center gap-1" title={`${gig.applicants_count || 0} applicants`}>
              <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="font-medium">{gig.applicants_count || 0}</span>
            </div>

            <div className={`flex items-center gap-1 font-medium ${expired ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{daysLeftText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
