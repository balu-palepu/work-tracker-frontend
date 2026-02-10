import api from './api';

/**
 * Helper function to download a file from a blob response
 */
const downloadFile = (data, filename, contentType = 'text/csv') => {
  const blob = new Blob([data], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Extract filename from Content-Disposition header
 */
const getFilenameFromResponse = (response, defaultName) => {
  const contentDisposition = response.headers['content-disposition'];
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
    if (match) return match[1];
  }
  return defaultName;
};

const reportService = {
  /**
   * Download team info report (Admin only)
   * @param {string} teamId - Team ID
   */
  downloadTeamInfo: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/reports/team-info`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, `team_info_${new Date().toISOString().split('T')[0]}.csv`);
    downloadFile(response.data, filename);
  },

  /**
   * Download activity report
   * @param {string} teamId - Team ID
   * @param {Object} options - Filter options
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {string} options.userId - Specific user ID (optional)
   * @param {string} options.period - Period: 'daily', 'weekly', 'monthly', 'yearly'
   */
  downloadActivityReport: async (teamId, options = {}) => {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.userId) params.append('userId', options.userId);
    if (options.period) params.append('period', options.period);

    const response = await api.get(`/teams/${teamId}/reports/activity?${params.toString()}`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, `activity_report_${options.period || 'daily'}.csv`);
    downloadFile(response.data, filename);
  },

  /**
   * Download my activity report
   * @param {string} teamId - Team ID
   * @param {Object} options - Filter options
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {string} options.period - Period: 'weekly', 'monthly', 'yearly'
   */
  downloadMyActivity: async (teamId, options = {}) => {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.period) params.append('period', options.period);

    const response = await api.get(`/teams/${teamId}/reports/my-activity?${params.toString()}`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, `my_activity_${options.period || 'monthly'}.csv`);
    downloadFile(response.data, filename);
  },

  /**
   * Download bandwidth report
   * @param {string} teamId - Team ID
   * @param {Object} options - Filter options
   * @param {number} options.month - Month (1-12)
   * @param {number} options.year - Year
   * @param {string} options.userId - Specific user ID (optional)
   * @param {string} options.status - Status filter (optional)
   */
  downloadBandwidthReport: async (teamId, options = {}) => {
    const params = new URLSearchParams();
    if (options.month) params.append('month', options.month);
    if (options.year) params.append('year', options.year);
    if (options.userId) params.append('userId', options.userId);
    if (options.status) params.append('status', options.status);

    const response = await api.get(`/teams/${teamId}/reports/bandwidth?${params.toString()}`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, `bandwidth_report_${options.year || 'all'}_${options.month || 'all'}.csv`);
    downloadFile(response.data, filename);
  },

  /**
   * Download team activity summary
   * @param {string} teamId - Team ID
   * @param {Object} options - Filter options
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {string} options.period - Period: 'weekly', 'monthly', 'yearly'
   */
  downloadTeamActivitySummary: async (teamId, options = {}) => {
    const params = new URLSearchParams();
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);
    if (options.period) params.append('period', options.period);

    const response = await api.get(`/teams/${teamId}/reports/team-activity-summary?${params.toString()}`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, `team_activity_summary_${options.period || 'monthly'}.csv`);
    downloadFile(response.data, filename);
  },

  /**
   * Download project report
   * @param {string} teamId - Team ID
   * @param {string} projectId - Specific project ID (optional)
   */
  downloadProjectReport: async (teamId, projectId = null) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);

    const response = await api.get(`/teams/${teamId}/reports/projects?${params.toString()}`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, `project_report.csv`);
    downloadFile(response.data, filename);
  },

  /**
   * Download sprint report
   * @param {string} teamId - Team ID
   * @param {string} projectId - Project ID
   * @param {string} sprintId - Specific sprint ID (optional)
   */
  downloadSprintReport: async (teamId, projectId, sprintId = null) => {
    const params = new URLSearchParams();
    if (sprintId) params.append('sprintId', sprintId);

    const response = await api.get(`/teams/${teamId}/projects/${projectId}/reports/sprints?${params.toString()}`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, `sprint_report.csv`);
    downloadFile(response.data, filename);
  },

  /**
   * Download sprint tasks report
   * @param {string} teamId - Team ID
   * @param {string} projectId - Project ID
   * @param {string} sprintId - Sprint ID
   */
  downloadSprintTasks: async (teamId, projectId, sprintId) => {
    const response = await api.get(`/teams/${teamId}/projects/${projectId}/sprints/${sprintId}/reports/tasks`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, `sprint_tasks.csv`);
    downloadFile(response.data, filename);
  },

  /**
   * Download project tasks report
   * @param {string} teamId - Team ID
   * @param {string} projectId - Project ID
   * @param {boolean} backlogOnly - Download only backlog tasks
   */
  downloadProjectTasks: async (teamId, projectId, backlogOnly = false) => {
    const params = new URLSearchParams();
    if (backlogOnly) params.append('backlogOnly', 'true');

    const response = await api.get(`/teams/${teamId}/projects/${projectId}/reports/tasks?${params.toString()}`, {
      responseType: 'blob',
    });
    const filename = getFilenameFromResponse(response, backlogOnly ? `backlog_tasks.csv` : `project_tasks.csv`);
    downloadFile(response.data, filename);
  },
};

export default reportService;
