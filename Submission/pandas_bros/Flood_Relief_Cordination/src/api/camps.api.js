import api from './client';

export const campsApi = {
  getAll: () => api.get('/camps'),
  getById: (id) => api.get(`/camps/${id}`),
  create: (data) => api.post('/camps', data),
  update: (id, data) => api.put(`/camps/${id}`, data),
  patch: (id, data) => api.patch(`/camps/${id}`, data),
  delete: (id) => api.delete(`/camps/${id}`),
  getNeeds: (campId) => api.get(`/needs?camp_id=${campId}`),
  getVolunteers: (campId) => api.get(`/volunteers?camp_id=${campId}`),
  getDispatches: (campId) => api.get(`/dispatches?camp_id=${campId}`),
};