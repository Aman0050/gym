import axios from 'axios';
import axiosRetry from 'axios-retry';
import toast from 'react-hot-toast';
import { useSyncStore } from '../store/useSyncStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000, // 15s hard timeout — prevents indefinite hangs
});

// ── Retry Logic: Exponential backoff for network errors only ──
axiosRetry(api, {
  retries: 2,
  retryDelay: (retryCount) => Math.min(retryCount * 1200, 4000),
  retryCondition: (error) => {
    // Never retry payment mutation endpoints — non-idempotent
    const url = error.config?.url || '';
    const isNonIdempotentMutation =
      url.includes('/payments/confirm') ||
      url.includes('/payments/create-pending') ||
      url.includes('/payments/verify') ||
      url.includes('/attendance/check-in');
    if (isNonIdempotentMutation) return false;

    // Only retry true network errors, NOT 5xx server errors on mutations
    const isNetworkError = axiosRetry.isNetworkError(error);
    const isIdempotentServerError =
      error.response?.status >= 500 && error.config?.method === 'get';
    return isNetworkError || isIdempotentServerError;
  },
  onRetry: (retryCount, error) => {
    toast.loading(
      `Connection issue. Retrying... (${retryCount}/2)`,
      { id: 'api-retry', duration: 3000 }
    );
  },
});

// ── Request Interceptor ──
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('accessToken');
  if (import.meta.env.DEV) console.log('[Auth] Intercepting request, attaching token:', !!token);
  
  if (token && token !== 'undefined' && token !== 'null') {
    // Check if token is expired (prevent 401 spam)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expDate = payload.exp * 1000;
      // If expiring in next 5 seconds, let the 401 logic or proactive refresh handle it
      // Actually, if we throw an error here, the response interceptor might not catch it as a 401.
      // A better way is to do a proactive refresh if it's expired.
      if (Date.now() >= expDate - 5000) {
        if (import.meta.env.DEV) console.log('[Auth] Token expired locally, triggering proactive refresh...');
        const error = new Error('TokenExpiredLocally');
        error.isLocalTokenExpiry = true;
        error.config = config;
        return Promise.reject(error);
      }
    } catch (e) {
      // invalid token format, ignore
    }
    
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
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

// ── Token Refresh Queue ──
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (error, token) => {
  refreshSubscribers.forEach((cb) => cb(error, token));
  refreshSubscribers = [];
};

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

    // 401 → Token Refresh flow OR proactive local expiry
    if ((error.response?.status === 401 || error.isLocalTokenExpiry) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((err, token) => {
            if (err) return reject(err);
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (import.meta.env.DEV) console.log('[Auth] 401 Detected. Attempting token refresh...');

      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { token: refreshToken }
          );
          if (data.accessToken) {
            if (import.meta.env.DEV) console.log('[Auth] Refresh success');
            localStorage.setItem('accessToken', data.accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            
            // Notify all queued requests to retry with the new token
            onRefreshed(null, data.accessToken);
            
            if (import.meta.env.DEV) console.log('[Socket] Reconnecting with new token...');
            import('./socket').then(module => {
              if (module.default && typeof module.default.connect === 'function') {
                module.default.connect(data.accessToken);
              }
            });
            
            if (import.meta.env.DEV) console.log(`[Auth] Retrying ${originalRequest.url}...`);
            return api(originalRequest);
          }
        } catch (err) {
          if (import.meta.env.DEV) console.log('[Auth] Refresh failed');
          onRefreshed(err, null);
          handleAuthFailure();
        } finally {
          isRefreshing = false;
        }
      } else {
        if (import.meta.env.DEV) console.log('[Auth] No refresh token found');
        onRefreshed(new Error('No refresh token'), null);
        isRefreshing = false;
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
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Our team has been notified.', { id: 'server-500' });
    } else if (error.response?.status === 403) {
      const { code, reason, timestamp } = error.response.data;
      
      if (code === 'GYM_SUSPENDED' || code === 'GYM_DISABLED') {
        const { useAuthStore } = await import('../store/useAuthStore');
        useAuthStore.getState().setSuspended({ reason, timestamp });
        return Promise.reject(error);
      }
      
      toast.error('Access denied. You don\'t have permission for this action.');

    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment before trying again.');
    }

    return Promise.reject(error);
  }
);

async function handleAuthFailure() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Safely disconnect socket
  try {
    const socketModule = await import('./socket');
    if (socketModule.default && typeof socketModule.default.disconnect === 'function') {
      socketModule.default.disconnect();
    }
  } catch (e) {
    console.warn('Socket disconnect failed during auth failure');
  }

  try {
    const { useAuthStore } = await import('../store/useAuthStore');
    useAuthStore.getState().logout();
  } catch (e) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

export default api;
