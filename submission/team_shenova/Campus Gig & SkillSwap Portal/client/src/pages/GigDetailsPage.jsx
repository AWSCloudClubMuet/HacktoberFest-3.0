// client/src/pages/GigDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import CategoryBadge from '../components/CategoryBadge';
import PaymentBadge from '../components/PaymentBadge';
import ApplicationModal from '../components/ApplicationModal';
import ReviewModal from '../components/ReviewModal';
import { 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Send, 
  MessageSquare, 
  AlertCircle,
  Edit,
  Trash2,
  Check,
  GraduationCap
} from 'lucide-react';

export default function GigDetailsPage({ onShowToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, refreshCurrentUser, reloadUsers } = useUser();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGig = async () => {
    try {
      setLoading(true);
      const data = await api.getGig(id);
      setGig(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load gig:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGig();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-[#176B52] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-[#68746D] font-medium">Loading opportunity details...</p>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-[#FDF1F1] text-[#B93838] flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-semibold text-base text-[#202923] mb-1">Opportunity Not Found</h2>
        <p className="text-xs text-[#68746D] mb-6">{error || "This posting may have been removed or does not exist."}</p>
        <Link 
          to="/" 
          className="px-4 py-2 rounded-md bg-[#176B52] hover:bg-[#10513F] text-white text-xs font-semibold"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === gig.user_id;
  const isAcceptedApplicant = currentUser?.id === gig.accepted_applicant_id;
  const isParticipant = isOwner || isAcceptedApplicant;

  // Has current user applied?
  const myApplication = gig.applications?.find(a => a.applicant_id === currentUser?.id);

  // Has current user submitted a review?
  const myReview = gig.reviews?.find(r => r.reviewer_id === currentUser?.id);

  // Status transitions
  const handleAcceptApplicant = async (appId, applicantName) => {
    if (!window.confirm(`Accept application from ${applicantName}? This will set gig status to 'In Progress' and automatically reject other candidates.`)) {
      return;
    }
    try {
      setActionLoading(true);
      await api.updateApplication(appId, { action: 'accept' }, currentUser.id);
      if (onShowToast) onShowToast(`Accepted ${applicantName}. Opportunity is now In Progress.`, 'success');
      await fetchGig();
      await refreshCurrentUser();
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to accept: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectApplicant = async (appId) => {
    try {
      setActionLoading(true);
      await api.updateApplication(appId, { action: 'reject' }, currentUser.id);
      if (onShowToast) onShowToast("Application declined.", 'info');
      await fetchGig();
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to decline: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!window.confirm("Confirm that this opportunity work is finished? This will unlock mutual student reviews.")) {
      return;
    }
    try {
      setActionLoading(true);
      await api.updateGig(gig.id, { status: 'Completed' }, currentUser.id);
      if (onShowToast) onShowToast("Work marked Completed! Both parties can now leave reviews.", 'success');
      await fetchGig();
      await refreshCurrentUser();
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to complete: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelGig = async () => {
    if (!window.confirm("Are you sure you want to cancel this opportunity?")) return;
    try {
      setActionLoading(true);
      await api.updateGig(gig.id, { status: 'Cancelled' }, currentUser.id);
      if (onShowToast) onShowToast("Opportunity cancelled.", 'info');
      await fetchGig();
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to cancel: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGig = async () => {
    if (!window.confirm("Permanently delete this opportunity post? This action cannot be undone.")) return;
    try {
      setActionLoading(true);
      await api.deleteGig(gig.id, currentUser.id);
      if (onShowToast) onShowToast("Opportunity deleted successfully.", 'success');
      navigate('/');
    } catch (err) {
      if (onShowToast) onShowToast(`Failed to delete: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const skills = Array.isArray(gig.skills_required) && gig.skills_required.length > 0
    ? gig.skills_required
    : (Array.isArray(gig.skills_offered) ? gig.skills_offered : []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#68746D] hover:text-[#176B52] mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Main Details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-lg border border-[#E3E9E4] p-5 sm:p-7">
            {/* Header Badges */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${
                  gig.type === 'Offering' 
                    ? 'bg-[#EEF5F1] text-[#176B52] border border-[#DCEBE3]' 
                    : 'bg-[#F4F1EA] text-[#69583E] border border-[#E3DDD1]'
                }`}>
                  {gig.type}
                </span>
                <CategoryBadge category={gig.category} />
                <PaymentBadge paymentType={gig.payment_type} budget={gig.budget} />
              </div>
              <StatusBadge status={gig.status} size="lg" />
            </div>

            {/* Title */}
            <h1 className="font-bold text-xl sm:text-2xl text-[#202923] leading-snug mb-3">
              {gig.title}
            </h1>

            {/* Metadata row */}
            <div className="flex items-center gap-4 text-xs text-[#68746D] pb-5 mb-5 border-b border-[#E3E9E4] flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#68746D]" />
                <span>Posted {formatDate(gig.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#68746D]" />
                <span>Deadline: <strong className="text-[#202923]">{formatDate(gig.deadline)}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#68746D]" />
                <span>{gig.applications?.length || 0} applications</span>
              </div>
            </div>

            {/* Progression Stepper */}
            <div className="bg-[#F8FAF8] rounded-md p-4 border border-[#E3E9E4] mb-5">
              <p className="text-[11px] font-semibold text-[#68746D] uppercase tracking-wider mb-3">Progress Pipeline</p>
              <div className="flex items-center justify-between relative">
                {/* Step 1: Open */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    gig.status === 'Open' ? 'bg-[#176B52] text-white ring-3 ring-[#DCEBE3]' : 
                    ['In Progress', 'Completed'].includes(gig.status) ? 'bg-[#176B52] text-white' : 'bg-[#E3E9E4] text-[#68746D]'
                  }`}>
                    {['In Progress', 'Completed'].includes(gig.status) ? <Check className="w-3.5 h-3.5" /> : '1'}
                  </div>
                  <span className="text-[11px] font-medium text-[#202923] mt-1">Open</span>
                  <span className="text-[10px] text-[#68746D]">Accepting</span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${['In Progress', 'Completed'].includes(gig.status) ? 'bg-[#176B52]' : 'bg-[#E3E9E4]'}`}></div>

                {/* Step 2: In Progress */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    gig.status === 'In Progress' ? 'bg-[#C48D35] text-white ring-3 ring-[#FEF8EE]' : 
                    gig.status === 'Completed' ? 'bg-[#176B52] text-white' : 'bg-[#E3E9E4] text-[#68746D]'
                  }`}>
                    {gig.status === 'Completed' ? <Check className="w-3.5 h-3.5" /> : '2'}
                  </div>
                  <span className="text-[11px] font-medium text-[#202923] mt-1">In Progress</span>
                  <span className="text-[10px] text-[#68746D]">Active</span>
                </div>

                <div className={`flex-1 h-0.5 mx-2 ${gig.status === 'Completed' ? 'bg-[#176B52]' : 'bg-[#E3E9E4]'}`}></div>

                {/* Step 3: Completed */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    gig.status === 'Completed' ? 'bg-[#287653] text-white ring-3 ring-[#EAF4EE]' : 'bg-[#E3E9E4] text-[#68746D]'
                  }`}>
                    3
                  </div>
                  <span className="text-[11px] font-medium text-[#202923] mt-1">Completed</span>
                  <span className="text-[10px] text-[#68746D]">Review</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 mb-5">
              <h2 className="text-xs font-semibold text-[#68746D] uppercase tracking-wider">Opportunity Description</h2>
              <div className="text-xs sm:text-sm text-[#202923] leading-relaxed whitespace-pre-line bg-[#F8FAF8] p-4 rounded-md border border-[#E3E9E4]">
                {gig.description}
              </div>
            </div>

            {/* Required Skills */}
            {skills.length > 0 && (
              <div className="space-y-2 mb-5">
                <h2 className="text-xs font-semibold text-[#68746D] uppercase tracking-wider">
                  {gig.type === 'Offering' ? 'Skills Offered' : 'Skills Required'}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-[#F8FAF8] text-[#202923] border border-[#E3E9E4] text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="pt-5 border-t border-[#E3E9E4] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {gig.status === 'Open' && (
                    <Link
                      to={`/edit-gig/${gig.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#202923] bg-white border border-[#E3E9E4] hover:bg-[#F8FAF8]"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#68746D]" />
                      Edit Posting
                    </Link>
                  )}
                  {gig.status === 'In Progress' && (
                    <button
                      onClick={handleMarkCompleted}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Work as Completed
                    </button>
                  )}
                  {gig.status === 'Open' && (
                    <button
                      onClick={handleCancelGig}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#68746D] bg-white border border-[#E3E9E4] hover:bg-[#F8FAF8]"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Posting
                    </button>
                  )}
                </div>

                {(gig.status === 'Open' || gig.status === 'Cancelled') && (
                  <button
                    onClick={handleDeleteGig}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[#B93838] hover:bg-[#FDF1F1]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Applications Section */}
          <div className="bg-white rounded-lg border border-[#E3E9E4] p-5 sm:p-7">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E3E9E4]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#176B52]" />
                <h2 className="font-semibold text-sm sm:text-base text-[#202923]">
                  Applications ({gig.applications?.length || 0})
                </h2>
              </div>
              {isOwner && gig.status === 'Open' && (
                <span className="text-[11px] text-[#176B52] font-medium bg-[#EEF5F1] px-2.5 py-0.5 rounded border border-[#DCEBE3]">
                  Select 1 candidate
                </span>
              )}
            </div>

            {/* Current user's application if they applied */}
            {!isOwner && myApplication && (
              <div className="p-4 rounded-md bg-[#EEF5F1] border border-[#DCEBE3] mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#176B52]">Your Application</span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                    myApplication.status === 'Accepted' ? 'bg-[#176B52] text-white' :
                    myApplication.status === 'Rejected' ? 'bg-[#FDF1F1] text-[#B93838]' : 'bg-[#FEF8EE] text-[#C48D35]'
                  }`}>
                    {myApplication.status}
                  </span>
                </div>
                <p className="text-xs text-[#202923] leading-relaxed">"{myApplication.message}"</p>
                <p className="text-[10px] text-[#68746D] mt-1.5">Submitted on {formatDate(myApplication.created_at)}</p>
              </div>
            )}

            {/* Applications List for Owner */}
            {isOwner ? (
              gig.applications?.length > 0 ? (
                <div className="space-y-3">
                  {gig.applications.map(app => (
                    <div 
                      key={app.id} 
                      className={`p-4 rounded-md border transition-standard ${
                        app.status === 'Accepted' ? 'bg-[#EEF5F1] border-[#BCD7CA]' :
                        app.status === 'Rejected' ? 'bg-[#F8FAF8] border-[#E3E9E4] opacity-75' :
                        'bg-white border-[#E3E9E4] hover:border-[#176B52]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Link 
                          to={`/profile/${app.applicant_id}`}
                          className="flex items-center gap-2 hover:opacity-85"
                        >
                          <div className="w-7 h-7 rounded bg-[#DCEBE3] text-[#176B52] font-semibold flex items-center justify-center text-xs">
                            {app.applicant?.name?.split(' ').map(n=>n[0]).join('') || 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#202923]">{app.applicant?.name || 'Applicant'}</p>
                            <p className="text-[10px] text-[#68746D]">{app.applicant?.department || app.applicant?.major} • {app.applicant?.semester}</p>
                          </div>
                        </Link>

                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          app.status === 'Accepted' ? 'bg-[#176B52] text-white' :
                          app.status === 'Rejected' ? 'bg-[#FDF1F1] text-[#B93838]' : 'bg-[#FEF8EE] text-[#C48D35]'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#202923] bg-[#F8FAF8] p-2.5 rounded border border-[#E3E9E4] mb-2 leading-relaxed">
                        {app.message}
                      </p>

                      {app.contact_link && (
                        <p className="text-[11px] text-[#68746D] mb-2">
                          Contact / Portfolio: <a href={app.contact_link} target="_blank" rel="noopener noreferrer" className="text-[#176B52] underline">{app.contact_link}</a>
                        </p>
                      )}

                      {/* Owner actions on pending apps */}
                      {gig.status === 'Open' && app.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleRejectApplicant(app.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded text-xs font-medium text-[#68746D] hover:text-[#B93838] hover:bg-[#FDF1F1]"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAcceptApplicant(app.id, app.applicant?.name || 'Applicant')}
                            disabled={actionLoading}
                            className="px-3 py-1 rounded text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] shadow-xs"
                          >
                            Accept Applicant
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[#68746D] text-xs">
                  No applications received yet for this opportunity.
                </div>
              )
            ) : (
              // For Non-Owners
              <div>
                {gig.status === 'Open' && !myApplication && (
                  <div className="text-center py-4">
                    <p className="text-xs text-[#68746D] mb-3">
                      Interested in collaborating with {gig.owner?.name}? Submit your proposal.
                    </p>
                    <button
                      onClick={() => setApplyModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] shadow-xs transition-standard"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Apply to this Opportunity
                    </button>
                  </div>
                )}
                {gig.status !== 'Open' && !myApplication && (
                  <p className="text-xs text-[#68746D] text-center py-3">
                    Applications for this opportunity are closed (Status: {gig.status}).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Mutual Reviews Section */}
          {gig.status === 'Completed' && (
            <div className="bg-white rounded-lg border border-[#E3E9E4] p-5 sm:p-7">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E3E9E4]">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#E5AD52] fill-[#E5AD52]" />
                  <h2 className="font-semibold text-sm sm:text-base text-[#202923]">
                    Mutual Student Reviews ({gig.reviews?.length || 0})
                  </h2>
                </div>

                {isParticipant && !myReview && (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#176B52] hover:bg-[#10513F] shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Write a Review
                  </button>
                )}
              </div>

              {gig.reviews?.length > 0 ? (
                <div className="space-y-3">
                  {gig.reviews.map(rev => (
                    <div key={rev.id} className="p-3.5 rounded-md bg-[#F8FAF8] border border-[#E3E9E4] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#DCEBE3] text-[#176B52] font-semibold flex items-center justify-center text-xs">
                            {rev.reviewer?.name?.split(' ').map(n=>n[0]).join('') || 'S'}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-[#202923]">{rev.reviewer?.name}</span>
                            <span className="text-[10px] text-[#68746D] ml-2">reviewed {rev.reviewee?.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-medium text-[#C48D35] bg-[#FEF8EE] px-2 py-0.5 rounded border border-[#E5AD52]/20">
                          <Star className="w-3 h-3 fill-[#E5AD52] text-[#E5AD52]" />
                          <span>{rev.rating}.0</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#202923] italic pl-8">
                        "{rev.comment}"
                      </p>
                      <p className="text-[10px] text-[#68746D] pl-8">{formatDate(rev.created_at)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[#68746D] text-xs">
                  <p>Gig is completed. Both the student poster and collaborator can leave reviews.</p>
                  {isParticipant && !myReview && (
                    <button
                      onClick={() => setReviewModalOpen(true)}
                      className="mt-3 px-3.5 py-1.5 rounded-md bg-[#176B52] text-white text-xs font-semibold"
                    >
                      Be the first to review
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Student Poster Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg border border-[#E3E9E4] p-5">
            <h3 className="text-xs font-semibold text-[#68746D] uppercase tracking-wider mb-3">
              Posted By
            </h3>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-md bg-[#DCEBE3] text-[#176B52] font-semibold flex items-center justify-center text-sm shrink-0">
                {gig.owner?.name?.split(' ').map(n=>n[0]).join('') || 'S'}
              </div>
              <div>
                <Link to={`/profile/${gig.owner?.id}`} className="font-semibold text-sm text-[#202923] hover:text-[#176B52] transition-colors">
                  {gig.owner?.name}
                </Link>
                <p className="text-[11px] text-[#68746D]">{gig.owner?.department || gig.owner?.major} • {gig.owner?.semester}</p>
              </div>
            </div>

            {gig.owner?.bio && (
              <p className="text-xs text-[#68746D] leading-relaxed mb-3 pb-3 border-b border-[#E3E9E4]">
                {gig.owner.bio}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-[#F8FAF8] p-2 rounded border border-[#E3E9E4]">
                <span className="block font-bold text-[#202923]">{gig.owner?.gigs_completed || 0}</span>
                <span className="text-[10px] text-[#68746D]">Completed</span>
              </div>
              <div className="bg-[#F8FAF8] p-2 rounded border border-[#E3E9E4]">
                <span className="block font-bold text-[#202923]">{gig.owner?.average_rating > 0 ? `${gig.owner.average_rating} ★` : '—'}</span>
                <span className="text-[10px] text-[#68746D]">Rating</span>
              </div>
            </div>

            <Link
              to={`/profile/${gig.owner?.id}`}
              className="mt-3 block text-center py-1.5 rounded-md border border-[#E3E9E4] hover:bg-[#F8FAF8] text-xs font-medium text-[#202923] transition-colors"
            >
              View Full Student Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {applyModalOpen && (
        <ApplicationModal
          gig={gig}
          onClose={() => setApplyModalOpen(false)}
          onSuccess={async () => {
            setApplyModalOpen(false);
            if (onShowToast) onShowToast("Application submitted successfully!", "success");
            await fetchGig();
          }}
        />
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <ReviewModal
          gig={gig}
          currentUser={currentUser}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={async () => {
            setReviewModalOpen(false);
            if (onShowToast) onShowToast("Review submitted successfully!", "success");
            await fetchGig();
            await refreshCurrentUser();
          }}
        />
      )}
    </div>
  );
}
