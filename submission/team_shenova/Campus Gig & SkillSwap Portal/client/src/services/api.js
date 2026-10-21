// client/src/services/api.js
// Client API Client for Campus Gig & SkillSwap Portal

const API_BASE = '/api';

async function fetchJson(endpoint, options = {}, actingUserId = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (actingUserId) {
    headers['x-user-id'] = actingUserId;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data && data.error ? data.error : (typeof data === 'string' ? data : `HTTP Error ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Health
  checkHealth: () => fetchJson('/health'),

  // Users
  getUsers: () => fetchJson('/users'),
  getUser: (id) => fetchJson(`/users/${id}`),
  createUser: (userData) => fetchJson('/users', { method: 'POST', body: userData }),
  updateUser: (id, updates, actingUserId) => fetchJson(`/users/${id}`, { method: 'PATCH', body: updates }, actingUserId),

  // Gigs
  getGigs: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        params.append(key, val);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/gigs${query}`);
  },
  getGig: (id) => fetchJson(`/gigs/${id}`),
  createGig: (gigData, actingUserId) => fetchJson('/gigs', { method: 'POST', body: gigData }, actingUserId),
  updateGig: (id, updates, actingUserId) => fetchJson(`/gigs/${id}`, { method: 'PATCH', body: updates }, actingUserId),
  deleteGig: (id, actingUserId) => fetchJson(`/gigs/${id}`, { method: 'DELETE' }, actingUserId),

  // Applications
  getApplications: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/applications${query}`);
  },
  createApplication: (appData, actingUserId) => fetchJson('/applications', { method: 'POST', body: appData }, actingUserId),
  updateApplication: (id, updateData, actingUserId) => fetchJson(`/applications/${id}`, { method: 'PATCH', body: updateData }, actingUserId),

  // Reviews
  getReviews: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchJson(`/reviews${query}`);
  },
  createReview: (reviewData, actingUserId) => fetchJson('/reviews', { method: 'POST', body: reviewData }, actingUserId),

  // Seed Reset
  resetSeedData: () => fetchJson('/seed/reset', { method: 'POST' })
};

export default api;
