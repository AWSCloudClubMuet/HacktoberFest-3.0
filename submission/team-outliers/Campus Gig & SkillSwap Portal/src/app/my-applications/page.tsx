"use client";

import * as React from "react";
import Link from "next/link";
import { getApplications, getCurrentUser, getGigById, getUserById, initializeStore } from "@/lib/api";
import { Application, Gig, User, ApplicationStatus } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";

export default function MyApplicationsPage() {
  const [currentUser, setCurrentUser] = React.useState<User | undefined>(undefined);
  const [myApplications, setMyApplications] = React.useState<Application[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("All");

  const loadData = async () => {
    try { await initializeStore(); } catch (err) { console.error(err); }
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const apps = getApplications(undefined, user.id);
      setMyApplications(apps);
    }
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener("user-changed", loadData);
    return () => window.removeEventListener("user-changed", loadData);
  }, []);

  const filteredApps = myApplications.filter((app) => {
    if (activeTab === "All") return true;
    return app.status === activeTab;
  });

  const tabItems = [
    { id: "All", label: "All Applications", badge: myApplications.length },
    {
      id: "Pending",
      label: "Pending",
      badge: myApplications.filter((a) => a.status === "Pending").length,
    },
    {
      id: "Accepted",
      label: "Accepted",
      badge: myApplications.filter((a) => a.status === "Accepted").length,
    },
    {
      id: "Rejected",
      label: "Declined",
      badge: myApplications.filter((a) => a.status === "Rejected").length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-tight">
            My Submitted Applications
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Track responses to gigs you have applied for and monitor selection statuses.
          </p>
        </div>

        <Link href="/gigs">
          <Button variant="outline" className="font-bold shadow-xs">
            Browse More Opportunities →
          </Button>
        </Link>
      </div>

      {/* User Context Banner */}
      {currentUser && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900">
          <Avatar src={currentUser.avatarUrl} fallback={currentUser.name} size="sm" />
          <div>
            <span className="font-bold">{currentUser.name}</span> ({currentUser.major}) &bull; Viewing
            pitches and applications you sent to campus peers.
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-2xl">
            📬
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-lg text-stone-900">
              No applications in &ldquo;{activeTab}&rdquo;
            </h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
              Explore the campus marketplace and submit a short pitch to start collaborating!
            </p>
          </div>
          <Link href="/gigs">
            <Button className="text-xs font-semibold">Explore Campus Gigs →</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const gig = getGigById(app.gig_id);
            const owner = gig ? getUserById(gig.user_id) : null;

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-amber-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {gig && (
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
                    )}
                    <Badge
                      variant={
                        app.status === "Accepted"
                          ? "success"
                          : app.status === "Rejected"
                          ? "destructive"
                          : "warning"
                      }
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Application {app.status}
                    </Badge>
                  </div>

                  {gig ? (
                    <Link href={`/gigs/${gig.id}`}>
                      <h3 className="font-heading font-extrabold text-lg sm:text-xl text-stone-900 hover:text-amber-700 transition-colors">
                        {gig.title}
                      </h3>
                    </Link>
                  ) : (
                    <p className="font-bold text-stone-700">Archived Gig</p>
                  )}

                  {/* Pitch message snippet */}
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-700 leading-relaxed italic">
                    &ldquo;{app.message}&rdquo;
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                    {owner && (
                      <span className="flex items-center gap-1 font-semibold text-stone-700">
                        Posted by {owner.name} ({owner.major})
                      </span>
                    )}
                    <span>•</span>
                    <span>Applied on {formatDate(app.created_at)}</span>
                    {gig && (
                      <>
                        <span>•</span>
                        <span>
                          Compensation:{" "}
                          <strong>
                            {gig.payment_type === "Paid"
                              ? formatCurrency(gig.budget)
                              : gig.payment_type === "SkillSwap"
                              ? "Skill Swap"
                              : "Free"}
                          </strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action Box */}
                <div className="pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 flex items-center gap-3">
                  {gig && (
                    <Link href={`/gigs/${gig.id}`}>
                      <Button
                        size="sm"
                        variant={app.status === "Accepted" ? "default" : "outline"}
                        className="font-bold text-xs"
                      >
                        {app.status === "Accepted" ? "View Gig & Chat →" : "View Details →"}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
