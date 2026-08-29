import axios from 'axios';

const rawUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').trim();
const BACKEND_URL = rawUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 45000, // 45s to allow Render free tier spin-up
});



api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      // Redirect to login only if on an authenticated page, not on the auth page itself
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
