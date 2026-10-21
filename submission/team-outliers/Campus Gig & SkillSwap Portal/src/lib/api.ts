/**
 * Client-side API layer. All data lives behind the mock REST API (/api/*);
 * this module fetches it, keeps a small cache so components can read synchronously,
 * and sends every mutation through fetch(). Only the "active demo user" is local.
 */
import { User, Gig, Application, Review, UserStats } from "@/types";
import { GigFilterOptions, filterGigs, withExpiry, computeUserStats } from "./shared";

export type { GigFilterOptions } from "./shared";

const STORAGE_KEY_CURRENT_USER = "campus_portal_current_user_id";
const DEFAULT_USER_ID = "usr_1";

let cache: { users: User[]; gigs: Gig[]; applications: Application[]; reviews: Review[] } = {
  users: [], gigs: [], applications: [], reviews: [],
};
let started = 0;
let applied = 0;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", headers: { "Content-Type": "application/json" }, ...init });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body as T;
}
const send = <T,>(method: string, url: string, payload: unknown) => request<T>(url, { method, body: JSON.stringify(payload) });

/** Pull the latest users/gigs/applications/reviews from the API into the cache. */
export async function initializeStore(): Promise<void> {
  const seq = ++started;
  const [users, gigs, applications, reviews] = await Promise.all([
    request<{ data: User[] }>("/api/users"),
    request<{ data: Gig[] }>("/api/gigs"),
    request<{ data: Application[] }>("/api/applications"),
    request<{ data: Review[] }>("/api/reviews"),
  ]);
  if (seq < applied) return; // a newer refresh already landed; don't overwrite with older data
  applied = seq;
  cache = { users: users.data, gigs: gigs.data, applications: applications.data, reviews: reviews.data };
}

// ---------- Mock auth: which demo student is active ----------
export function getCurrentUserId(): string {
  if (typeof window === "undefined") return DEFAULT_USER_ID;
  return localStorage.getItem(STORAGE_KEY_CURRENT_USER) || DEFAULT_USER_ID;
}
export function setCurrentUserId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_CURRENT_USER, userId);
  window.dispatchEvent(new Event("user-changed"));
}
export function getCurrentUser(): User | undefined {
  return getUsers().find((u) => u.id === getCurrentUserId()) || getUsers()[0];
}

// ---------- Reads (served from the freshly fetched cache) ----------
export const getUsers = (): User[] => cache.users;
export const getUserById = (id: string): User | undefined => cache.users.find((u) => u.id === id);
export const getUserStats = (userId: string): UserStats => computeUserStats(withExpiry(cache.gigs), cache.reviews, userId);

export function getGigs(options?: GigFilterOptions): Gig[] {
  return filterGigs(withExpiry(cache.gigs), options);
}
export const getGigById = (id: string): Gig | undefined => getGigs().find((g) => g.id === id);

export function getApplications(gigId?: string, applicantId?: string): Application[] {
  return cache.applications.filter((a) => (!gigId || a.gig_id === gigId) && (!applicantId || a.applicant_id === applicantId));
}
export function getReviews(gigId?: string, userId?: string): Review[] {
  return cache.reviews.filter((r) => (!gigId || r.gig_id === gigId) && (!userId || r.reviewee_id === userId || r.reviewer_id === userId));
}

/** Milestone 2 search/filter, executed by the API: GET /api/gigs?category=&type=&payment_type=&status=&q=&min_budget=&max_budget= */
export async function fetchGigs(o: GigFilterOptions = {}): Promise<Gig[]> {
  const p = new URLSearchParams();
  if (o.category && o.category !== "All") p.set("category", o.category);
  if (o.type && o.type !== "All") p.set("type", o.type);
  if (o.payment_type && o.payment_type !== "All") p.set("payment_type", o.payment_type);
  if (o.status && o.status !== "All") p.set("status", o.status);
  if (o.search?.trim()) p.set("q", o.search.trim());
  if (o.minBudget !== undefined) p.set("min_budget", String(o.minBudget));
  if (o.maxBudget !== undefined) p.set("max_budget", String(o.maxBudget));
  if (o.userId) p.set("user_id", o.userId);
  return (await request<{ data: Gig[] }>(`/api/gigs?${p}`)).data;
}

// ---------- Mutations (all go through the API, then refresh the cache) ----------
export async function createGig(data: Omit<Gig, "id" | "status" | "accepted_applicant_id" | "created_at">): Promise<Gig> {
  const gig = await send<Gig>("POST", "/api/gigs", data);
  await initializeStore();
  return gig;
}
export async function updateGig(id: string, updates: Partial<Gig>, ownerId: string): Promise<Gig> {
  const gig = await send<Gig>("PATCH", `/api/gigs/${id}`, { ...updates, owner_id: ownerId });
  await initializeStore();
  return gig;
}
export async function createApplication(data: { gig_id: string; applicant_id: string; message: string }): Promise<Application> {
  const app = await send<Application>("POST", "/api/applications", data);
  await initializeStore();
  return app;
}
export async function acceptApplicant(gigId: string, applicationId: string, ownerId: string): Promise<{ gig: Gig; application: Application }> {
  const result = await send<{ gig: Gig; application: Application }>("PATCH", `/api/applications/${applicationId}`, { action: "accept", gig_id: gigId, owner_id: ownerId });
  await initializeStore();
  return result;
}
export async function rejectApplication(applicationId: string, ownerId: string): Promise<Application> {
  const result = await send<{ application: Application }>("PATCH", `/api/applications/${applicationId}`, { action: "reject", owner_id: ownerId });
  await initializeStore();
  return result.application;
}
export async function createReview(data: { gig_id: string; reviewer_id: string; rating: number; comment: string }): Promise<Review> {
  const review = await send<Review>("POST", "/api/reviews", data);
  await initializeStore();
  return review;
}
export async function resetStore(): Promise<void> {
  await send("POST", "/api/reset", {});
  await initializeStore();
}
