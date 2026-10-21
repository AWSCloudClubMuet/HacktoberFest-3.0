// client/src/components/ReviewModal.jsx
import React, { useState } from 'react';
import { X, Star, AlertCircle, MessageSquare } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';

export default function ReviewModal({ gig, onClose, onSuccess }) {
  const { currentUser } = useUser();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!gig) return null;

  const isOwner = currentUser?.id === gig.user_id;
  const isAcceptedApplicant = currentUser?.id === gig.accepted_applicant_id;

  // Determine reviewee
  const reviewee = isOwner ? gig.accepted_applicant : gig.owner;
  const revieweeId = isOwner ? gig.accepted_applicant_id : gig.user_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isOwner && !isAcceptedApplicant) {
      setError("Only the opportunity poster or accepted applicant can submit a review.");
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!comment || comment.trim().length < 3) {
      setError("Please write a short review comment (at least 3 characters).");
      return;
    }

    try {
      setSubmitting(true);
      const rev = await api.createReview({
        gig_id: gig.id,
        reviewer_id: currentUser.id,
        reviewee_id: revieweeId,
        rating: Number(rating),
        comment: comment.trim()
      }, currentUser.id);

      setComment('');
      if (onSuccess) onSuccess(rev);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg max-w-lg w-full p-5 sm:p-6 shadow-xl border border-[#E3E9E4] relative animate-in fade-in duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#68746D] hover:text-[#202923] p-1 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-[11px] font-semibold text-[#C48D35] uppercase tracking-wider bg-[#FEF8EE] px-2 py-0.5 rounded border border-[#E5AD52]/20">
            Verified Peer Review
          </span>
          <h2 className="font-semibold text-base text-[#202923] mt-1.5">
            Review {reviewee?.name || 'Student Peer'}
          </h2>
          <p className="text-xs text-[#68746D] mt-0.5">
            For completed gig: <span className="font-medium text-[#202923]">{gig.title}</span>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-[#FDF1F1] border border-[#B93838]/20 text-[#B93838] text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div className="bg-[#F8FAF8] p-4 rounded-md border border-[#E3E9E4] flex flex-col items-center justify-center">
            <label className="text-xs font-semibold text-[#202923] mb-2">Overall Collaboration Rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-105 transition-transform focus:outline-hidden"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        filled ? 'fill-[#E5AD52] text-[#E5AD52]' : 'text-[#E3E9E4]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] font-medium text-[#68746D] mt-1.5">
              {rating === 5 ? '5 Stars — Exceptional' : 
               rating === 4 ? '4 Stars — Very Good' : 
               rating === 3 ? '3 Stars — Average' : 
               rating === 2 ? '2 Stars — Needs Improvement' : '1 Star — Poor'}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-[#202923] mb-1">
              Feedback & Comments <span className="text-[#B93838]">*</span>
            </label>
            <textarea
              rows="3"
              placeholder="Share how the collaboration went, communication quality, and timeliness..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
              required
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-[#68746D]">
              <span>Contributes to peer reputation</span>
              <span>{comment.length} characters</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-[#68746D] hover:bg-[#E3E9E4]/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || comment.trim().length < 3}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] disabled:opacity-50 transition-standard shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
