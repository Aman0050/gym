import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      suspensionInfo: null,

      setSuspended: (info) => set({ suspensionInfo: info }),

      // identifier can be email (Super Admin) or gym_id (Gym Admin)
      login: async (identifier, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { identifier, password });
          const { user, accessToken, refreshToken } = res.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, suspensionInfo: null });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user-storage');
        
        try {
          import('../services/socket').then(module => {
            if (module.default && typeof module.default.disconnect === 'function') {
              module.default.disconnect();
            }
          });
        } catch (e) {
          console.warn('Could not disconnect socket on logout');
        }

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'user-storage',
    }
  )
);
