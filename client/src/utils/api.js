import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || '/api').trim();

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple in-memory GET cache (30s TTL) to reduce duplicate requests
const _cache = new Map();
const CACHE_TTL = 30 * 1000;
const originalGet = api.get.bind(api);
api.get = async (url, config = {}) => {
  if (config?.cache === false) return originalGet(url, config);
  const key = url + JSON.stringify(config?.params || {});
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  const res = await originalGet(url, config);
  _cache.set(key, { data: res, time: Date.now() });
  return res;
};

// --- Token refresh handling ---
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry network errors a few times (helps with Render cold starts)
    if (!error.response && originalRequest && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }
    if (!error.response && originalRequest && originalRequest._retryCount < 3) {
      originalRequest._retryCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 500 * originalRequest._retryCount));
      return api(originalRequest);
    }

    // Surface rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limited. Please slow down.');
    }

    // If 401 and not already retried, attempt a token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshResponse = await axios.post(
            `${baseURL.replace(/\/api\/?$/, '')}/api/auth/refresh`,
            {},
            { withCredentials: true }
          );
          const newToken = refreshResponse.data?.accessToken;
          if (newToken) {
            localStorage.setItem('token', newToken);
            onRefreshed(newToken);
          } else {
            throw new Error('No access token returned');
          }
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (newToken) {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;