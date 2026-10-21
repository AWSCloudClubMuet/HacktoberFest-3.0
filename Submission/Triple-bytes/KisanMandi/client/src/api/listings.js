import { api } from './client.js';

export async function getListings(params) {
  return (await api.get('/listings', { params })).data.data;
}

export async function getListing(id) {
  return (await api.get(`/listings/${id}`)).data.data;
}

export async function createListing(values) {
  return (await api.post('/listings', values)).data.data;
}

export async function updateListing(id, values) {
  return (await api.put(`/listings/${id}`, values)).data.data;
}

export async function markListingSold(id) {
  return (await api.patch(`/listings/${id}/sold`)).data.data;
}

export async function deleteListing(id) {
  return (await api.delete(`/listings/${id}`)).data.data;
}
