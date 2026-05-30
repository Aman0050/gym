import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useSettingsStore = create((set, get) => ({
  settings: {
    expiry_reminder_days: 3,
    auto_freeze_enabled: true,
    grace_period_days: 0,
    tax_percentage: 0,
    invoice_prefix: 'INV',
    currency: 'INR',
    whatsapp_enabled: false,
    email_enabled: false,
    realtime_alerts_enabled: true
  },
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/settings');
      set({ settings: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    set({ isLoading: true });
    try {
      const res = await api.put('/settings', newSettings);
      set({ settings: res.data, isLoading: false });
      toast.success('System configuration updated');
    } catch (err) {
      set({ isLoading: false });
      toast.error('Failed to update settings');
    }
  }
}));
