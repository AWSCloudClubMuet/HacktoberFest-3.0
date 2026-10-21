import api from './client';

export const donationsApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/donations?${searchParams.toString()}`);
  },
  getById: (id) => api.get(`/donations/${id}`),
  create: (data) => api.post('/donations', data),
  update: (id, data) => api.put(`/donations/${id}`, data),
  patch: (id, data) => api.patch(`/donations/${id}`, data),
  delete: (id) => api.delete(`/donations/${id}`),
  getByType: (type) => api.get(`/donations?type=${type}`),
  getByItem: (itemId) => api.get(`/donations?item_id=${itemId}`),
};