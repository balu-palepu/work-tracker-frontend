import api from './api';

const taskService = {
  // Get all tasks for a project
  getProjectTasks: async (teamId, projectId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/tasks`);
    return response.data;
  },

  // Create new task
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

  // Update task status (for drag & drop) - supports completion reasoning
  updateTaskStatus: async (teamId, projectId, taskId, status, position, completionData = {}) => {
    const response = await api.patch(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/status`, {
      status,
      position,
      ...completionData
    });
    return response.data;
  },

  // Add task comment
  addTaskComment: async (teamId, projectId, taskId, commentData) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/comments`, commentData);
    return response.data;
  },

  // Get child tasks
  getTaskChildren: async (teamId, projectId, taskId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/children`);
    return response.data;
  },

  // Get task ancestry chain (for breadcrumb)
  getTaskAncestry: async (teamId, projectId, taskId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/ancestry`);
    return response.data;
  },

  // Get task progress rollup
  getTaskProgress: async (teamId, projectId, taskId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/progress`);
    return response.data;
  }
};

export default taskService;
