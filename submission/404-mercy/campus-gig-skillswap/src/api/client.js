const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text}`)
  }
  return response.json()
}

// Users
export const getUsers = () => request('/users')
export const getUser = (id) => request(`/users/${id}`)
export const createUser = (data) => request('/users', { method: 'POST', body: JSON.stringify(data) })
export const updateUser = (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

// Gigs
export const getGigs = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request(`/gigs${query ? '?' + query : ''}`)
}
export const getGig = (id) => request(`/gigs/${id}`)
export const createGig = (data) => request('/gigs', { method: 'POST', body: JSON.stringify(data) })
export const updateGig = (id, data) => request(`/gigs/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteGig = (id) => request(`/gigs/${id}`, { method: 'DELETE' })

// Applications
export const getApplications = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request(`/applications${query ? '?' + query : ''}`)
}
export const getApplication = (id) => request(`/applications/${id}`)
export const createApplication = (data) => request('/applications', { method: 'POST', body: JSON.stringify(data) })
export const updateApplication = (id, data) => request(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

// Reviews
export const getReviews = (params = {}) => {
  const query = new URLSearchParams(params).toString()
  return request(`/reviews${query ? '?' + query : ''}`)
}
export const getReview = (id) => request(`/reviews/${id}`)
export const createReview = (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) })
