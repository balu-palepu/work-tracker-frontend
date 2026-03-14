import api from "./api";

const adminService = {
  // Get dashboard overview
  getDashboard: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/admin/dashboard`);
    return response.data;
  },

  // Get team analytics
  getTeamAnalytics: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/admin/analytics`, {
      params,
    });
    return response.data;
  },

  // Get team members with stats
  getTeamMembers: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/admin/members`);
    return response.data;
  },

  // Update member role
  updateMemberRole: async (teamId, userId, role) => {
    const response = await api.put(
      `/teams/${teamId}/admin/members/${userId}/role`,
      { role },
    );
    return response.data;
  },

  // Remove member
  removeMember: async (teamId, userId) => {
    const response = await api.delete(
      `/teams/${teamId}/admin/members/${userId}`,
    );
    return response.data;
  },

  // Get project stats
  getProjectStats: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/admin/projects`);
    return response.data;
  },

  // Get activity feed
  getActivityFeed: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/admin/activity`, {
      params,
    });
    return response.data;
  },

  // Get Manager view (direct reports and project members)
  getProjectManagerView: async (teamId) => {
    const response = await api.get(
      `/teams/${teamId}/admin/project-manager-view`,
    );
    return response.data;
  },

  // Get locked accounts
  getLockedAccounts: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/admin/locked-accounts`);
    return response.data;
  },

  // Unlock a user account
  unlockAccount: async (teamId, userId) => {
    const response = await api.put(
      `/teams/${teamId}/admin/members/${userId}/unlock`,
    );
    return response.data;
  },

  // Get member comparison stats (admin/manager)
  getMemberComparison: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/admin/comparison`, { params });
    return response.data;
  },
};

export default adminService;
