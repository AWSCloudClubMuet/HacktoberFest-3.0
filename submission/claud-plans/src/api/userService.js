import { apiClient } from './client';

const toViewUser = (user) => ({
  ...user,
  role: user.role.toLowerCase()
});

const toApiUser = (user) => ({
  name: user.name,
  phone: user.phone,
  district: user.district,
  role: user.role === 'farmer' ? 'Farmer' : 'Buyer'
});

export const userService = {
  getUsers: async () => (await apiClient('/users')).map(toViewUser),

  getUserById: async (id) => toViewUser(await apiClient(`/users/${id}`)),

  createUser: async (userData) => {
    const created = await apiClient('/users', {
      method: 'POST',
      body: { ...toApiUser(userData), id: `usr-${Date.now()}` }
    });
    return toViewUser(created);
  },

  updateUser: async (id, updates) => {
    const updated = await apiClient(`/users/${id}`, {
      method: 'PATCH',
      body: toApiUser(updates)
    });
    return toViewUser(updated);
  }
};
