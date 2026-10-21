/**
 * Base HTTP Client connecting to src/api.js
 */
import { fetchApi, BASE_URL } from '../api.js';

export { BASE_URL };

export const apiClient = async (endpoint, options = {}) => {
  return fetchApi(endpoint, options);
};

export default apiClient;
