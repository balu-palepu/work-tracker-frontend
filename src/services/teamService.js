import api from './api';

const teamService = {
  // Team CRUD operations
  createTeam: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  getTeams: async () => {
    const response = await api.get('/teams');
    return response.data;
  },

  getTeam: async (teamId) => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },

  updateTeam: async (teamId, teamData) => {
    const response = await api.put(`/teams/${teamId}`, teamData);
    return response.data;
  },

  deleteTeam: async (teamId) => {
    const response = await api.delete(`/teams/${teamId}`);
    return response.data;
  },

  // Team member management
  getTeamMembers: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/members`, { params });
    return response.data;
  },

  getAvailableUsers: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/available-users`);
    return response.data;
  },

  addTeamMember: async (teamId, memberData) => {
    const response = await api.post(`/teams/${teamId}/members`, memberData);
    return response.data;
  },

  updateTeamMember: async (teamId, userId, memberData) => {
    const response = await api.put(`/teams/${teamId}/members/${userId}`, memberData);
    return response.data;
  },

  removeTeamMember: async (teamId, userId) => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },

  // Team settings
  getTeamSettings: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/settings`);
    return response.data;
  },

  updateTeamSettings: async (teamId, settings) => {
    const response = await api.put(`/teams/${teamId}/settings`, settings);
    return response.data;
  }
};

export default teamService;
