import api from './api';

const bandwidthService = {
  // Get user's reports
  getMyReports: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/bandwidth/my`);
    return response.data;
  },

  // Get all reports (admin)
  getAllReports: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/bandwidth`, { params });
    return response.data;
  },

  // Get pending reports (admin)
  getPendingReports: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/bandwidth/pending`);
    return response.data;
  },

  // Get bandwidth summary (admin)
  getBandwidthSummary: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/bandwidth/summary`, { params });
    return response.data;
  },

  // Create report
  createReport: async (teamId, reportData) => {
    const response = await api.post(`/teams/${teamId}/bandwidth`, reportData);
    return response.data;
  },

  // Get single report
  getReport: async (teamId, reportId) => {
    const response = await api.get(`/teams/${teamId}/bandwidth/${reportId}`);
    return response.data;
  },

  // Update report
  updateReport: async (teamId, reportId, reportData) => {
    const response = await api.put(`/teams/${teamId}/bandwidth/${reportId}`, reportData);
    return response.data;
  },

  // Delete report
  deleteReport: async (teamId, reportId) => {
    const response = await api.delete(`/teams/${teamId}/bandwidth/${reportId}`);
    return response.data;
  },

  // Submit report for approval
  submitReport: async (teamId, reportId) => {
    const response = await api.post(`/teams/${teamId}/bandwidth/${reportId}/submit`);
    return response.data;
  },

  // Approve report (admin)
  approveReport: async (teamId, reportId) => {
    const response = await api.post(`/teams/${teamId}/bandwidth/${reportId}/approve`);
    return response.data;
  },

  // Reject report (admin)
  rejectReport: async (teamId, reportId, reason) => {
    const response = await api.post(`/teams/${teamId}/bandwidth/${reportId}/reject`, { reason });
    return response.data;
  }
};

export default bandwidthService;
