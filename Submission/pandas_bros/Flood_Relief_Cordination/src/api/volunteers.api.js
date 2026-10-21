import api from './client';

export const volunteersApi = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return api.get(`/volunteers?${searchParams.toString()}`);
  },
  getById: (id) => api.get(`/volunteers/${id}`),
  create: (data) => api.post('/volunteers', data),
  update: (id, data) => api.put(`/volunteers/${id}`, data),
  patch: (id, data) => api.patch(`/volunteers/${id}`, data),
  delete: (id) => api.delete(`/volunteers/${id}`),
  getByCamp: (campId) => api.get(`/volunteers?camp_id=${campId}`),
  getBySkill: (skill) => api.get(`/volunteers?skill=${skill}`),
  getUnassigned: () => api.get('/volunteers?camp_id=null'),
};