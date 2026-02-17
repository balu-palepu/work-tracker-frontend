import api from './api';

const newsletterService = {
  getNewsletters: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/newsletters`, { params });
    return response.data;
  },

  getNewsletter: async (teamId, newsletterId) => {
    const response = await api.get(`/teams/${teamId}/newsletters/${newsletterId}`);
    return response.data;
  },

  createNewsletter: async (teamId, payload) => {
    const response = await api.post(`/teams/${teamId}/newsletters`, payload);
    return response.data;
  },

  updateNewsletter: async (teamId, newsletterId, payload) => {
    const response = await api.put(`/teams/${teamId}/newsletters/${newsletterId}`, payload);
    return response.data;
  },

  deleteNewsletter: async (teamId, newsletterId) => {
    const response = await api.delete(`/teams/${teamId}/newsletters/${newsletterId}`);
    return response.data;
  },
};

export default newsletterService;
