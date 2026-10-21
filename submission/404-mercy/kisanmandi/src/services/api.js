// src/services/api.js
// Centralized API service — all HTTP calls go through here.
// Never hardcode the API URL outside this module.

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error(
    '[KisanMandi] VITE_API_URL is not set. Create a .env file with VITE_API_URL=http://localhost:3001'
  );
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error('API URL is not configured. Check your .env file.');
  }
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ── USERS ────────────────────────────────────────────────────────────────────
export const getUsers      = ()       => request('/users');
export const createUser    = (data)   => request('/users', { method: 'POST', body: JSON.stringify(data) });

// ── CROPS ─────────────────────────────────────────────────────────────────────
export const getCrops      = ()       => request('/crops');

// ── MARKETS ───────────────────────────────────────────────────────────────────
export const getMarkets    = ()       => request('/markets');

// ── PRICES ────────────────────────────────────────────────────────────────────
export const getPrices     = ()       => request('/prices');
export const getPricesByMarket = (marketId) =>
  request(`/prices?marketId=${marketId}`);
export const getPricesByCropAndMarket = (cropId, marketId) =>
  request(`/prices?cropId=${cropId}&marketId=${marketId}&_sort=date`);

// ── LISTINGS ──────────────────────────────────────────────────────────────────
export const getActiveListings = () => request('/listings?status=active');
export const getListingsBySeller = (sellerId) =>
  request(`/listings?sellerId=${sellerId}`);
export const createListing = (data)        => request('/listings', { method: 'POST',  body: JSON.stringify(data) });
export const updateListing = (id, data)    => request(`/listings/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteListing = (id)          => request(`/listings/${id}`, { method: 'DELETE' });
export const getListing    = (id)          => request(`/listings/${id}`);

// ── ALERTS ────────────────────────────────────────────────────────────────────
export const getAlerts         = ()       => request('/alerts');
export const getAlertsByUser   = (userId) => request(`/alerts?userId=${userId}`);
export const createAlert       = (data)   => request('/alerts', { method: 'POST',   body: JSON.stringify(data) });
export const updateAlert       = (id, data) => request(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAlert       = (id)     => request(`/alerts/${id}`, { method: 'DELETE' });
