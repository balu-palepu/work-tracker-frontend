import api from './api';

const sprintService = {
  // Get all sprints for a project
  getSprints: async (teamId, projectId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/sprints`, { params });
    return response.data;
  },

  // Create new sprint
  createSprint: async (teamId, projectId, sprintData) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/sprints`, sprintData);
    return response.data;
  },

  // Get single sprint
  getSprint: async (teamId, projectId, sprintId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}`);
    return response.data;
  },

  // Update sprint
  updateSprint: async (teamId, projectId, sprintId, sprintData) => {
    const response = await api.put(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}`, sprintData);
    return response.data;
  },

  // Delete sprint
  deleteSprint: async (teamId, projectId, sprintId) => {
    const response = await api.delete(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}`);
    return response.data;
  },

  // Start sprint
  startSprint: async (teamId, projectId, sprintId) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}/start`);
    return response.data;
  },

  // Complete sprint
  completeSprint: async (teamId, projectId, sprintId, data) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}/complete`, data);
    return response.data;
  },

  // Cancel sprint
  cancelSprint: async (teamId, projectId, sprintId) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}/cancel`);
    return response.data;
  },

  // Get burndown data
  getBurndownData: async (teamId, projectId, sprintId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}/burndown`);
    return response.data;
  },

  // Submit retrospective
  submitRetrospective: async (teamId, projectId, sprintId, retroData) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}/retrospective`, retroData);
    return response.data;
  },

  // Get backlog
  getBacklog: async (teamId, projectId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/sprints/backlog`, { params });
    return response.data;
  },

  // Add tasks to sprint
  addTasksToSprint: async (teamId, projectId, sprintId, taskIds) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}/tasks`, { taskIds });
    return response.data;
  },

  // Remove task from sprint
  removeTaskFromSprint: async (teamId, projectId, sprintId, taskId) => {
    const response = await api.delete(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`);
    return response.data;
  }
};

export default sprintService;
