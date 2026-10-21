// client/src/components/ApplicationModal.jsx
import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';

export default function ApplicationModal({ gig, onClose, onSuccess }) {
  const { currentUser } = useUser();
  const [message, setMessage] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!gig) return null;

  const isOwner = currentUser?.id === gig.user_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isOwner) {
      setError("You cannot apply to an opportunity you created.");
      return;
    }

    if (!message || message.trim().length < 5) {
      setError("Please write a message explaining how you can help (at least 5 characters).");
      return;
    }

    try {
      setSubmitting(true);
      const app = await api.createApplication({
        gig_id: gig.id,
        applicant_id: currentUser.id,
        message: message.trim(),
        contact_link: contactLink.trim()
      }, currentUser.id);

      setMessage('');
      setContactLink('');
      if (onSuccess) onSuccess(app);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit application");
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
          <span className="text-[11px] font-semibold text-[#176B52] uppercase tracking-wider bg-[#EEF5F1] px-2 py-0.5 rounded border border-[#DCEBE3]">
            Apply to Collaborate
          </span>
          <h2 className="font-semibold text-base text-[#202923] mt-1.5 line-clamp-1">
            {gig.title}
          </h2>
          <p className="text-xs text-[#68746D] mt-0.5">
            Posted by <span className="font-medium text-[#202923]">{gig.owner?.name || 'Student Peer'}</span>
          </p>
        </div>

        {isOwner ? (
          <div className="p-3.5 rounded-md bg-[#FEF8EE] border border-[#E5AD52]/30 text-[#C48D35] text-xs flex items-start gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C48D35]" />
            <div>
              <p className="font-semibold text-[#202923]">You are the author of this posting</p>
              <p className="mt-0.5 text-[#68746D]">You cannot apply to your own post. To test applicant flows, switch persona via the top navigation switcher.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-[#FDF1F1] border border-[#B93838]/20 text-[#B93838] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">
                Your Proposal / Message <span className="text-[#B93838]">*</span>
              </label>
              <textarea
                rows="4"
                placeholder="Explain why you are interested, your relevant coursework or skills, and when you can start..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
                required
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#68746D]">
                <span>Minimum 5 characters</span>
                <span>{message.length} characters</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">
                Portfolio or Contact Link (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. GitHub URL, LinkedIn, or university email"
                value={contactLink}
                onChange={(e) => setContactLink(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-[#E3E9E4] bg-white text-[#202923]"
              />
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
                disabled={submitting || message.trim().length < 5}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] disabled:opacity-50 transition-standard shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Send Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
