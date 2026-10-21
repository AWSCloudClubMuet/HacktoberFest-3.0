// CampusLoop Dual-Mode API Client Service
// Intelligently bridges React components with Express/SQLite backend when available,
// or seamless persistent Client Storage Engine on static hosting (Vercel / Netlify).

import { clientStore } from './clientStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let activeUserId = 'usr_1';

// Detect if we should default to client storage directly
let fallbackMode = (typeof window !== 'undefined') &&
  !import.meta.env.VITE_API_URL &&
  (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('netlify.app'));

export function setApiActiveUser(userId) {
  activeUserId = userId;
}

export function getApiActiveUser() {
  return activeUserId;
}

export function isUsingClientStorage() {
  return fallbackMode;
}

async function request(endpoint, options = {}, fallbackFn = null) {
  if (fallbackMode && fallbackFn) {
    return await fallbackFn();
  }

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

    // Detect static SPA rewrite or HTTP 405 Method Not Allowed on static CDN
    if (res.status === 405 || (!isJson && contentType.includes('text/html'))) {
      if (fallbackFn) {
        console.info(`[CampusLoop API] Static host detected on ${endpoint} (${res.status}). Switching to persistent LocalStorage store.`);
        fallbackMode = true;
        return await fallbackFn();
      }
    }

    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      // If server returned 404 and static HTML, fallback
      if (res.status === 404 && typeof data === 'string' && data.includes('<!DOCTYPE html>') && fallbackFn) {
        fallbackMode = true;
        return await fallbackFn();
      }

      const errorMsg = (data && data.error)
        ? (Array.isArray(data.errors) ? `${data.error}: ${data.errors.join(', ')}` : data.error)
        : `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    // If network error (e.g. backend server not started locally or offline)
    if (fallbackFn && (err.name === 'TypeError' || err.message.includes('fetch') || err.message.includes('NetworkError'))) {
      console.info(`[CampusLoop API] Backend offline for ${endpoint}. Using persistent client storage.`);
      fallbackMode = true;
      return await fallbackFn();
    }
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Users & Profiles
  getUsers: () => request('/users', {}, () => clientStore.getUsers()),
  getUser: (id) => request(`/users/${id}`, {}, () => clientStore.getUser(id)),
  updateProfile: (id, data) => request(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }, () => clientStore.updateProfile(id, data, activeUserId)),

  // Gigs
  getGigs: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        params.append(key, val);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/gigs${qs}`, {}, () => clientStore.getGigs(filters));
  },
  getGig: (id) => request(`/gigs/${id}`, {}, () => clientStore.getGig(id)),
  createGig: (gigData) => request('/gigs', {
    method: 'POST',
    body: JSON.stringify(gigData)
  }, () => clientStore.createGig(gigData, activeUserId)),
  updateGig: (id, data) => request(`/gigs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }, () => clientStore.updateGig(id, data, activeUserId)),
  deleteGig: (id) => request(`/gigs/${id}`, {
    method: 'DELETE'
  }, () => clientStore.deleteGig(id, activeUserId)),

  // Applications
  getApplications: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/applications${qs}`, {}, () => clientStore.getApplications(filters));
  },
  submitApplication: ({ gig_id, message }) => request('/applications', {
    method: 'POST',
    body: JSON.stringify({ gig_id, message })
  }, () => clientStore.submitApplication({ gig_id, message }, activeUserId)),
  acceptApplication: (id) => request(`/applications/${id}/accept`, {
    method: 'PATCH'
  }, () => clientStore.acceptApplication(id, activeUserId)),
  rejectApplication: (id) => request(`/applications/${id}/reject`, {
    method: 'PATCH'
  }, () => clientStore.rejectApplication(id, activeUserId)),

  // Reviews
  getReviews: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/reviews${qs}`, {}, () => clientStore.getReviews(filters));
  },
  submitReview: (reviewData) => request('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData)
  }, () => clientStore.submitReview(reviewData, activeUserId)),

  // Conversations & Messaging
  getConversations: () => request('/conversations', {}, () => clientStore.getConversations(activeUserId)),
  sendMessage: (convId, text) => request(`/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text })
  }, () => clientStore.sendMessage(convId, text, activeUserId)),

  // Notifications
  getNotifications: () => request('/notifications', {}, () => clientStore.getNotifications(activeUserId)),
  markAllNotificationsRead: () => request('/notifications/read-all', {
    method: 'PATCH'
  }, () => clientStore.markAllNotificationsRead(activeUserId)),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, {
    method: 'PATCH'
  }, () => clientStore.markNotificationRead(id)),

  // Bookmarks
  getBookmarks: () => request('/bookmarks', {}, () => clientStore.getBookmarks(activeUserId)),
  toggleBookmark: (gigId) => request(`/bookmarks/${gigId}`, {
    method: 'POST'
  }, () => clientStore.toggleBookmark(gigId, activeUserId)),

  // Platform Stats
  getStats: () => request('/stats', {}, () => clientStore.getStats()),

  // AI Campus Assistant
  queryAiAssistant: (query) => request('/ai/query', {
    method: 'POST',
    body: JSON.stringify({ query })
  }, () => clientStore.queryAiAssistant(query))
};
