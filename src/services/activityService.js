import api from './api';

const activityService = {
  // Create new activity
  createActivity: async (activityData) => {
    const response = await api.post('/activities', activityData);
    return response.data;
  },

  // Get all activities
  getActivities: async (params = {}) => {
    const response = await api.get('/activities', { params });
    return response.data;
  },

  // Get single activity
  getActivity: async (id) => {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  // Get activity by date
  getActivityByDate: async (date) => {
    const response = await api.get(`/activities/date/${date}`);
    return response.data;
  },

  // Update activity
  updateActivity: async (id, activityData) => {
    const response = await api.put(`/activities/${id}`, activityData);
    return response.data;
  },

  // Delete activity
  deleteActivity: async (id) => {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  },

  // Get statistics
  getStats: async (params = {}) => {
    const response = await api.get('/activities/stats/summary', { params });
    return response.data;
  },

  // Team-level endpoints (for admin/manager)

  // Get team activity history
  getTeamHistory: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/admin/history`, { params });
    return response.data;
  },

  // Get team statistics
  getTeamStats: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/admin/statistics`, { params });
    return response.data;
  },

  // Get member comparison
  getMemberComparison: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/admin/comparison`, { params });
    return response.data;
  },
};

export default activityService;
