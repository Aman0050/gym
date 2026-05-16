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
      suspensionInfo: null, // { reason, timestamp }

      setSuspended: (info) => set({ suspensionInfo: info }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = res.data;
          
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({ 
            user, 
            token: accessToken, 
            isAuthenticated: true,
            isLoading: false 
          });
          return true;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user-storage');
        window.location.href = '/login';
      },

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'user-storage',
    }
  )
);
