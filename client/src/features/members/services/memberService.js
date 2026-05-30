import api from '../../../services/api';

export const memberService = {
  getMembers: async ({ search, status, page, limit }) => {
    const res = await api.get('/members', {
      params: { search, status, page, limit }
    });
    return res.data;
  },

  addMember: async (memberData) => {
    const res = await api.post('/members', memberData);
    return res.data;
  },

  getMemberProfile: async (id) => {
    const res = await api.get(`/members/${id}`);
    return res.data;
  }
};
