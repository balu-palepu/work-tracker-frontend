import api from './api';

const announcementService = {
  getAnnouncements: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/announcements`, { params });
    return response.data;
  },

  createAnnouncement: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/announcements`, data);
    return response.data;
  },

  updateAnnouncement: async (teamId, id, data) => {
    const response = await api.put(`/teams/${teamId}/announcements/${id}`, data);
    return response.data;
  },

  deleteAnnouncement: async (teamId, id) => {
    const response = await api.delete(`/teams/${teamId}/announcements/${id}`);
    return response.data;
  },

  pinAnnouncement: async (teamId, id) => {
    const response = await api.post(`/teams/${teamId}/announcements/${id}/pin`);
    return response.data;
  },
};

export default announcementService;
