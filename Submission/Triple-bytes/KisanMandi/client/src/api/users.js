import { api } from './client.js';

export async function createOrLoginUser(values) {
  const response = await api.post('/users', values);
  return response.data.data;
}
