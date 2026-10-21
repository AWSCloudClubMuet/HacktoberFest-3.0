import { api } from './client.js';

export async function getAlerts() {
  return (await api.get('/alerts')).data.data;
}

export async function createAlert(values) {
  return (await api.post('/alerts', values)).data.data;
}

export async function updateAlert(id, values) {
  return (await api.put(`/alerts/${id}`, values)).data.data;
}

export async function toggleAlert(id) {
  return (await api.patch(`/alerts/${id}/toggle`)).data.data;
}

export async function deleteAlert(id) {
  return (await api.delete(`/alerts/${id}`)).data.data;
}
