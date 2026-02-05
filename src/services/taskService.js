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

  // Update task status (for drag & drop)
  updateTaskStatus: async (teamId, projectId, taskId, status, position) => {
    const response = await api.patch(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/status`, {
      status,
      position
    });
    return response.data;
  },

  // Add task comment
  addTaskComment: async (teamId, projectId, taskId, commentData) => {
    const response = await api.post(`/teams/${teamId}/projects/${projectId}/tasks/${taskId}/comments`, commentData);
    return response.data;
  }
};

export default taskService;
