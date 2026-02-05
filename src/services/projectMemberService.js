import api from './api';

const projectMemberService = {
  // Get all members for a project
  getProjectMembers: async (teamId, projectId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/members`);
    return response.data;
  },

  // Add member to project
  addProjectMember: async (teamId, projectId, memberData) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/members`, memberData);
    return response.data;
  },

  // Update project member role
  updateProjectMember: async (teamId, projectId, userId, memberData) => {
    const response = await api.put(`/teams/${teamId}/projects/${projectId}/members/${userId}`, memberData);
    return response.data;
  },

  // Remove member from project
  removeProjectMember: async (teamId, projectId, userId) => {
    const response = await api.delete(`/teams/${teamId}/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  // Get my membership for this project
  getMyMembership: async (teamId, projectId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/members/me`);
    return response.data;
  },

  // Bulk add members to project
  bulkAddProjectMembers: async (teamId, projectId, members) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/members/bulk`, { members });
    return response.data;
  }
};

export default projectMemberService;
