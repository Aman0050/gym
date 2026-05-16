import { create } from 'zustand';
import api from '../services/api';
import socket from '../services/socket';
import toast from 'react-hot-toast';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  init: () => {
    let lastToastTime = 0;
    const TOAST_COOLDOWN = 2000;

    socket.on('NEW_NOTIFICATION', ({ notification }) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }));
      
      const now = Date.now();
      const isUrgent = notification.priority === 'HIGH' || notification.priority === 'URGENT';
      
      // Intelligent Calmness: Only toast if not in cooldown OR if URGENT
      if (isUrgent || (now - lastToastTime > TOAST_COOLDOWN)) {
        toast(notification.message, {
          icon: isUrgent ? '⚡' : '🔔',
          style: { 
            borderLeft: isUrgent ? '4px solid #ef4444' : '4px solid #a0522d',
            fontSize: '11px',
            fontWeight: 'bold'
          }
        });
        lastToastTime = now;
      }
    });
  },

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
