import { Gig, Review, GigCategory, GigType, PaymentType, GigStatus, UserStats } from "@/types";

export interface GigFilterOptions {
  category?: GigCategory | "All";
  type?: GigType | "All";
  payment_type?: PaymentType | "All";
  status?: GigStatus | "All";
  search?: string;
  minBudget?: number;
  maxBudget?: number;
  userId?: string;
}

/**
 * A deadline is "passed" once its moment is behind us. Date-only deadlines
 * (stored as midnight UTC by the post form) stay valid through the end of that day.
 */
export function isDeadlinePassed(deadline: string, now: number = Date.now()): boolean {
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) return false;
  const isMidnightUtc = t % 86_400_000 === 0;
  return (isMidnightUtc ? t + 86_400_000 - 1 : t) < now;
}

/** Milestone 2: Open gigs past their deadline appear as Expired. */
export function withExpiry(gigs: Gig[]): Gig[] {
  const now = Date.now();
  return gigs.map((g) => (g.status === "Open" && isDeadlinePassed(g.deadline, now) ? { ...g, status: "Expired" as const } : g));
}

export function filterGigs(gigs: Gig[], o: GigFilterOptions = {}): Gig[] {
  const q = o.search?.toLowerCase().trim();
  return gigs.filter((g) => {
    if (o.category && o.category !== "All" && g.category !== o.category) return false;
    if (o.type && o.type !== "All" && g.type !== o.type) return false;
    if (o.payment_type && o.payment_type !== "All" && g.payment_type !== o.payment_type) return false;
    if (o.status && o.status !== "All" && g.status !== o.status) return false;
    if (o.userId && g.user_id !== o.userId) return false;
    if (o.minBudget !== undefined && (g.budget === null || g.budget < o.minBudget)) return false;
    if (o.maxBudget !== undefined && (g.budget === null || g.budget > o.maxBudget)) return false;
    if (q && !g.title.toLowerCase().includes(q) && !g.description.toLowerCase().includes(q)) return false;
    return true;
  });
}

/** Milestone 4: reputation is always derived from stored reviews. */
export function computeUserStats(gigs: Gig[], reviews: Review[], userId: string): UserStats {
  const mine = reviews.filter((r) => r.reviewee_id === userId);
  return {
    gigsPosted: gigs.filter((g) => g.user_id === userId).length,
    gigsCompleted: gigs.filter((g) => g.status === "Completed" && (g.user_id === userId || g.accepted_applicant_id === userId)).length,
    reviewCount: mine.length,
    averageRating: mine.length ? Number((mine.reduce((s, r) => s + r.rating, 0) / mine.length).toFixed(1)) : null,
  };
}
