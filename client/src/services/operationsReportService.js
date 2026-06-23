import api from './api';

export const operationsReportService = {
  getProfitAnalytics: async () => {
    const res = await api.get('/operations/reports/profit-analytics');
    return res.data;
  },

  getOverview: async () => {
    const res = await api.get('/operations/reports/overview');
    return res.data;
  },

  getAuditLogs: async (params) => {
    const res = await api.get('/operations/reports/audit-logs', { params });
    return res.data;
  },

  exportData: async (section, format) => {
    const response = await api.get('/operations/reports/export', {
      params: { section, format },
      responseType: 'blob'
    });

    const contentType = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fitxeno_export_${section}_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
