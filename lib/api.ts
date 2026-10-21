// Thin client for the PERN backend (Express + PostgreSQL).
// The Next app rewrites /api/* to the Express server (see next.config.mjs).

export type User = {
  id: number
  name: string
  email: string | null
  major: string
  semester: number
  bio: string
  skills: string[]
  gigs_posted: number
  gigs_completed: number
  average_rating: number | null
  review_count: number
}

export type Gig = {
  id: number
  user_id: number
  title: string
  description: string
  type: 'Offering' | 'Requesting'
  category: string
  payment_type: 'Paid' | 'SkillSwap' | 'Free'
  budget: number | null
  deadline: string
  status: string
  display_status: string
  accepted_applicant_id: number | null
  created_at: string
  owner_name: string
  owner_major: string
  applications_count?: number
}

export type Application = {
  id: number
  gig_id: number
  applicant_id: number
  message: string
  status: 'Pending' | 'Accepted' | 'Rejected'
  created_at: string
  gig_title: string
  gig_status: string
  gig_owner_id: number
  applicant_name: string
  applicant_major: string
}

export type Review = {
  id: number
  gig_id: number
  reviewer_id: number
  reviewee_id: number
  rating: number
  comment: string
  created_at: string
  reviewer_name: string
  gig_title: string
}

export type Stats = { open_gigs: number; active_students: number; avg_rating: string | null; review_count: number }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
  return data as T
}

export const api = {
  me: () => request<{ user: { name: string; email: string }; profile: User | null }>('/api/me'),
  createProfile: (body: Record<string, unknown>) => request<User>('/api/profile', { method: 'POST', body: JSON.stringify(body) }),
  users: () => request<User[]>('/api/users'),
  user: (id: number) => request<User & { reviews_received: Review[] }>(`/api/users/${id}`),
  stats: () => request<Stats>('/api/stats'),
  gigs: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    return request<Gig[]>(`/api/gigs${qs ? `?${qs}` : ''}`)
  },
  applications: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
    return request<Application[]>(`/api/applications${qs ? `?${qs}` : ''}`)
  },
  reviews: () => request<Review[]>('/api/reviews'),
  createGig: (body: Record<string, unknown>) => request<Gig>('/api/gigs', { method: 'POST', body: JSON.stringify(body) }),
  apply: (body: Record<string, unknown>) => request<Application>('/api/applications', { method: 'POST', body: JSON.stringify(body) }),
  reviewApplication: (id: number, user_id: number, status: 'Accepted' | 'Rejected') =>
    request<Application>(`/api/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ user_id, status }) }),
  setGigStatus: (id: number, user_id: number, status: string) =>
    request<Gig>(`/api/gigs/${id}`, { method: 'PATCH', body: JSON.stringify({ user_id, status }) }),
  createReview: (body: Record<string, unknown>) => request<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(body) }),
}
