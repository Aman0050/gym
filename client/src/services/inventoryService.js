import api from './api';

export const inventoryService = {
  getInventory: async (params) => {
    const res = await api.get('/inventory', { params });
    return res.data;
  },

  createItem: async (data) => {
    const res = await api.post('/inventory', data);
    return res.data;
  },

  updateItem: async (id, data) => {
    const res = await api.put(`/inventory/${id}`, data);
    return res.data;
  },

  deleteItem: async (id) => {
    const res = await api.delete(`/inventory/${id}`);
    return res.data;
  },

  adjustStock: async (data) => {
    const res = await api.post('/inventory/transaction', data);
    return res.data;
  },

  getHistory: async (params) => {
    const res = await api.get('/inventory/history', { params });
    return res.data;
  }
};
