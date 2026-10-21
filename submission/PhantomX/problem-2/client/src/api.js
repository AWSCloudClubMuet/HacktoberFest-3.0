const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'campus-user-id';

let currentUserId = localStorage.getItem(STORAGE_KEY) || '';

export function getCurrentUserId() {
  return currentUserId;
}

export function setCurrentUserId(id) {
  currentUserId = id || '';
  if (currentUserId) localStorage.setItem(STORAGE_KEY, currentUserId);
  else localStorage.removeItem(STORAGE_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'x-user-id': currentUserId };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the API. Start it with npm start on port 3001.', 0);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Request failed (${response.status})`, response.status);
  }
  return data;
}
