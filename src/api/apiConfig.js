import axios from 'axios';

// prefer environment-configured base URL (Vite: import.meta.env.VITE_API_URL) falling back to hardcoded local address
const API_URL =  'https://qlns-production.up.railway.app/' || 'https://qlns-steel.vercel.app/' ;

// timeout configurable via Vite env VITE_API_TIMEOUT (milliseconds), default to 15000ms
const DEFAULT_TIMEOUT = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_TIMEOUT)
  ? Number(import.meta.env.VITE_API_TIMEOUT)
  : 15000;

const api = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ensure Authorization header stays current (in case token changes during runtime)
api.interceptors.request.use((cfg) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) cfg.headers = { ...cfg.headers, Authorization: `Bearer ${token}` };
  } catch (e) {
    // ignore when localStorage not available
  }
  return cfg;
});

// Response interceptor to surface clearer timeout/network messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED' && err.message && err.message.includes('timeout')) {
      return Promise.reject(new Error('Request timed out. The server may be slow or unreachable.'));
    }
    if (err.response == null) {
      // network error (no response)
      return Promise.reject(new Error('Network error: could not reach the API. Check your connection or server.'));
    }
    return Promise.reject(err);
  }
);

export default api;