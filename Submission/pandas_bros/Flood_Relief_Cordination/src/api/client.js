import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('API request timeout');
    } else if (!error.response) {
      console.error('Network error - API may be unavailable');
    } else if (error.response.status >= 500) {
      console.error('Server error:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export default api;