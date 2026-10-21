// ReliefHub API Client using Fetch API and VITE_API_URL

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.error) {
          errorMsg = errorJson.error;
        }
      } catch (e) {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }
    return await response.json();
  } catch (err) {
    console.error(`API Call failed [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // CAMPS
  async getCamps(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/camps${query ? `?${query}` : ''}`);
  },
  async createCamp(campData) {
    return request('/camps', {
      method: 'POST',
      body: JSON.stringify(campData)
    });
  },
  async updateCamp(id, patch) {
    return request(`/camps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteCamp(id) {
    return request(`/camps/${id}`, {
      method: 'DELETE'
    });
  },

  // INVENTORY
  async getInventory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/inventory${query ? `?${query}` : ''}`);
  },
  async createInventoryItem(itemData) {
    return request('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  },
  async updateInventoryItem(id, patch) {
    return request(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteInventoryItem(id) {
    return request(`/inventory/${id}`, {
      method: 'DELETE'
    });
  },

  // NEEDS
  async getNeeds(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/needs${query ? `?${query}` : ''}`);
  },
  async createNeed(needData) {
    return request('/needs', {
      method: 'POST',
      body: JSON.stringify(needData)
    });
  },
  async updateNeed(id, patch) {
    return request(`/needs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteNeed(id) {
    return request(`/needs/${id}`, {
      method: 'DELETE'
    });
  },

  // DISPATCHES
  async getDispatches(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/dispatches${query ? `?${query}` : ''}`);
  },
  async createDispatch(dispatchData) {
    return request('/dispatches', {
      method: 'POST',
      body: JSON.stringify(dispatchData)
    });
  },
  async updateDispatch(id, patch) {
    return request(`/dispatches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteDispatch(id) {
    return request(`/dispatches/${id}`, {
      method: 'DELETE'
    });
  },

  // DONATIONS
  async getDonations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/donations${query ? `?${query}` : ''}`);
  },
  async createDonation(donationData) {
    return request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData)
    });
  },
  async updateDonation(id, patch) {
    return request(`/donations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteDonation(id) {
    return request(`/donations/${id}`, {
      method: 'DELETE'
    });
  },

  // VOLUNTEERS
  async getVolunteers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/volunteers${query ? `?${query}` : ''}`);
  },
  async createVolunteer(volunteerData) {
    return request('/volunteers', {
      method: 'POST',
      body: JSON.stringify(volunteerData)
    });
  },
  async updateVolunteer(id, patch) {
    return request(`/volunteers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  },
  async deleteVolunteer(id) {
    return request(`/volunteers/${id}`, {
      method: 'DELETE'
    });
  }
};
