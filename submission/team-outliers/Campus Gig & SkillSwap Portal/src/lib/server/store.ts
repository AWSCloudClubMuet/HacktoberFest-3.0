import fs from "node:fs";
import path from "node:path";
import { User, Gig, Application, Review, GigCategory, GigType, PaymentType } from "@/types";
import { SEED_USERS, SEED_GIGS, SEED_APPLICATIONS, SEED_REVIEWS } from "../mockData";
import { GigFilterOptions, filterGigs, isDeadlinePassed, computeUserStats } from "../shared";

/** Error carrying the HTTP status the route handler should answer with. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

interface DB { users: User[]; gigs: Gig[]; applications: Application[]; reviews: Review[] }

const CATEGORIES: GigCategory[] = ["Programming", "Design", "Writing", "Tutoring"];
const TYPES: GigType[] = ["Offering", "Requesting"];
const PAYMENTS: PaymentType[] = ["Paid", "SkillSwap", "Free"];
const DB_FILE = path.join(process.cwd(), ".data", "db.json");

const g = globalThis as unknown as { __campusDb?: DB };
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const seed = (): DB => clone({ users: SEED_USERS, gigs: SEED_GIGS, applications: SEED_APPLICATIONS, reviews: SEED_REVIEWS });
const newId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function db(): DB {
  if (!g.__campusDb) {
    let loaded: DB | null = null;
    try {
      if (fs.existsSync(DB_FILE)) loaded = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch { /* fall back to seed */ }
    g.__campusDb = loaded ?? seed();
  }
  const d = g.__campusDb;
  // Milestone 2: Open gigs past their deadline become Expired.
  const now = Date.now();
  for (const gig of d.gigs) if (gig.status === "Open" && isDeadlinePassed(gig.deadline, now)) gig.status = "Expired";
  return d;
}

function persist(): void {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(g.__campusDb));
  } catch { /* read-only filesystem (e.g. serverless): in-memory only */ }
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const requireUser = (d: DB, id: unknown, label = "User") => {
  if (typeof id !== "string" || !d.users.some((u) => u.id === id)) throw new ApiError(400, `${label} does not exist.`);
};

// ---------- Users ----------
export const listUsers = () => clone(db().users);
export function getUser(id: string) {
  const d = db();
  const user = d.users.find((u) => u.id === id);
  if (!user) throw new ApiError(404, "User not found");
  return { ...clone(user), stats: computeUserStats(d.gigs, d.reviews, id) };
}

// ---------- Gigs ----------
export function listGigs(o: GigFilterOptions) {
  const out = filterGigs(db().gigs, o);
  return clone(out.sort((a, b) => b.created_at.localeCompare(a.created_at)));
}
export function getGig(id: string): Gig {
  const gig = db().gigs.find((x) => x.id === id);
  if (!gig) throw new ApiError(404, "Gig not found");
  return clone(gig);
}

export function createGig(b: Record<string, any>): Gig {
  const d = db();
  const title = text(b.title), description = text(b.description);
  if (title.length < 5 || title.length > 100) throw new ApiError(400, "Gig title must be 5–100 characters.");
  if (description.length < 20) throw new ApiError(400, "Gig description must be at least 20 characters long.");
  if (!CATEGORIES.includes(b.category)) throw new ApiError(400, `Category must be one of: ${CATEGORIES.join(", ")}.`);
  if (!TYPES.includes(b.type)) throw new ApiError(400, "Type must be Offering or Requesting.");
  if (!PAYMENTS.includes(b.payment_type)) throw new ApiError(400, "Payment type must be Paid, SkillSwap or Free.");
  requireUser(d, b.user_id, "Gig owner");
  let budget: number | null = null;
  if (b.payment_type === "Paid") {
    budget = Number(b.budget);
    if (b.budget === null || b.budget === undefined || b.budget === "" || !Number.isFinite(budget) || budget <= 0)
      throw new ApiError(400, "Paid gigs require a positive budget.");
  } else if (b.budget !== null && b.budget !== undefined && b.budget !== "") {
    throw new ApiError(400, "Only paid gigs can have a budget.");
  }
  if (typeof b.deadline !== "string" || Number.isNaN(new Date(b.deadline).getTime()) || isDeadlinePassed(b.deadline))
    throw new ApiError(400, "Gig deadline must be a valid future date.");

  const gig: Gig = {
    id: newId("gig"), user_id: b.user_id, title, description, type: b.type, category: b.category,
    payment_type: b.payment_type, budget, deadline: new Date(b.deadline).toISOString(),
    status: "Open", accepted_applicant_id: null, created_at: new Date().toISOString(),
  };
  d.gigs.unshift(gig);
  persist();
  return clone(gig);
}

/** PATCH /gigs/:id — owner-only, status transitions only (Open → In Progress → Completed). */
export function patchGig(id: string, b: Record<string, any>): Gig {
  const d = db();
  const gig = d.gigs.find((x) => x.id === id);
  if (!gig) throw new ApiError(404, "Gig not found");
  if (!b.owner_id) throw new ApiError(403, "owner_id is required to change a gig.");
  if (gig.user_id !== b.owner_id) throw new ApiError(403, "Only the gig owner can change this gig.");
  const extra = Object.keys(b).filter((k) => !["owner_id", "status"].includes(k));
  if (extra.length) throw new ApiError(400, `Only the gig status can be changed (unexpected: ${extra.join(", ")}).`);

  if (b.status === "Completed") {
    if (gig.status !== "In Progress") throw new ApiError(409, `A gig can only be completed from In Progress (currently ${gig.status}).`);
    gig.status = "Completed";
  } else if (b.status === "In Progress") {
    if (gig.status !== "Open") throw new ApiError(409, `Only an Open gig can move to In Progress (currently ${gig.status}).`);
    throw new ApiError(409, "Accept an applicant to move this gig to In Progress.");
  } else {
    throw new ApiError(400, "Status can only move Open → In Progress → Completed.");
  }
  persist();
  return clone(gig);
}

// ---------- Applications ----------
export function listApplications(gigId?: string, applicantId?: string) {
  return clone(db().applications.filter((a) => (!gigId || a.gig_id === gigId) && (!applicantId || a.applicant_id === applicantId)));
}

export function createApplication(b: Record<string, any>): Application {
  const d = db();
  const message = text(b.message);
  requireUser(d, b.applicant_id, "Applicant");
  if (!message) throw new ApiError(400, "Please include a short message with your application.");
  if (message.length > 500) throw new ApiError(400, "Application message must be 500 characters or fewer.");
  const gig = d.gigs.find((x) => x.id === b.gig_id);
  if (!gig) throw new ApiError(404, "Gig does not exist.");
  if (gig.user_id === b.applicant_id) throw new ApiError(403, "You cannot apply to your own gig.");
  if (d.applications.some((a) => a.gig_id === gig.id && a.applicant_id === b.applicant_id))
    throw new ApiError(409, "You have already submitted an application to this gig.");
  if (gig.status !== "Open") throw new ApiError(409, `This gig is ${gig.status} and not accepting applications.`);

  const app: Application = { id: newId("app"), gig_id: gig.id, applicant_id: b.applicant_id, message, status: "Pending", created_at: new Date().toISOString() };
  d.applications.unshift(app);
  persist();
  return clone(app);
}

/** PATCH /applications/:id — body: { action: "accept" | "reject", owner_id } (or status: "Accepted" | "Rejected"). */
export function patchApplication(id: string, b: Record<string, any>) {
  const d = db();
  const app = d.applications.find((a) => a.id === id);
  if (!app) throw new ApiError(404, "Application not found");
  const gig = d.gigs.find((x) => x.id === app.gig_id);
  if (!gig) throw new ApiError(404, "Gig not found");
  if (!b.owner_id) throw new ApiError(403, "owner_id is required.");
  if (gig.user_id !== b.owner_id) throw new ApiError(403, "Only the gig owner can review applications.");

  const action = b.action ?? (b.status === "Accepted" ? "accept" : b.status === "Rejected" ? "reject" : undefined);
  if (action !== "accept" && action !== "reject") throw new ApiError(400, "Invalid action. Use 'accept' or 'reject'.");
  if (gig.status !== "Open") throw new ApiError(409, `Applications can only be reviewed while the gig is Open (currently ${gig.status}).`);
  if (app.status !== "Pending") throw new ApiError(409, `This application is already ${app.status}.`);

  if (action === "reject") {
    app.status = "Rejected";
  } else {
    // Milestone 3 cascade: accept one, reject remaining Pending, gig → In Progress (closed to new applications).
    for (const other of d.applications) if (other.gig_id === gig.id && other.id !== app.id && other.status === "Pending") other.status = "Rejected";
    app.status = "Accepted";
    gig.status = "In Progress";
    gig.accepted_applicant_id = app.applicant_id;
  }
  persist();
  return clone({ gig, application: app });
}

// ---------- Reviews ----------
export function listReviews(gigId?: string, userId?: string) {
  return clone(db().reviews.filter((r) => (!gigId || r.gig_id === gigId) && (!userId || r.reviewee_id === userId || r.reviewer_id === userId)));
}

export function createReview(b: Record<string, any>): Review {
  const d = db();
  const gig = d.gigs.find((x) => x.id === b.gig_id);
  if (!gig) throw new ApiError(404, "Gig not found");
  requireUser(d, b.reviewer_id, "Reviewer");
  if (gig.status !== "Completed") throw new ApiError(409, "Reviews can only be submitted after a gig is Completed.");
  const isOwner = gig.user_id === b.reviewer_id;
  const isApplicant = !!gig.accepted_applicant_id && gig.accepted_applicant_id === b.reviewer_id;
  if (!isOwner && !isApplicant) throw new ApiError(403, "Only the gig owner or accepted applicant can review this gig.");
  if (!gig.accepted_applicant_id) throw new ApiError(409, "This gig has no accepted applicant to review.");
  if (d.reviews.some((r) => r.gig_id === gig.id && r.reviewer_id === b.reviewer_id)) throw new ApiError(409, "You have already submitted a review for this gig.");
  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, "Rating must be a whole number from 1 to 5.");
  const comment = text(b.comment);
  if (!comment) throw new ApiError(400, "Please leave a comment with your review.");
  if (comment.length > 600) throw new ApiError(400, "Comment must be 600 characters or fewer.");

  const review: Review = {
    id: newId("rev"), gig_id: gig.id, reviewer_id: b.reviewer_id,
    reviewee_id: isOwner ? gig.accepted_applicant_id : gig.user_id,
    rating, comment, created_at: new Date().toISOString(),
  };
  d.reviews.unshift(review);
  persist();
  return clone(review);
}

export function resetDb(): void {
  g.__campusDb = seed();
  persist();
}
