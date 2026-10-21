// Centralised HTTP client for the ReliefHub mock API. Every read and write in
// the UI goes through here; nothing is stored only in the browser.

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

export const COLLECTIONS = ['camps', 'inventory', 'needs', 'dispatches', 'donations', 'volunteers'];

let currentRole = 'admin';
export const setApiRole = (role) => {
  currentRole = role;
};

export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Role': currentRole },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Cannot reach the ReliefHub API at ${API_URL}. Start it with "npm run api".`);
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) throw new ApiError(data?.error || `Request failed with status ${res.status}.`, res.status, data?.fields || {});
  return data;
}

const resource = (name) => ({
  list: () => request('GET', `/${name}`),
  create: (body) => request('POST', `/${name}`, body),
  update: (id, body) => request('PATCH', `/${name}/${id}`, body),
  remove: (id) => request('DELETE', `/${name}/${id}`),
});

export const api = {
  camps: resource('camps'),
  inventory: resource('inventory'),
  needs: resource('needs'),
  dispatches: {
    ...resource('dispatches'),
    setStatus: (id, status) => request('PATCH', `/dispatches/${id}`, { status }),
  },
  donations: resource('donations'),
  volunteers: {
    ...resource('volunteers'),
    assign: (id, campId) => request('PATCH', `/volunteers/${id}`, { camp_id: campId }),
  },
  resetDemoData: () => request('POST', '/_reset'),
};
