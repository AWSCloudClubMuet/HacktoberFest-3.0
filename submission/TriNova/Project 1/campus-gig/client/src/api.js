const BASE = 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

const qs = (params) => {
  const clean = Object.fromEntries(
    Object.entries(params || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );
  const s = new URLSearchParams(clean).toString();
  return s ? '?' + s : '';
};

export const api = {
  // users
  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),

  // gigs
  getGigs: (filters) => request('/gigs' + qs(filters)),
  getGig: (id) => request(`/gigs/${id}`),
  createGig: (body) => request('/gigs', { method: 'POST', body: JSON.stringify(body) }),
  updateGig: (id, body) => request(`/gigs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // applications
  getApplications: (filters) => request('/applications' + qs(filters)),
  apply: (body) => request('/applications', { method: 'POST', body: JSON.stringify(body) }),
  updateApplication: (id, body) =>
    request(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // reviews
  getReviews: (filters) => request('/reviews' + qs(filters)),
  createReview: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
};
