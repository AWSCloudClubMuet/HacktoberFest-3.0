import axios from 'axios';
import { clearSession, getToken } from './session.js';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

const PUBLIC_PATHS = ['/login', '/signup'];

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const body = error.response?.data?.error;
    error.apiError = body || {
      code: error.response ? 'INTERNAL_ERROR' : 'NETWORK',
      message: error.message,
    };

    const sessionExpired = error.response?.status === 401 && body?.code === 'UNAUTHORIZED';
    if (sessionExpired && !PUBLIC_PATHS.includes(window.location.pathname)) {
      clearSession();
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);

export const errorCode = (err) => err?.apiError?.code || 'INTERNAL_ERROR';

export default client;
