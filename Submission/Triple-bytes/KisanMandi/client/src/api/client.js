import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('kisanmandi_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user?.id) config.headers['x-user-id'] = user.id;
    } catch {
      localStorage.removeItem('kisanmandi_user');
    }
  }
  return config;
});

export function apiMessage(error, fallback) {
  return error.response?.data?.error?.message || fallback;
}

api.interceptors.response.use((response) => response, (error) => {
  const code = error.response?.data?.error?.code;
  if (error.response?.status === 401 && code === 'UNAUTHORIZED' && localStorage.getItem('kisanmandi_user')) {
    localStorage.removeItem('kisanmandi_user');
    window.location.assign('/onboarding');
  }
  return Promise.reject(error);
});
