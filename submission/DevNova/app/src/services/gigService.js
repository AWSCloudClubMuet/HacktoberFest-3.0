
const API_URL = "http://localhost:3001";

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

export async function getGigs() {
  return request(`${API_URL}/gigs`);
}

export async function getGigById(id) {
  return request(`${API_URL}/gigs/${encodeURIComponent(id)}`);
}

export async function createGig(gigData) {
  return request(`${API_URL}/gigs`, {
    method: "POST",
    body: JSON.stringify(gigData),
  });
}

export async function updateGig(id, updates) {
  return request(`${API_URL}/gigs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteGig(id) {
  return request(`${API_URL}/gigs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getUsers() {
  return request(`${API_URL}/users`);
}

export async function getUserById(id) {
  return request(`${API_URL}/users/${encodeURIComponent(id)}`);
}
