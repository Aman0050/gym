import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications');
      const unread = res.data.filter(n => !n.is_read).length;
      set({ notifications: res.data, unreadCount: unread, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
