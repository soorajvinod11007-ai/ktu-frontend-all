import axios from 'axios';

const BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }).catch(Promise.reject);
      }
      original._retry = true;
      isRefreshing = true;
      const refresh_token = localStorage.getItem('refresh_token');
      if (!refresh_token) {
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token });
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout', {
    refresh_token: localStorage.getItem('refresh_token'),
  }),
  me: () => api.get('/auth/me'),
  refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ─── Admin ───────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),

  list: (resource, params) => api.get(`/admin/${resource}`, { params }),
  getOne: (resource, id) => api.get(`/admin/${resource}/${id}`),
  create: (resource, data) => api.post(`/admin/${resource}`, data),
  update: (resource, id, data) => api.patch(`/admin/${resource}/${id}`, data),
  remove: (resource, id) => api.delete(`/admin/${resource}/${id}`),
  restore: (resource, id) => api.post(`/admin/${resource}/${id}/restore`),
  export: (resource, params) =>
    api.get(`/admin/${resource}/export`, { params, responseType: 'blob' }),
  import: (resource, formData) =>
    api.post(`/admin/${resource}/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  options: (resource) => api.get(`/admin/options/${resource}`),
};

// ─── Uploads ─────────────────────────────────────────
export const uploadApi = {
  preview: (formData) =>
    api.post('/uploads/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  confirm: (uploadId) => api.post(`/uploads/${uploadId}/confirm`),
  cancel: (uploadId) => api.delete(`/uploads/${uploadId}`),
  history: (params) => api.get('/uploads', { params }),
};

// ─── Reports ─────────────────────────────────────────
export const reportApi = {
  filters: () => api.get('/reports/filters'),
  get: (report, params) => api.get(`/reports/${report}`, { params }),
  download: (report, format, params) =>
    api.get(`/reports/${report}/${format}`, { params, responseType: 'blob' }),
};

// ─── Health ──────────────────────────────────────────
export const healthApi = {
  check: () => api.get('/health'),
};

export default api;
