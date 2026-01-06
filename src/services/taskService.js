import api from './api';

const taskService = {
  // Get all tasks for a project
  getProjectTasks: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  // Create new task
  createTask: async (projectId, taskData) => {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  // Get single task
  getTask: async (projectId, taskId) => {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  // Update task
  updateTask: async (projectId, taskId, taskData) => {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
    return response.data;
  },

  // Delete task
  deleteTask: async (projectId, taskId) => {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  // Update task status (for drag & drop)
  updateTaskStatus: async (projectId, taskId, status, position) => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, {
      status,
      position
    });
    return response.data;
  }
};

export default taskService;