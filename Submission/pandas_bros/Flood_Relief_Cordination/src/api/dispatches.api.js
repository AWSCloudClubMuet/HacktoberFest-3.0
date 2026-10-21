import api from './client';

export const dispatchesApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/dispatches?${searchParams.toString()}`);
  },
  getById: (id) => api.get(`/dispatches/${id}`),
  create: (data) => api.post('/dispatches', data),
  update: (id, data) => api.put(`/dispatches/${id}`, data),
  patch: (id, data) => api.patch(`/dispatches/${id}`, data),
  delete: (id) => api.delete(`/dispatches/${id}`),
  getByCamp: (campId) => api.get(`/dispatches?camp_id=${campId}`),
  getByNeed: (needId) => api.get(`/dispatches?need_id=${needId}`),
  getByStatus: (status) => api.get(`/dispatches?status=${status}`),
};