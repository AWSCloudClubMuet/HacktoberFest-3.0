import { Application, Gig, Review } from "@/types";
import { GigFilterOptions } from "@/lib/api";

type Collection<T> = { data: T[]; total: number };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? String(payload.error)
      : "Request failed";
    throw new Error(message);
  }
  return payload as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "All") search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export const clientApi = {
  async getGigs(filters: GigFilterOptions = {}): Promise<Gig[]> {
    const data = await request<Collection<Gig>>(`/api/gigs${query({
      category: filters.category, type: filters.type, payment_type: filters.payment_type,
      status: filters.status, search: filters.search, minBudget: filters.minBudget,
      maxBudget: filters.maxBudget, userId: filters.userId,
    })}`);
    return data.data;
  },
  getGig: (id: string) => request<Gig>(`/api/gigs/${id}`),
  createGig: (gig: Omit<Gig, "id" | "status" | "accepted_applicant_id" | "created_at">) =>
    request<Gig>("/api/gigs", { method: "POST", body: JSON.stringify(gig) }),
  updateGig: (id: string, ownerId: string, updates: Pick<Partial<Gig>, "status">) =>
    request<Gig>(`/api/gigs/${id}`, { method: "PATCH", body: JSON.stringify({ ...updates, owner_id: ownerId }) }),
  async getApplications(gigId?: string, applicantId?: string): Promise<Application[]> {
    const data = await request<Collection<Application>>(`/api/applications${query({ gig_id: gigId, applicant_id: applicantId })}`);
    return data.data;
  },
  createApplication: (data: Pick<Application, "gig_id" | "applicant_id" | "message">) =>
    request<Application>("/api/applications", { method: "POST", body: JSON.stringify(data) }),
  updateApplication: (id: string, action: "accept" | "reject", ownerId: string, gigId?: string) =>
    request(`/api/applications/${id}`, { method: "PATCH", body: JSON.stringify({ action, owner_id: ownerId, gig_id: gigId }) }),
  async getReviews(gigId?: string, userId?: string): Promise<Review[]> {
    const data = await request<Collection<Review>>(`/api/reviews${query({ gig_id: gigId, user_id: userId })}`);
    return data.data;
  },
  createReview: (data: Pick<Review, "gig_id" | "reviewer_id" | "rating" | "comment">) =>
    request<Review>("/api/reviews", { method: "POST", body: JSON.stringify(data) }),
};
