import api from './api';

const projectCatalogService = {
  getCatalog: async (teamId, params = {}) => {
    const response = await api.get(`/teams/${teamId}/catalog`, { params });
    return response.data;
  },

  getCatalogEntry: async (teamId, entryId) => {
    const response = await api.get(`/teams/${teamId}/catalog/${entryId}`);
    return response.data;
  },

  createCatalogEntry: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/catalog`, data);
    return response.data;
  },

  updateCatalogEntry: async (teamId, entryId, data) => {
    const response = await api.put(`/teams/${teamId}/catalog/${entryId}`, data);
    return response.data;
  },

  deleteCatalogEntry: async (teamId, entryId) => {
    const response = await api.delete(`/teams/${teamId}/catalog/${entryId}`);
    return response.data;
  },
};

export default projectCatalogService;
