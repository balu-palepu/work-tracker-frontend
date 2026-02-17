import api from './api';

const projectService = {
  // Get all projects for team
  getProjects: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/projects`, { params });
    return response.data;
  },

  // Create new project
  createProject: async (teamId, projectData) => {
    // Transform members array to backend format
    const payload = {
      ...projectData,
      teamLeadId: projectData.teamLeadId || null,
      members: projectData.members?.map(userId => ({
        userId,
        role: 'contributor'
      })) || []
    };
    const response = await api.post(`/teams/${teamId}/projects`, payload);
    return response.data;
  },

  // Get single project
  getProject: async (teamId, projectId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}`);
    return response.data;
  },

  // Update project
  updateProject: async (teamId, projectId, projectData) => {
    const response = await api.put(`/teams/${teamId}/projects/${projectId}`, projectData);
    return response.data;
  },

  // Delete project
  deleteProject: async (teamId, projectId) => {
    const response = await api.delete(`/teams/${teamId}/projects/${projectId}`);
    return response.data;
  },

  // Get project tasks
  getProjectTasks: async (teamId, projectId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/tasks`);
    return response.data;
  },

  // Create task
  createTask: async (teamId, projectId, taskData) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  // Get single task
  getTask: async (teamId, projectId, taskId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  // Update task
  updateTask: async (teamId, projectId, taskId, taskData) => {
    const response = await api.put(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Delete task
  deleteTask: async (teamId, projectId, taskId) => {
    const response = await api.delete(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  // Update task status
  updateTaskStatus: async (teamId, projectId, taskId, statusData) => {
    const response = await api.patch(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/status`, statusData);
    return response.data;
  },

  // Assign team lead to project
  assignTeamLead: async (teamId, projectId, teamLeadId) => {
    const response = await api.put(`/teams/${teamId}/projects/${projectId}/team-lead`, { teamLeadId });
    return response.data;
  },

  // Get projects by team lead
  getProjectsByTeamLead: async (teamId, userId) => {
    const response = await api.get(`/teams/${teamId}/projects/team-lead/${userId}`);
    return response.data;
  },

  // Update project workflow
  updateWorkflow: async (teamId, projectId, workflowData) => {
    const response = await api.put(`/teams/${teamId}/projects/${projectId}/workflow`, workflowData);
    return response.data;
  },

  // Get project analytics
  getProjectAnalytics: async (teamId, projectId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/analytics`);
    return response.data;
  }
};

export default projectService;