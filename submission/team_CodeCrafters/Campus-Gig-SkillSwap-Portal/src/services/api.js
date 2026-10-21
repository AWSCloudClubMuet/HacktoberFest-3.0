// CampusLoop API Client Service
// Bridges React Frontend components with the persistent Express/SQLite backend

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let activeUserId = 'usr_1';

export function setApiActiveUser(userId) {
  activeUserId = userId;
}

export function getApiActiveUser() {
  return activeUserId;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': activeUserId,
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = (data && data.error)
        ? (Array.isArray(data.errors) ? `${data.error}: ${data.errors.join(', ')}` : data.error)
        : `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Users & Profiles
  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  updateProfile: (id, data) => request(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  // Gigs
  getGigs: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        params.append(key, val);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/gigs${qs}`);
  },
  getGig: (id) => request(`/gigs/${id}`),
  createGig: (gigData) => request('/gigs', {
    method: 'POST',
    body: JSON.stringify(gigData)
  }),
  updateGig: (id, data) => request(`/gigs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteGig: (id) => request(`/gigs/${id}`, {
    method: 'DELETE'
  }),

  // Applications
  getApplications: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/applications${qs}`);
  },
  submitApplication: ({ gig_id, message }) => request('/applications', {
    method: 'POST',
    body: JSON.stringify({ gig_id, message })
  }),
  acceptApplication: (id) => request(`/applications/${id}/accept`, {
    method: 'PATCH'
  }),
  rejectApplication: (id) => request(`/applications/${id}/reject`, {
    method: 'PATCH'
  }),

  // Reviews
  getReviews: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/reviews${qs}`);
  },
  submitReview: (reviewData) => request('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  }),

  // Conversations & Messaging
  getConversations: () => request('/conversations'),
  sendMessage: (convId, text) => request(`/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text })
  }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markAllNotificationsRead: () => request('/notifications/read-all', {
    method: 'PATCH'
  }),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, {
    method: 'PATCH'
  }),

  // Bookmarks
  getBookmarks: () => request('/bookmarks'),
  toggleBookmark: (gigId) => request(`/bookmarks/${gigId}`, {
    method: 'POST'
  }),

  // Platform Stats
  getStats: () => request('/stats'),

  // AI Campus Assistant
  queryAiAssistant: (query) => request('/ai/query', {
    method: 'POST',
    body: JSON.stringify({ query })
  })
};
