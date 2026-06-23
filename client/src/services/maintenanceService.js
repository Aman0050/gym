import api from './api';

export const maintenanceService = {
  getMaintenanceLogs: async (params) => {
    const res = await api.get('/maintenance', { params });
    return res.data;
  },

  createMaintenanceLog: async (formData) => {
    const res = await api.post('/maintenance', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
