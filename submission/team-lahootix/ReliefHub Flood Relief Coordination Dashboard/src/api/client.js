const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API Error ${res.status}: ${errBody || res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Request to ${url} failed:`, err);
    throw err;
  }
}

export const campsApi = {
  getAll: (params = '') => request(`/camps${params ? `?${params}` : ''}`),
  getById: (id) => request(`/camps/${id}`),
  create: (data) => request('/camps', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/camps/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/camps/${id}`, { method: 'DELETE' })
};

export const inventoryApi = {
  getAll: (params = '') => request(`/inventory${params ? `?${params}` : ''}`),
  getById: (id) => request(`/inventory/${id}`),
  create: (data) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/inventory/${id}`, { method: 'DELETE' })
};

export const needsApi = {
  getAll: (params = '') => request(`/needs${params ? `?${params}` : ''}`),
  getById: (id) => request(`/needs/${id}`),
  getByCampId: (campId) => request(`/needs?camp_id=${campId}`),
  create: (data) => request('/needs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/needs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/needs/${id}`, { method: 'DELETE' })
};

export const dispatchesApi = {
  getAll: (params = '') => request(`/dispatches${params ? `?${params}` : ''}`),
  getById: (id) => request(`/dispatches/${id}`),
  getByCampId: (campId) => request(`/dispatches?camp_id=${campId}`),
  getByNeedId: (needId) => request(`/dispatches?need_id=${needId}`),
  create: (data) => request('/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/dispatches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/dispatches/${id}`, { method: 'DELETE' })
};

export const donationsApi = {
  getAll: (params = '') => request(`/donations${params ? `?${params}` : ''}`),
  getById: (id) => request(`/donations/${id}`),
  create: (data) => request('/donations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/donations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/donations/${id}`, { method: 'DELETE' })
};

export const volunteersApi = {
  getAll: (params = '') => request(`/volunteers${params ? `?${params}` : ''}`),
  getById: (id) => request(`/volunteers/${id}`),
  getByCampId: (campId) => request(`/volunteers?camp_id=${campId}`),
  create: (data) => request('/volunteers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/volunteers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/volunteers/${id}`, { method: 'DELETE' })
};
