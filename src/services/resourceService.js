import api from './api';

const resourceService = {
  // Get all team members with their current bandwidth status
  getResourceOverview: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/resources`, { params });
    return response.data;
  },

  // Admin assigns a user to a project with allocation %
  assignResource: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/resources/assign`, data);
    return response.data;
  },

  // Remove a project allocation for a user
  removeAllocation: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/resources/remove-allocation`, data);
    return response.data;
  },

  // Get direct reports for a manager
  getDirectReports: async (teamId, managerId) => {
    const response = await api.get(`/teams/${teamId}/resources/direct-reports/${managerId}`);
    return response.data;
  },
};

export default resourceService;
