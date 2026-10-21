/**
 * KisanMandi API Client & Collection Helpers
 * Single source of truth for mock REST API communications
 */

export const BASE_URL = 'http://localhost:3001';

/**
 * Core fetch helper supporting query params, JSON body and error normalization
 */
export async function fetchApi(endpoint, options = {}, retries = 2) {
  const { method = 'GET', body, params, headers = {} } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers
    }
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.message) errMessage = errJson.message;
      } catch {
        // ignore json parse error
      }
      const error = new Error(errMessage);
      error.status = response.status;
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 100));
      return fetchApi(endpoint, options, retries - 1);
    }
    throw err;
  }
}

export const apiGet = (endpoint, params) => fetchApi(endpoint, { method: 'GET', params });
export const apiPost = (endpoint, body) => fetchApi(endpoint, { method: 'POST', body });
export const apiPatch = (endpoint, body) => fetchApi(endpoint, { method: 'PATCH', body });
export const apiDelete = (endpoint) => fetchApi(endpoint, { method: 'DELETE' });

// 1. Users
export const getUsers = () => apiGet('/users');
export const getUserById = (id) => apiGet(`/users/${id}`);
export const createUser = (user) => apiPost('/users', user);
export const updateUser = (id, data) => apiPatch(`/users/${id}`, data);
export const deleteUser = (id) => apiDelete(`/users/${id}`);

// 2. Crops
export const getCrops = () => apiGet('/crops');
export const getCropById = (id) => apiGet(`/crops/${id}`);

// 3. Markets
export const getMarkets = () => apiGet('/markets');
export const getMarketById = (id) => apiGet(`/markets/${id}`);

// 4. Prices
export const getPrices = (params) => apiGet('/prices', params);
export const getPriceById = (id) => apiGet(`/prices/${id}`);

// 5. Listings
export const getListings = (params) => apiGet('/listings', params);
export const getListingById = (id) => apiGet(`/listings/${id}`);
export const createListing = (listing) => apiPost('/listings', listing);
export const updateListing = (id, data) => apiPatch(`/listings/${id}`, data);
export const deleteListing = (id) => apiDelete(`/listings/${id}`);

// 6. Alerts
export const getAlerts = (params) => apiGet('/alerts', params);
export const getAlertById = (id) => apiGet(`/alerts/${id}`);
export const createAlert = (alert) => apiPost('/alerts', alert);
export const updateAlert = (id, data) => apiPatch(`/alerts/${id}`, data);
export const deleteAlert = (id) => apiDelete(`/alerts/${id}`);

export const api = {
  BASE_URL,
  fetchApi,
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
  // Collections
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCrops,
  getCropById,
  getMarkets,
  getMarketById,
  getPrices,
  getPriceById,
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert
};

export default api;
