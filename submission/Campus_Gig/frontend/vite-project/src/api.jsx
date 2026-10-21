const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USER_KEY = "campus_gig_user_id";

// ---------- "who is logged in" storage ----------
export function getStoredUserId() {
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export function setStoredUserId(id) {
  try {
    if (id === null || id === undefined) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, String(id));
  } catch {
    // storage blocked: ignore
  }
}

// ---------- errors ----------
export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}, generalErrors = []) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // { title: "..." }
    this.generalErrors = generalErrors; // errors not tied to one field
  }
}

function parseError(data, status) {
  const fieldErrors = {};
  const generalErrors = [];

  if (data && typeof data.detail === "string") {
    generalErrors.push(data.detail);
  } else if (data && Array.isArray(data.detail)) {
    for (const item of data.detail) {
      const msg = String(item.msg || "Invalid value").replace(
        /^Value error, /,
        "",
      );
      // loc looks like ["body", "title"]; a whole-model error is just ["body"]
      const field =
        Array.isArray(item.loc) && item.loc.length > 1
          ? String(item.loc[1])
          : null;
      if (field) {
        if (!fieldErrors[field]) fieldErrors[field] = msg;
      } else {
        generalErrors.push(msg);
      }
    }
  } else {
    generalErrors.push(`Request failed (status ${status})`);
  }

  const message = [
    ...generalErrors,
    ...Object.entries(fieldErrors).map(([field, msg]) => `${field}: ${msg}`),
  ].join(" | ");

  return new ApiError(message, status, fieldErrors, generalErrors);
}

// ---------- core request ----------
async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const userId = getStoredUserId();
  if (userId) headers["X-User-Id"] = String(userId);

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Cannot reach the backend. Make sure FastAPI is running and check its terminal for errors (a crashed request also shows this message).",
      0,
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // response had no JSON body
  }

  if (!res.ok) throw parseError(data, res.status);
  return data;
}

function toQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      qs.append(key, value);
  });
  const text = qs.toString();
  return text ? `?${text}` : "";
}

// ---------- all endpoints ----------
export const api = {
  // users
  listUsers: () => request("/users"),
  createUser: (data) => request("/users", { method: "POST", body: data }),
  getMe: () => request("/users/me"),
  getUser: (id) => request(`/users/${id}`),
  updateUser: (id, data) =>
    request(`/users/${id}`, { method: "PUT", body: data }),

  // gigs
  listGigs: (params = {}) => request(`/gigs${toQuery(params)}`),
  getGig: (id) => request(`/gigs/${id}`),
  createGig: (data) => request("/gigs", { method: "POST", body: data }),
  gigApplications: (id) => request(`/gigs/${id}/applications`), // NEW (owner only)
  updateGigStatus: (id, status) =>
    request(`/gigs/${id}`, { method: "PATCH", body: { status } }), // NEW (owner only)

  // reviews (Milestone 4)
  createReview: (data) => request("/reviews", { method: "POST", body: data }),
  gigReviews: (gigId) => request(`/reviews/gig/${gigId}`),
  userReviews: (userId) => request(`/reviews/user/${userId}`),

  // applications
  createApplication: (data) =>
    request("/applications", { method: "POST", body: data }),
  myApplications: () => request("/applications/mine"),
  updateApplication: (id, status) =>
    request(`/applications/${id}`, { method: "PATCH", body: { status } }), // NEW (owner only)
};
