// Change this one line when the backend is deployed
export const API_URL = "http://localhost:4000";

// ---------- Current user (the fake login) ----------
export function getCurrentUserId() {
  return localStorage.getItem("userId");
}
export function setCurrentUserId(id) {
  localStorage.setItem("userId", String(id));
}

// ---------- Core request helper ----------
async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const userId = getCurrentUserId();
  if (userId) headers["x-user-id"] = userId; // sent on every request, harmless on public ones

  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Build a readable message from the server's error format
    const details = data?.details?.length ? "\n- " + data.details.join("\n- ") : "";
    throw new Error((data?.error || "Request failed") + details);
  }
  return data;
}

// ---------- Users ----------
export const getUsers = () => request("GET", "/users");
export const getUser = (id) => request("GET", `/users/${id}`);
export const createUser = (body) => request("POST", "/users", body);
export const updateUser = (id, body) => request("PATCH", `/users/${id}`, body);

// ---------- Gigs ----------
export function getGigs(filters = {}) {
  // Skip empty filters so "All" doesn't send category=
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== undefined && value !== null) params.set(key, value);
  }
  const qs = params.toString();
  return request("GET", "/gigs" + (qs ? `?${qs}` : ""));
}
export const getGig = (id) => request("GET", `/gigs/${id}`);
export const createGig = (body) => request("POST", "/gigs", body);
export const updateGigStatus = (id, status) => request("PATCH", `/gigs/${id}`, { status });
export const getGigApplications = (id) => request("GET", `/gigs/${id}/applications`);

// ---------- Applications ----------
export const getMyApplications = () => request("GET", "/applications");
export const applyToGig = (gig_id, message) => request("POST", "/applications", { gig_id, message });
export const decideApplication = (id, status) => request("PATCH", `/applications/${id}`, { status });

// ---------- Reviews ----------
export const getReviews = (filters = {}) => {
  const qs = new URLSearchParams(filters).toString();
  return request("GET", "/reviews" + (qs ? `?${qs}` : ""));
};
export const createReview = (gig_id, rating, comment) =>
  request("POST", "/reviews", { gig_id, rating, comment });