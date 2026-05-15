import axios from 'axios';
import axiosRetry from 'axios-retry';
import toast from 'react-hot-toast';
import { useSyncStore } from '../store/useSyncStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // 15s hard timeout — prevents indefinite hangs
});

// ── Retry Logic: Exponential backoff for network errors ──
axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => Math.min(retryCount * 1200, 5000),
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status >= 500,
  onRetry: (retryCount, error) => {
    toast.loading(
      `Connection issue. Retrying... (${retryCount}/3)`,
      { id: 'api-retry', duration: 3000 }
    );
  },
});

// ── Request Interceptor ──
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Offline queue: capture mutation requests when offline
  if (!navigator.onLine && config.method !== 'get' && !config._isSync) {
    toast.success('Action queued. Will sync when you\'re back online.', {
      id: 'offline-queue',
      icon: '📥',
      duration: 4000,
    });

    await useSyncStore.getState().addToQueue({
      method: config.method,
      url: config.url,
      data: config.data,
    });

    return Promise.reject({ isOfflineQueue: true });
  }

  return config;
});

// ── Response Interceptor ──
api.interceptors.response.use(
  (response) => {
    toast.dismiss('api-retry');
    return response;
  },
  async (error) => {
    // Silently resolve offline-queued requests
    if (error.isOfflineQueue) {
      return Promise.resolve({
        data: { success: true, queued: true, status: 'QUEUED' },
      });
    }

    const originalRequest = error.config;

    // 401 → Token Refresh flow
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { token: refreshToken }
          );
          if (data.accessToken) {
            localStorage.setItem('token', data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          handleAuthFailure();
        }
      } else {
        handleAuthFailure();
      }
    }

    // Centralized error handling — user-friendly messages
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please check your connection.', { id: 'timeout' });
    } else if (!error.response) {
      toast.error('Cannot reach the server. Please check your internet.', {
        id: 'server-unreachable',
        duration: 5000,
      });
    } else if (error.response.status >= 500) {
      toast.error('Server error. Our team has been notified.', { id: 'server-500' });
    } else if (error.response.status === 403) {
      toast.error('Access denied. You don\'t have permission for this action.');
    } else if (error.response.status === 429) {
      toast.error('Too many requests. Please wait a moment before trying again.');
    }

    return Promise.reject(error);
  }
);

function handleAuthFailure() {
  localStorage.clear();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default api;
