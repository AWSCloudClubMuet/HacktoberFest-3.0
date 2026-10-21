import { User, Gig, Application, Review, UserStats, GigCategory, GigType, PaymentType, GigStatus } from "@/types";
import { SEED_USERS, SEED_GIGS, SEED_APPLICATIONS, SEED_REVIEWS } from "./mockData";

// In-memory / localStorage store for the mock backend
const STORAGE_KEY_USERS = "campus_portal_users";
const STORAGE_KEY_GIGS = "campus_portal_gigs";
const STORAGE_KEY_APPS = "campus_portal_applications";
const STORAGE_KEY_REVIEWS = "campus_portal_reviews";
const STORAGE_KEY_CURRENT_USER = "campus_portal_current_user_id";

// Initialize state
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

let inMemoryUsers: User[] = [...SEED_USERS];
let inMemoryGigs: Gig[] = [...SEED_GIGS];
let inMemoryApplications: Application[] = [...SEED_APPLICATIONS];
let inMemoryReviews: Review[] = [...SEED_REVIEWS];
let currentUserId: string = "usr_1"; // Default to Aiden Vance

function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save to localStorage", err);
  }
}

// Auto-check expired gigs on load
function normalizeGigStatuses(gigs: Gig[]): Gig[] {
  const now = new Date().getTime();
  return gigs.map((gig) => {
    if (gig.status === "Open" && new Date(gig.deadline).getTime() < now) {
      return { ...gig, status: "Expired" };
    }
    return gig;
  });
}

export function initializeStore(): void {
  if (isBrowser()) {
    const storedUsers = loadFromStorage<User[]>(STORAGE_KEY_USERS, SEED_USERS);
    const storedGigs = loadFromStorage<Gig[]>(STORAGE_KEY_GIGS, SEED_GIGS);
    const storedApps = loadFromStorage<Application[]>(STORAGE_KEY_APPS, SEED_APPLICATIONS);
    const storedRevs = loadFromStorage<Review[]>(STORAGE_KEY_REVIEWS, SEED_REVIEWS);
    const storedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT_USER);

    inMemoryUsers = storedUsers;
    inMemoryGigs = normalizeGigStatuses(storedGigs);
    inMemoryApplications = storedApps;
    inMemoryReviews = storedRevs;
    if (storedCurrent) {
      currentUserId = storedCurrent;
    }
    saveToStorage(STORAGE_KEY_GIGS, inMemoryGigs);
  }
}

// Current User Switcher support
export function getCurrentUserId(): string {
  if (isBrowser()) {
    return localStorage.getItem(STORAGE_KEY_CURRENT_USER) || currentUserId;
  }
  return currentUserId;
}

export function setCurrentUserId(userId: string): void {
  currentUserId = userId;
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, userId);
    window.dispatchEvent(new Event("user-changed"));
  }
}

export function getCurrentUser(): User | undefined {
  const uid = getCurrentUserId();
  return getUsers().find((u) => u.id === uid) || inMemoryUsers[0];
}

// Users API
export function getUsers(): User[] {
  if (isBrowser()) {
    return loadFromStorage<User[]>(STORAGE_KEY_USERS, inMemoryUsers);
  }
  return inMemoryUsers;
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

// Reputation / Stats computation
export function getUserStats(userId: string): UserStats {
  const gigs = getGigs();
  const reviews = getReviews();

  const gigsPosted = gigs.filter((g) => g.user_id === userId).length;
  // Gig is completed if user is the owner or accepted applicant
  const gigsCompleted = gigs.filter(
    (g) => g.status === "Completed" && (g.user_id === userId || g.accepted_applicant_id === userId)
  ).length;

  // Reviews where this user is reviewee
  const userReviews = reviews.filter((r) => r.reviewee_id === userId);
  const reviewCount = userReviews.length;
  const averageRating =
    reviewCount > 0
      ? Number((userReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : null;

  return {
    gigsPosted,
    gigsCompleted,
    averageRating,
    reviewCount,
  };
}

// Gigs API
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

export function getGigs(options?: GigFilterOptions): Gig[] {
  let gigs = isBrowser()
    ? loadFromStorage<Gig[]>(STORAGE_KEY_GIGS, inMemoryGigs)
    : inMemoryGigs;

  gigs = normalizeGigStatuses(gigs);

  if (!options) return gigs;

  return gigs.filter((gig) => {
    if (options.category && options.category !== "All" && gig.category !== options.category) {
      return false;
    }
    if (options.type && options.type !== "All" && gig.type !== options.type) {
      return false;
    }
    if (options.payment_type && options.payment_type !== "All" && gig.payment_type !== options.payment_type) {
      return false;
    }
    if (options.status && options.status !== "All" && gig.status !== options.status) {
      return false;
    }
    if (options.userId && gig.user_id !== options.userId) {
      return false;
    }
    if (options.minBudget !== undefined && (gig.budget === null || gig.budget < options.minBudget)) return false;
    if (options.maxBudget !== undefined && (gig.budget === null || gig.budget > options.maxBudget)) return false;
    if (options.search && options.search.trim() !== "") {
      const q = options.search.toLowerCase().trim();
      const titleMatch = gig.title.toLowerCase().includes(q);
      const descMatch = gig.description.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }
    return true;
  });
}

export function getGigById(id: string): Gig | undefined {
  const gigs = getGigs();
  return gigs.find((g) => g.id === id);
}

export function createGig(gigData: Omit<Gig, "id" | "status" | "accepted_applicant_id" | "created_at">): Gig {
  if (!gigData.title.trim() || gigData.title.trim().length < 5) {
    throw new Error("Gig title must be at least 5 characters long.");
  }
  if (!gigData.description.trim() || gigData.description.trim().length < 20) {
    throw new Error("Gig description must be at least 20 characters long.");
  }
  if (!getUserById(gigData.user_id)) {
    throw new Error("Gig owner does not exist.");
  }
  if (gigData.payment_type === "Paid" && (!gigData.budget || gigData.budget <= 0)) {
    throw new Error("Paid gigs require a positive budget.");
  }
  if (gigData.payment_type !== "Paid" && gigData.budget !== null) {
    throw new Error("Only paid gigs can have a budget.");
  }
  if (Number.isNaN(new Date(gigData.deadline).getTime()) || new Date(gigData.deadline).getTime() <= Date.now()) {
    throw new Error("Gig deadline must be a future date.");
  }
  const allGigs = getGigs();
  const newGig: Gig = {
    ...gigData,
    id: `gig_${Date.now()}`,
    status: "Open",
    accepted_applicant_id: null,
    created_at: new Date().toISOString(),
  };

  const updated = [newGig, ...allGigs];
  inMemoryGigs = updated;
  saveToStorage(STORAGE_KEY_GIGS, updated);
  return newGig;
}

export function updateGig(id: string, updates: Partial<Gig>, ownerId?: string): Gig {
  const allGigs = getGigs();
  const index = allGigs.findIndex((g) => g.id === id);
  if (index === -1) {
    throw new Error(`Gig with id ${id} not found`);
  }

  const existing = allGigs[index];

  if (ownerId && existing.user_id !== ownerId) {
    throw new Error("Only the gig owner can update this gig.");
  }

  // Validation: Status flow rules
  if (updates.status && updates.status === "Completed" && existing.status !== "In Progress") {
    throw new Error("Gig can only be marked as Completed from In Progress state");
  }
  if (updates.status && !["In Progress", "Completed"].includes(updates.status)) {
    throw new Error("Gig status can only move from Open to In Progress, then to Completed.");
  }

  const updatedGig: Gig = { ...existing, ...updates };
  allGigs[index] = updatedGig;
  inMemoryGigs = allGigs;
  saveToStorage(STORAGE_KEY_GIGS, allGigs);
  return updatedGig;
}

// Applications API
export function getApplications(gigId?: string, applicantId?: string): Application[] {
  let apps = isBrowser()
    ? loadFromStorage<Application[]>(STORAGE_KEY_APPS, inMemoryApplications)
    : inMemoryApplications;

  if (gigId) {
    apps = apps.filter((a) => a.gig_id === gigId);
  }
  if (applicantId) {
    apps = apps.filter((a) => a.applicant_id === applicantId);
  }
  return apps;
}

export function createApplication(data: { gig_id: string; applicant_id: string; message: string }): Application {
  const gig = getGigById(data.gig_id);
  if (!gig) throw new Error("Gig does not exist");

  // Rule: Cannot apply to user's own gig
  if (gig.user_id === data.applicant_id) {
    throw new Error("You cannot apply to your own gig.");
  }

  // Rule: Cannot apply to closed/expired/completed/in-progress gigs
  if (gig.status !== "Open") {
    throw new Error(`This gig is currently ${gig.status} and not accepting applications.`);
  }

  // Rule: Duplicate application check
  const allApps = getApplications();
  const existingApp = allApps.find((a) => a.gig_id === data.gig_id && a.applicant_id === data.applicant_id);
  if (existingApp) {
    throw new Error("You have already submitted an application to this gig.");
  }

  const newApp: Application = {
    id: `app_${Date.now()}`,
    gig_id: data.gig_id,
    applicant_id: data.applicant_id,
    message: data.message,
    status: "Pending",
    created_at: new Date().toISOString(),
  };

  const updated = [newApp, ...allApps];
  inMemoryApplications = updated;
  saveToStorage(STORAGE_KEY_APPS, updated);
  return newApp;
}

// Milestone 3: Applicant Selection & Status
export function acceptApplicant(gigId: string, applicationId: string, ownerId: string): { gig: Gig; application: Application } {
  const gig = getGigById(gigId);
  if (!gig) throw new Error("Gig not found");

  // Rule: Only gig owners may accept applicants
  if (gig.user_id !== ownerId) {
    throw new Error("Only the gig owner can accept an applicant.");
  }

  if (gig.status !== "Open") {
    throw new Error("Can only accept applicants when gig is in Open status.");
  }

  const allApps = getApplications();
  const targetAppIndex = allApps.findIndex((a) => a.id === applicationId && a.gig_id === gigId);
  if (targetAppIndex === -1) {
    throw new Error("Application not found for this gig");
  }

  const acceptedApplicantId = allApps[targetAppIndex].applicant_id;

  // Rule: Acceptance automatically changes gig to In Progress, rejects remaining Pending apps, and closes it to new apps
  const updatedApps = allApps.map((app) => {
    if (app.gig_id === gigId) {
      if (app.id === applicationId) {
        return { ...app, status: "Accepted" as const };
      } else if (app.status === "Pending") {
        return { ...app, status: "Rejected" as const };
      }
    }
    return app;
  });

  inMemoryApplications = updatedApps;
  saveToStorage(STORAGE_KEY_APPS, updatedApps);

  const updatedGig = updateGig(gigId, {
    status: "In Progress",
    accepted_applicant_id: acceptedApplicantId,
  }, ownerId);

  return {
    gig: updatedGig,
    application: updatedApps[targetAppIndex],
  };
}

export function rejectApplication(applicationId: string, ownerId: string): Application {
  const allApps = getApplications();
  const index = allApps.findIndex((a) => a.id === applicationId);
  if (index === -1) throw new Error("Application not found");

  const app = allApps[index];
  const gig = getGigById(app.gig_id);
  if (!gig) throw new Error("Gig not found");

  if (gig.user_id !== ownerId) {
    throw new Error("Only the gig owner can reject an application");
  }

  const updatedApp: Application = { ...app, status: "Rejected" };
  allApps[index] = updatedApp;
  inMemoryApplications = allApps;
  saveToStorage(STORAGE_KEY_APPS, allApps);
  return updatedApp;
}

// Milestone 4: Mutual Reviews & Reputation
export function getReviews(gigId?: string, userId?: string): Review[] {
  let reviews = isBrowser()
    ? loadFromStorage<Review[]>(STORAGE_KEY_REVIEWS, inMemoryReviews)
    : inMemoryReviews;

  if (gigId) {
    reviews = reviews.filter((r) => r.gig_id === gigId);
  }
  if (userId) {
    reviews = reviews.filter((r) => r.reviewee_id === userId || r.reviewer_id === userId);
  }
  return reviews;
}

export function createReview(data: { gig_id: string; reviewer_id: string; rating: number; comment: string }): Review {
  const gig = getGigById(data.gig_id);
  if (!gig) throw new Error("Gig not found");

  // Rule: After completion only
  if (gig.status !== "Completed") {
    throw new Error("Reviews can only be submitted after a gig is Completed.");
  }

  // Rule: Only the owner and accepted applicant can review each other
  const isOwner = gig.user_id === data.reviewer_id;
  const isApplicant = gig.accepted_applicant_id === data.reviewer_id;

  if (!isOwner && !isApplicant) {
    throw new Error("Only the gig owner or accepted applicant can review this gig.");
  }

  const reviewee_id = isOwner ? gig.accepted_applicant_id! : gig.user_id;

  // Rule: Allow only one review per reviewer for that gig
  const allReviews = getReviews();
  const alreadyReviewed = allReviews.some(
    (r) => r.gig_id === data.gig_id && r.reviewer_id === data.reviewer_id
  );
  if (alreadyReviewed) {
    throw new Error("You have already submitted a review for this gig.");
  }

  // Rating 1-5 validation
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    gig_id: data.gig_id,
    reviewer_id: data.reviewer_id,
    reviewee_id: reviewee_id,
    rating: data.rating,
    comment: data.comment,
    created_at: new Date().toISOString(),
  };

  const updated = [newReview, ...allReviews];
  inMemoryReviews = updated;
  saveToStorage(STORAGE_KEY_REVIEWS, updated);
  return newReview;
}

// Reset store to defaults if needed
export function resetStore(): void {
  inMemoryUsers = [...SEED_USERS];
  inMemoryGigs = [...SEED_GIGS];
  inMemoryApplications = [...SEED_APPLICATIONS];
  inMemoryReviews = [...SEED_REVIEWS];
  if (isBrowser()) {
    localStorage.removeItem(STORAGE_KEY_USERS);
    localStorage.removeItem(STORAGE_KEY_GIGS);
    localStorage.removeItem(STORAGE_KEY_APPS);
    localStorage.removeItem(STORAGE_KEY_REVIEWS);
    initializeStore();
  }
}
