"use client";

import * as React from "react";
import Link from "next/link";
import { getGigs, getCurrentUser, getApplications, initializeStore } from "@/lib/api";
import { Gig, User, GigStatus } from "@/types";
import { formatDate, formatCurrency, isPastDeadline } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";

export default function MyGigsPage() {
  const [currentUser, setCurrentUser] = React.useState<User | undefined>(undefined);
  const [myGigs, setMyGigs] = React.useState<Gig[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("All");

  const loadData = async () => {
    try { await initializeStore(); } catch (err) { console.error(err); }
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const gigs = getGigs({ userId: user.id });
      setMyGigs(gigs);
    }
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener("user-changed", loadData);
    return () => window.removeEventListener("user-changed", loadData);
  }, []);

  const filteredGigs = myGigs.filter((gig) => {
    if (activeTab === "All") return true;
    const expired = gig.status === "Expired" || (gig.status === "Open" && isPastDeadline(gig.deadline));
    const effectiveStatus = expired && gig.status === "Open" ? "Expired" : gig.status;
    return effectiveStatus === activeTab;
  });

  const tabItems = [
    { id: "All", label: "All My Gigs", badge: myGigs.length },
    {
      id: "Open",
      label: "Open",
      badge: myGigs.filter((g) => g.status === "Open" && !isPastDeadline(g.deadline)).length,
    },
    {
      id: "In Progress",
      label: "In Progress",
      badge: myGigs.filter((g) => g.status === "In Progress").length,
    },
    {
      id: "Completed",
      label: "Completed",
      badge: myGigs.filter((g) => g.status === "Completed").length,
    },
    {
      id: "Expired",
      label: "Expired",
      badge: myGigs.filter((g) => g.status === "Expired" || (g.status === "Open" && isPastDeadline(g.deadline))).length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-tight">
            My Posted Gigs
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Manage your offerings, review student applications, and finalize completed projects.
          </p>
        </div>

        <Link href="/gigs/post">
          <Button className="font-bold shadow-xs">+ Post a New Gig</Button>
        </Link>
      </div>

      {/* User Context Banner */}
      {currentUser && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900">
          <Avatar src={currentUser.avatarUrl} fallback={currentUser.name} size="sm" />
          <div>
            <span className="font-bold">{currentUser.name}</span> ({currentUser.major}) &bull; Viewing gigs
            you own and manage.
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* Gigs List */}
      {filteredGigs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-2xl">
            📋
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg text-stone-900">
              No gigs found in this status
            </h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
              You haven&apos;t posted any gigs under &ldquo;{activeTab}&rdquo; yet.
            </p>
          </div>
          <Link href="/gigs/post">
            <Button variant="outline" className="text-xs font-semibold">
              Create Your First Gig →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGigs.map((gig) => {
            const apps = getApplications(gig.id);
            const pendingApps = apps.filter((a) => a.status === "Pending");
            const expired = gig.status === "Expired" || (gig.status === "Open" && isPastDeadline(gig.deadline));
            const effectiveStatus = expired && gig.status === "Open" ? "Expired" : gig.status;

            return (
              <div
                key={gig.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-amber-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
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
                      className="text-xs"
                    >
                      {gig.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-stone-50">
                      {gig.type}
                    </Badge>
                    <Badge
                      variant={
                        effectiveStatus === "Open"
                          ? "success"
                          : effectiveStatus === "In Progress"
                          ? "warning"
                          : effectiveStatus === "Completed"
                          ? "info"
                          : "destructive"
                      }
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      {effectiveStatus}
                    </Badge>
                  </div>

                  <Link href={`/gigs/${gig.id}`}>
                    <h3 className="font-heading font-extrabold text-lg sm:text-xl text-stone-900 hover:text-amber-700 transition-colors">
                      {gig.title}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                    <span>
                      Compensation:{" "}
                      <strong className="text-stone-800">
                        {gig.payment_type === "Paid"
                          ? formatCurrency(gig.budget)
                          : gig.payment_type === "SkillSwap"
                          ? "Skill Swap"
                          : "Free / Volunteer"}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>Deadline: {formatDate(gig.deadline)}</span>
                    <span>•</span>
                    <span>Posted {formatDate(gig.created_at)}</span>
                  </div>
                </div>

                {/* Right Action Box */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                        pendingApps.length > 0
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {apps.length} Applicant{apps.length === 1 ? "" : "s"}
                      {pendingApps.length > 0 && ` (${pendingApps.length} pending)`}
                    </span>
                  </div>

                  <Link href={`/gigs/${gig.id}`}>
                    <Button
                      size="sm"
                      variant={pendingApps.length > 0 ? "default" : "outline"}
                      className="font-bold text-xs"
                    >
                      {pendingApps.length > 0 ? "Review Applicants →" : "View Details →"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
