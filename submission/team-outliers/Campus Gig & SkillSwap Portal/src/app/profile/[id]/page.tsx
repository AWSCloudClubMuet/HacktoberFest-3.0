"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getUserById,
  getUserStats,
  getReviews,
  getGigs,
  getCurrentUser,
  setCurrentUserId,
  initializeStore,
} from "@/lib/api";
import { User, Review, Gig } from "@/types";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GigCard } from "@/components/gigs/gig-card";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = React.useState<User | undefined>(undefined);
  const [currentUser, setCurrentUser] = React.useState<User | undefined>(undefined);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [userGigs, setUserGigs] = React.useState<Gig[]>([]);

  const [loaded, setLoaded] = React.useState(false);

  const loadData = async () => {
    try { await initializeStore(); } catch (err) { console.error(err); }
    const foundUser = getUserById(userId);
    setUser(foundUser);
    setCurrentUser(getCurrentUser());

    if (foundUser) {
      // Reviews where this user is the reviewee
      const allReviews = getReviews();
      setReviews(allReviews.filter((r) => r.reviewee_id === foundUser.id));

      // Gigs posted by this user
      const gigs = getGigs({ userId: foundUser.id });
      setUserGigs(gigs);
    }
    setLoaded(true);
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener("user-changed", loadData);
    return () => window.removeEventListener("user-changed", loadData);
  }, [userId]);

  if (!loaded) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm font-semibold text-stone-500">Loading profile…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <h2 className="font-heading font-extrabold text-2xl text-stone-900">Student Not Found</h2>
        <p className="text-sm text-stone-500">
          The requested student profile could not be found.
        </p>
        <Link href="/gigs">
          <Button variant="outline">← Back to Gigs Explorer</Button>
        </Link>
      </div>
    );
  }

  const stats = getUserStats(user.id);
  const isMe = currentUser?.id === user.id;

  const handleSwitchToThisUser = () => {
    setCurrentUserId(user.id);
    setCurrentUser(user);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/gigs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          ← Back to Gigs Explorer
        </Link>
      </div>

      {/* Top Profile Bento Header */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar src={user.avatarUrl} fallback={user.name} size="xl" />
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-stone-900">
                  {user.name}
                </h1>
                {isMe && (
                  <Badge variant="warning" className="text-xs font-bold">
                    Active Persona
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold text-amber-800">
                {user.major} &bull; {user.semester}
              </p>
              <p className="text-xs text-stone-400">Campus Member since {user.createdAt || "Fall 2026"}</p>
            </div>
          </div>

          {!isMe && (
            <Button
              onClick={handleSwitchToThisUser}
              variant="outline"
              className="text-xs font-bold border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
            >
              ⇄ Switch Persona to {user.name}
            </Button>
          )}
        </div>

        {/* Bio */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-stone-400 mb-2">
            Student Bio & Overview
          </h3>
          <p className="text-sm sm:text-base text-stone-700 leading-relaxed max-w-3xl">{user.bio}</p>
        </div>

        {/* Verified Skills */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-stone-400 mb-3">
            Peer-Endorsed Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <span
                key={skill}
                className="text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200/70 px-3 py-1 rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Quantitative Reputation Stats Cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
              Average Peer Rating
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-amber-700">
                {stats.averageRating ? `★ ${stats.averageRating}` : "N/A"}
              </span>
              <span className="text-xs text-amber-900">
                ({stats.reviewCount} review{stats.reviewCount === 1 ? "" : "s"})
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 mt-1">Computed from completed gig reviews</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Gigs Posted
            </span>
            <p className="text-3xl font-extrabold text-stone-900 mt-1">{stats.gigsPosted}</p>
            <p className="text-[11px] text-stone-400 mt-1">Campus opportunities created</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
              Gigs Completed
            </span>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1">{stats.gigsCompleted}</p>
            <p className="text-[11px] text-emerald-800/80 mt-1">Finished as Owner or Applicant</p>
          </div>
        </div>
      </div>

      {/* Two Column Section: Left = Reviews Received, Right = Active Posted Gigs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Reviews (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <h2 className="font-heading font-extrabold text-xl text-stone-900">
              Peer Reviews & Testimonials ({reviews.length})
            </h2>
            {stats.averageRating && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                ★ {stats.averageRating} / 5.0
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 text-sm">
              No reviews received yet. Reviews are unlocked once gigs are successfully completed!
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => {
                const reviewer = getUserById(r.reviewer_id);
                return (
                  <div key={r.id} className="p-5 rounded-2xl border border-stone-200/80 bg-white shadow-xs">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        {reviewer && (
                          <Avatar
                            src={reviewer.avatarUrl}
                            fallback={reviewer.name}
                            size="sm"
                          />
                        )}
                        <div>
                          <p className="font-bold text-xs text-stone-900">{reviewer?.name || "Peer"}</p>
                          <p className="text-[10px] text-stone-400">{reviewer?.major}</p>
                        </div>
                      </div>

                      <div className="text-amber-500 text-xs font-bold">
                        {"★".repeat(r.rating)}
                        {"☆".repeat(5 - r.rating)}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic mt-2">
                      &ldquo;{r.comment}&rdquo;
                    </p>

                    {r.created_at && (
                      <p className="text-[10px] text-stone-400 mt-3 text-right">
                        {formatDate(r.created_at)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Posted Gigs by this student (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="pb-2 border-b border-stone-200">
            <h2 className="font-heading font-extrabold text-xl text-stone-900">
              Gigs by {user.name} ({userGigs.length})
            </h2>
          </div>

          {userGigs.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-stone-200 text-stone-500 text-sm">
              This student has not posted any gigs yet.
            </div>
          ) : (
            <div className="space-y-3">
              {userGigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
