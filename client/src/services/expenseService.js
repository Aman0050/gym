import api from './api';

export const expenseService = {
  getExpenses: async (params) => {
    const res = await api.get('/expenses', { params });
    return res.data;
  },

  getExpenseCategories: async () => {
    const res = await api.get('/expenses/categories');
    return res.data;
  },

  createExpense: async (formData) => {
    const res = await api.post('/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  updateExpense: async (id, formData) => {
    const res = await api.put(`/expenses/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  deleteExpense: async (id) => {
    const res = await api.delete(`/expenses/${id}`);
    return res.data;
  }
};
