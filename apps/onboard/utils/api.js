// utils/api.js
const BASE_URL = import.meta.env.BASE_URL || '/';
const API_PREFIX = `${BASE_URL}api/`.replace(/\/+/g, '/');

export const fetchApi = async (endpoint, options = {}) => {
  // endpoint passed should just be 'verify'
  const url = `${API_PREFIX}${endpoint}`;
  return fetch(url, options);
};
