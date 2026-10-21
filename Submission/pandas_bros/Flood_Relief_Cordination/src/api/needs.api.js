import api from './client';

export const needsApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/needs?${searchParams.toString()}`);
  },
  getById: (id) => api.get(`/needs/${id}`),
  create: (data) => api.post('/needs', data),
  update: (id, data) => api.put(`/needs/${id}`, data),
  patch: (id, data) => api.patch(`/needs/${id}`, data),
  delete: (id) => api.delete(`/needs/${id}`),
  getByCamp: (campId) => api.get(`/needs?camp_id=${campId}`),
  getByItem: (itemId) => api.get(`/needs?inventory_item_id=${itemId}`),
  getByPriority: (priority) => api.get(`/needs?priority=${priority}`),
};