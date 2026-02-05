import api from './api';

const notificationService = {
  // Get notifications
  getNotifications: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/notifications`, { params });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (teamId, notificationId) => {
    const response = await api.put(`/teams/${teamId}/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (teamId) => {
    const response = await api.put(`/teams/${teamId}/notifications/mark-all-read`);
    return response.data;
  },

  // Delete notification
  deleteNotification: async (teamId, notificationId) => {
    const response = await api.delete(`/teams/${teamId}/notifications/${notificationId}`);
    return response.data;
  }
};

export default notificationService;
