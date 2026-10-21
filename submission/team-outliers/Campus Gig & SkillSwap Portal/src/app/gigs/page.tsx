"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getGigs, initializeStore } from "@/lib/api";
import { Gig, GigCategory, GigType, PaymentType, GigStatus } from "@/types";
import { GigCard } from "@/components/gigs/gig-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function GigsContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams?.get("category") as GigCategory) || "All";

  const [gigs, setGigs] = React.useState<Gig[]>([]);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<GigCategory | "All">(initialCategory);
  const [type, setType] = React.useState<GigType | "All">("All");
  const [paymentType, setPaymentType] = React.useState<PaymentType | "All">("All");
  const [status, setStatus] = React.useState<GigStatus | "All">("All");
  const [minBudget, setMinBudget] = React.useState<string>("");
  const [maxBudget, setMaxBudget] = React.useState<string>("");

  function refreshGigs() {
    const filtered = getGigs({
      category: category === "All" ? undefined : category,
      type: type === "All" ? undefined : type,
      payment_type: paymentType === "All" ? undefined : paymentType,
      status: status === "All" ? undefined : status,
      search: search,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
    });
    setGigs(filtered);
  }

  React.useEffect(() => {
    initializeStore();
    refreshGigs();
  }, [category, type, paymentType, status, search, minBudget, maxBudget]);

  const handleResetFilters = () => {
    setSearch("");
    setCategory("All");
    setType("All");
    setPaymentType("All");
    setStatus("All");
    setMinBudget("");
    setMaxBudget("");
  };

  const hasActiveFilters =
    search !== "" ||
    category !== "All" ||
    type !== "All" ||
    paymentType !== "All" ||
    status !== "All" ||
    minBudget !== "" ||
    maxBudget !== "";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-stone-900 tracking-tight">
            Browse Campus Gigs
          </h1>
          <p className="text-sm sm:text-base text-stone-600 mt-1">
            Discover student skills or request help for programming, design, writing, and tutoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
            Showing <strong className="text-stone-900">{gigs.length}</strong> gigs
          </span>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs h-9 border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar Bento Bar */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-4">
        {/* Search Bar + Quick Category Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Keyword Search Input */}
          <div className="lg:col-span-5 relative">
            <Input
              type="text"
              placeholder="Search by keywords (e.g. Next.js, Poster, Calculus, Proofreading)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 text-sm bg-stone-50/50"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-2">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as GigCategory | "All")}
              className="h-11 bg-stone-50/50 text-xs font-semibold"
            >
              <option value="All">All Categories</option>
              <option value="Programming">💻 Programming</option>
              <option value="Design">🎨 Design</option>
              <option value="Writing">✍️ Writing</option>
              <option value="Tutoring">📚 Tutoring</option>
            </Select>
          </div>

          {/* Type Dropdown (Offering / Requesting) */}
          <div className="lg:col-span-2">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as GigType | "All")}
              className="h-11 bg-stone-50/50 text-xs font-semibold"
            >
              <option value="All">All Types</option>
              <option value="Offering">Offering Service</option>
              <option value="Requesting">Requesting Help</option>
            </Select>
          </div>

          {/* Payment Type */}
          <div className="lg:col-span-2">
            <Select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType | "All")}
              className="h-11 bg-stone-50/50 text-xs font-semibold"
            >
              <option value="All">All Compensation</option>
              <option value="Paid">💰 Paid Gigs</option>
              <option value="SkillSwap">⇄ Skill Swap</option>
              <option value="Free">🎁 Free / Volunteer</option>
            </Select>
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-1">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as GigStatus | "All")}
              className="h-11 bg-stone-50/50 text-xs font-semibold"
            >
              <option value="All">Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Expired">Expired</option>
            </Select>
          </div>
        </div>

        {/* Budget Filter & Quick Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-stone-500">Quick Filters:</span>
            <button
              onClick={() => {
                setPaymentType("SkillSwap");
                setType("All");
              }}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                paymentType === "SkillSwap"
                  ? "bg-amber-100 border-amber-300 text-amber-900 font-bold"
                  : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
              }`}
            >
              ⇄ Skill Swaps Only
            </button>

            <button
              onClick={() => {
                setStatus("Open");
                setType("Offering");
              }}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                status === "Open" && type === "Offering"
                  ? "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold"
                  : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
              }`}
            >
              🟢 Open Services Offered
            </button>

            <button
              onClick={() => {
                setStatus("Open");
                setType("Requesting");
              }}
              className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                status === "Open" && type === "Requesting"
                  ? "bg-blue-100 border-blue-300 text-blue-900 font-bold"
                  : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
              }`}
            >
              🙋 Active Requests for Help
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="minBudgetInput" className="font-semibold text-stone-500 whitespace-nowrap">
              Budget ($):
            </label>
            <input
              id="minBudgetInput"
              aria-label="Minimum budget"
              type="number"
              min="0"
              placeholder="Min"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="h-8 w-16 rounded-md border border-stone-300 px-2 text-xs text-stone-900 bg-white"
            />
            <span className="text-stone-400">–</span>
            <input
              id="maxBudgetInput"
              aria-label="Maximum budget"
              type="number"
              min="0"
              placeholder="Max"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="h-8 w-20 rounded-md border border-stone-300 px-2 text-xs text-stone-900 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Gigs Grid */}
      {gigs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-700">
            🔍
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-xl text-stone-900">
              No matching gigs found
            </h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-1">
              Try adjusting your search keywords, clearing your filters, or check back later as students
              post new campus gigs.
            </p>
          </div>
          <Button onClick={handleResetFilters} variant="outline" className="font-semibold text-xs">
            Clear All Active Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {gigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrowseGigsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-stone-500">
          Loading campus gigs...
        </div>
      }
    >
      <GigsContent />
    </Suspense>
  );
}
