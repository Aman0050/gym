import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useSupportStore = create((set, get) => ({
  faqs: [],
  tickets: [],
  isLoading: false,

  fetchFAQs: async () => {
    try {
      const res = await api.get('/support/faqs');
      set({ faqs: res.data });
    } catch (err) {}
  },

  fetchTickets: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/support/tickets');
      set({ tickets: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  createTicket: async (ticketData) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/support/tickets', ticketData);
      set((state) => ({ 
        tickets: [res.data, ...state.tickets],
        isLoading: false 
      }));
      toast.success('Support ticket submitted');
      return true;
    } catch (err) {
      set({ isLoading: false });
      toast.error('Failed to submit ticket');
      return false;
    }
  }
}));
