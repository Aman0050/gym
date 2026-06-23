import api from './api';

export const staffService = {
  getStaffMembers: async (params) => {
    const res = await api.get('/staff', { params });
    return res.data;
  },

  getStaffMemberById: async (id) => {
    const res = await api.get(`/staff/${id}`);
    return res.data;
  },

  createStaffMember: async (formData) => {
    const res = await api.post('/staff', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  updateStaffMember: async (id, formData) => {
    const res = await api.put(`/staff/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  deleteStaffMember: async (id) => {
    const res = await api.delete(`/staff/${id}`);
    return res.data;
  },

  getStaffAttendance: async (params) => {
    const res = await api.get('/staff/attendance', { params });
    return res.data;
  },

  upsertStaffAttendance: async (data) => {
    const res = await api.post('/staff/attendance', data);
    return res.data;
  },

  getStaffPayroll: async (params) => {
    const res = await api.get('/staff/payroll', { params });
    return res.data;
  },

  upsertStaffPayroll: async (data) => {
    const res = await api.post('/staff/payroll', data);
    return res.data;
  },

  getTrainerPerformance: async () => {
    const res = await api.get('/staff/performance');
    return res.data;
  },

  upsertTrainerPerformance: async (data) => {
    const res = await api.post('/staff/performance', data);
    return res.data;
  }
};
