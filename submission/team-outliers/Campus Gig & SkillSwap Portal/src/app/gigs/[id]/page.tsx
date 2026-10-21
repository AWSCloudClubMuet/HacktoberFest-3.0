"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getGigById,
  getUserById,
  getUserStats,
  getCurrentUser,
  getApplications,
  createApplication,
  acceptApplicant,
  rejectApplication,
  updateGig,
  getReviews,
  createReview,
  initializeStore,
} from "@/lib/api";
import { Gig, User, Application, Review } from "@/types";
import { formatDate, formatCurrency, isPastDeadline } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gigId = params?.id as string;

  const [gig, setGig] = React.useState<Gig | undefined>(undefined);
  const [poster, setPoster] = React.useState<User | undefined>(undefined);
  const [currentUser, setCurrentUser] = React.useState<User | undefined>(undefined);
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [reviews, setReviews] = React.useState<Review[]>([]);

  // Application form state
  const [applyMessage, setApplyMessage] = React.useState("");
  const [applyError, setApplyError] = React.useState("");
  const [applySuccess, setApplySuccess] = React.useState("");
  const [isApplying, setIsApplying] = React.useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [reviewError, setReviewError] = React.useState("");
  const [reviewSuccess, setReviewSuccess] = React.useState("");
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);

  // Feedback notifications
  const [actionMessage, setActionMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  const [loaded, setLoaded] = React.useState(false);

  const loadData = async () => {
    try { await initializeStore(); } catch (err) { console.error(err); }
    const current = getCurrentUser();
    setCurrentUser(current);

    const foundGig = getGigById(gigId);
    setGig(foundGig);

    if (foundGig) {
      setPoster(getUserById(foundGig.user_id));
      setApplications(getApplications(foundGig.id));
      setReviews(getReviews(foundGig.id));
    }
    setLoaded(true);
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener("user-changed", loadData);
    return () => window.removeEventListener("user-changed", loadData);
  }, [gigId]);

  if (!loaded) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm font-semibold text-stone-500">Loading gig…</div>;
  }

  if (!gig) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h2 className="font-heading font-extrabold text-2xl text-stone-900">Gig Not Found</h2>
        <p className="text-sm text-stone-500">
          The requested campus gig could not be found or may have been removed.
        </p>
        <Link href="/gigs">
          <Button variant="outline">← Back to All Gigs</Button>
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === gig.user_id;
  const isAcceptedApplicant = currentUser?.id === gig.accepted_applicant_id;
  const expired = gig.status === "Expired" || (gig.status === "Open" && isPastDeadline(gig.deadline));
  const hasApplied = applications.some((a) => a.applicant_id === currentUser?.id);
  const userApplication = applications.find((a) => a.applicant_id === currentUser?.id);
  const hasReviewed = reviews.some((r) => r.reviewer_id === currentUser?.id);

  // Handle Application Submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError("");
    setApplySuccess("");

    if (!currentUser) {
      setApplyError("Please select a student profile from the top bar to apply.");
      return;
    }

    if (!applyMessage.trim()) {
      setApplyError("Please include a brief message explaining your background or availability.");
      return;
    }

    try {
      setIsApplying(true);
      await createApplication({
        gig_id: gig.id,
        applicant_id: currentUser.id,
        message: applyMessage.trim(),
      });
      setApplySuccess("Your application has been submitted successfully to the gig owner!");
      setApplyMessage("");
      loadData();
    } catch (err: any) {
      setApplyError(err.message || "Failed to submit application");
    } finally {
      setIsApplying(false);
    }
  };

  // Handle Owner Accepting Applicant
  const handleAcceptApplicant = async (appId: string) => {
    if (!currentUser) return;
    try {
      await acceptApplicant(gig.id, appId, currentUser.id);
      setActionMessage({
        type: "success",
        text: "Applicant accepted! Gig status updated to 'In Progress', pending applications closed.",
      });
      loadData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  // Handle Owner Rejecting Applicant
  const handleRejectApplicant = async (appId: string) => {
    if (!currentUser) return;
    try {
      await rejectApplication(appId, currentUser.id);
      setActionMessage({
        type: "success",
        text: "Application rejected.",
      });
      loadData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  // Handle Owner Marking as Completed
  const handleCompleteGig = async () => {
    if (!currentUser || !isOwner) return;
    try {
      await updateGig(gig.id, { status: "Completed" }, currentUser.id);
      setActionMessage({
        type: "success",
        text: "Congratulations! Gig marked as Completed. Both parties can now leave mutual reviews.",
      });
      loadData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  // Handle Mutual Review Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    if (!currentUser) return;
    if (!reviewComment.trim()) {
      setReviewError("Please provide a written review comment describing the collaboration.");
      return;
    }

    try {
      setIsSubmittingReview(true);
      await createReview({
        gig_id: gig.id,
        reviewer_id: currentUser.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewSuccess("Your review has been recorded and updated the student's peer reputation score!");
      setReviewComment("");
      loadData();
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const posterStats = poster ? getUserStats(poster.id) : null;
  const acceptedUser = gig.accepted_applicant_id ? getUserById(gig.accepted_applicant_id) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/gigs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          ← Back to Gigs Explorer
        </Link>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs font-bold underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Bento Layout: Left = Gig Info + Actions, Right = Poster Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Gig Details Card */}
          <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    gig.category === "Programming"
                      ? "category-programming"
                      : gig.category === "Design"
                      ? "category-design"
                      : gig.category === "Writing"
                      ? "category-writing"
                      : "category-tutoring"
                  }
                  className="text-xs px-3 py-1 font-bold"
                >
                  {gig.category}
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold bg-stone-50 text-stone-700">
                  {gig.type} Service
                </Badge>
              </div>

              <Badge
                variant={
                  gig.status === "Open" && !expired
                    ? "success"
                    : gig.status === "In Progress"
                    ? "warning"
                    : gig.status === "Completed"
                    ? "info"
                    : "destructive"
                }
                className="text-xs px-3 py-1 uppercase tracking-wider font-extrabold"
              >
                {expired && gig.status === "Open" ? "Expired" : gig.status}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-stone-900 leading-tight">
              {gig.title}
            </h1>

            {/* Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50/80 border border-stone-200/70 text-xs sm:text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase text-stone-400">Compensation</p>
                <p className="font-bold text-stone-900 mt-0.5">
                  {gig.payment_type === "Paid"
                    ? `💰 ${formatCurrency(gig.budget)} USD`
                    : gig.payment_type === "SkillSwap"
                    ? "⇄ Skill Swap"
                    : "🎁 Free / Volunteer"}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase text-stone-400">Deadline</p>
                <p className="font-bold text-stone-900 mt-0.5">{formatDate(gig.deadline)}</p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-[11px] font-semibold uppercase text-stone-400">Posted On</p>
                <p className="font-bold text-stone-900 mt-0.5">{formatDate(gig.created_at)}</p>
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base text-stone-900">Description & Scope</h3>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line">
                {gig.description}
              </p>
            </div>

            {/* In Progress / Completed Banner */}
            {gig.status === "In Progress" && acceptedUser && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    Active Collaboration
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    Accepted Applicant: {acceptedUser.name} ({acceptedUser.major})
                  </p>
                </div>
                {isOwner && (
                  <Button
                    onClick={handleCompleteGig}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    ✓ Mark as Completed
                  </Button>
                )}
              </div>
            )}

            {gig.status === "Completed" && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Gig Completed</p>
                  <p className="text-sm font-semibold mt-0.5">
                    This collaboration has successfully concluded. Peer reviews are visible below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* APPLICATION SECTION (For Non-Owners) */}
          {!isOwner && (
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="font-heading font-extrabold text-xl text-stone-900">
                Apply for this Campus Gig
              </h3>

              {hasApplied ? (
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-500 uppercase">Your Application</span>
                    <Badge
                      variant={
                        userApplication?.status === "Accepted"
                          ? "success"
                          : userApplication?.status === "Rejected"
                          ? "destructive"
                          : "warning"
                      }
                      className="font-bold text-xs"
                    >
                      {userApplication?.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500">
                    Submitted on {userApplication && formatDate(userApplication.created_at)}
                  </p>
                  <p className="text-sm text-stone-800 italic bg-white p-3 rounded-lg border border-stone-100">
                    &ldquo;{userApplication?.message}&rdquo;
                  </p>
                  {userApplication?.status === "Accepted" && (
                    <p className="text-xs font-bold text-emerald-700 pt-1">
                      🎉 Congratulations! You were selected for this gig. Coordinate with {poster?.name} to
                      complete the task.
                    </p>
                  )}
                </div>
              ) : gig.status !== "Open" || expired ? (
                <div className="p-4 rounded-2xl bg-stone-100 text-stone-600 text-sm">
                  This gig is currently{" "}
                  <strong>{expired && gig.status === "Open" ? "Expired" : gig.status}</strong> and is no longer
                  accepting new student applications.
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Explain your relevant course background, tools you know, or portfolio links so {poster?.name}{" "}
                    can review your fit.
                  </p>

                  <Textarea
                    placeholder="E.g., Hi! I'm a CS sophomore with extensive experience in React and Tailwind. I've built similar campus portals and can deliver in 3 days..."
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    rows={4}
                    required
                  />

                  {applyError && <p className="text-xs font-semibold text-red-600">{applyError}</p>}
                  {applySuccess && (
                    <p className="text-xs font-semibold text-emerald-600">{applySuccess}</p>
                  )}

                  <Button type="submit" disabled={isApplying} className="w-full sm:w-auto font-bold">
                    {isApplying ? "Submitting..." : "Send Application →"}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* APPLICANT MANAGEMENT SECTION (For Gig Owner) */}
          {isOwner && (
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-xl text-stone-900">
                    Applicant Management
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    You posted this gig. Review submitted pitches and accept your preferred collaborator.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-bold">
                  {applications.length} Submissions
                </Badge>
              </div>

              {applications.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-stone-50 border border-stone-200/60 text-stone-500 text-sm">
                  No applications received yet. Fellow students will appear here once they apply.
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const applicant = getUserById(app.applicant_id);
                    const applicantStats = applicant ? getUserStats(applicant.id) : null;
                    return (
                      <div
                        key={app.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          app.status === "Accepted"
                            ? "border-emerald-300 bg-emerald-50/40"
                            : app.status === "Rejected"
                            ? "border-stone-200 bg-stone-50/50 opacity-70"
                            : "border-stone-200 bg-white hover:border-amber-200"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {applicant && (
                            <Link
                              href={`/profile/${applicant.id}`}
                              className="flex items-center gap-3 hover:opacity-80"
                            >
                              <Avatar
                                src={applicant.avatarUrl}
                                fallback={applicant.name}
                                size="md"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-stone-900">{applicant.name}</p>
                                  {applicantStats?.averageRating && (
                                    <span className="text-[11px] font-bold text-amber-600">
                                      ★ {applicantStats.averageRating}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-500">
                                  {applicant.major} • {applicant.semester}
                                </p>
                              </div>
                            </Link>
                          )}

                          <Badge
                            variant={
                              app.status === "Accepted"
                                ? "success"
                                : app.status === "Rejected"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-xs font-bold w-fit"
                          >
                            {app.status}
                          </Badge>
                        </div>

                        {/* Pitch Message */}
                        <div className="my-3 p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs sm:text-sm text-stone-700 leading-relaxed">
                          &ldquo;{app.message}&rdquo;
                        </div>

                        {/* Applicant Skills */}
                        {applicant && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {applicant.skills.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Acceptance / Rejection Buttons */}
                        {gig.status === "Open" && app.status === "Pending" && (
                          <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptApplicant(app.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                            >
                              ✓ Accept Applicant
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectApplicant(app.id)}
                              className="text-xs text-stone-600 hover:bg-stone-100"
                            >
                              ✕ Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MUTUAL REVIEWS SECTION */}
          {gig.status === "Completed" && (
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="font-heading font-extrabold text-xl text-stone-900">
                  Peer Reviews & Reputation
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verified mutual ratings recorded after this gig completed.
                </p>
              </div>

              {/* Review Submission Form if participant hasn't reviewed yet */}
              {(isOwner || isAcceptedApplicant) && !hasReviewed && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4"
                >
                  <h4 className="font-heading font-bold text-sm text-stone-900">
                    Leave a Review for {isOwner ? acceptedUser?.name : poster?.name}
                  </h4>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Rating (1 to 5 Stars):
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`text-2xl transition-transform hover:scale-110 ${
                            star <= reviewRating ? "text-amber-500" : "text-stone-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-700 ml-2">
                        {reviewRating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Review Comment:
                    </label>
                    <Textarea
                      placeholder="Describe what it was like collaborating with this student..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>

                  {reviewError && <p className="text-xs font-semibold text-red-600">{reviewError}</p>}
                  {reviewSuccess && (
                    <p className="text-xs font-semibold text-emerald-600">{reviewSuccess}</p>
                  )}

                  <Button type="submit" disabled={isSubmittingReview} className="font-bold text-xs">
                    {isSubmittingReview ? "Saving Review..." : "Submit Peer Review"}
                  </Button>
                </form>
              )}

              {/* Display existing reviews */}
              {reviews.length === 0 ? (
                <p className="text-xs text-stone-500 italic">No reviews recorded yet for this gig.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => {
                    const reviewer = getUserById(r.reviewer_id);
                    const reviewee = getUserById(r.reviewee_id);
                    return (
                      <div key={r.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500 text-sm font-bold">
                              {"★".repeat(r.rating)}
                              {"☆".repeat(5 - r.rating)}
                            </span>
                            <span className="text-xs font-bold text-stone-900">{reviewer?.name}</span>
                            <span className="text-xs text-stone-400">reviewed</span>
                            <span className="text-xs font-semibold text-stone-700">{reviewee?.name}</span>
                          </div>
                          {r.created_at && (
                            <span className="text-[10px] text-stone-400">{formatDate(r.created_at)}</span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Poster Profile Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {poster && (
            <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-5 sticky top-20">
              <div className="flex items-start gap-4">
                <Avatar src={poster.avatarUrl} fallback={poster.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-extrabold text-lg text-stone-900 truncate">
                    {poster.name}
                  </h3>
                  <p className="text-xs font-semibold text-amber-800">{poster.major}</p>
                  <p className="text-[11px] text-stone-400">{poster.semester}</p>
                </div>
              </div>

              {/* Bio */}
              <p className="text-xs text-stone-600 leading-relaxed">{poster.bio}</p>

              {/* Peer Stats */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
                <div>
                  <p className="text-base font-extrabold text-stone-900">{posterStats?.gigsPosted}</p>
                  <p className="text-[10px] text-stone-500">Posted</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-stone-900">{posterStats?.gigsCompleted}</p>
                  <p className="text-[10px] text-stone-500">Completed</p>
                </div>
                <div>
                  <p className="text-base font-extrabold text-amber-600">
                    {posterStats?.averageRating ? `★ ${posterStats.averageRating}` : "N/A"}
                  </p>
                  <p className="text-[10px] text-stone-500">Rating</p>
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <p className="text-xs font-bold text-stone-700 mb-2">Student Skills:</p>
                <div className="flex flex-wrap gap-1.5">
                  {poster.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-amber-50 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* View Full Profile link */}
              <Link href={`/profile/${poster.id}`} className="block pt-2">
                <Button variant="outline" className="w-full text-xs font-semibold">
                  View Full Profile & Reviews →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
