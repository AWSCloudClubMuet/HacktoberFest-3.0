// Campus Gig & SkillSwap Portal - Frontend API Client
// Handles clean REST requests to backend endpoints

const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${config.method || 'GET'} ${endpoint}:`, error.message);
      throw error;
    }
  },

  // Users
  getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users${query ? '?' + query : ''}`);
  },

  getUser(id) {
    return this.request(`/users/${id}`);
  },

  createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: userData
    });
  },

  updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PATCH',
      body: userData
    });
  },

  // Gigs
  getGigs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/gigs${query ? '?' + query : ''}`);
  },

  getGig(id) {
    return this.request(`/gigs/${id}`);
  },

  createGig(gigData) {
    return this.request('/gigs', {
      method: 'POST',
      body: gigData
    });
  },

  updateGig(id, gigData) {
    return this.request(`/gigs/${id}`, {
      method: 'PATCH',
      body: gigData
    });
  },

  // Applications
  getApplications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/applications${query ? '?' + query : ''}`);
  },

  createApplication(appData) {
    return this.request('/applications', {
      method: 'POST',
      body: appData
    });
  },

  updateApplication(id, appData) {
    return this.request(`/applications/${id}`, {
      method: 'PATCH',
      body: appData
    });
  },

  // Reviews
  getReviews(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reviews${query ? '?' + query : ''}`);
  },

  createReview(reviewData) {
    return this.request('/reviews', {
      method: 'POST',
      body: reviewData
    });
  },

  // Stats & Reset
  getStats() {
    return this.request('/stats');
  },

  resetDatabase() {
    return this.request('/stats/reset', {
      method: 'POST'
    });
  }
};
