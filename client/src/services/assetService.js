import api from './api';

export const assetService = {
  getAssets: async (params) => {
    const res = await api.get('/assets', { params });
    return res.data;
  },

  createAsset: async (data) => {
    const res = await api.post('/assets', data);
    return res.data;
  },

  updateAsset: async (id, data) => {
    const res = await api.put(`/assets/${id}`, data);
    return res.data;
  },

  deleteAsset: async (id) => {
    const res = await api.delete(`/assets/${id}`);
    return res.data;
  }
};
