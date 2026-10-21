import api from './client';

export const inventoryApi = {
  getAll: () => api.get('/inventory'),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  patch: (id, data) => api.patch(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  getByCategory: (category) => api.get(`/inventory?category=${category}`),
};