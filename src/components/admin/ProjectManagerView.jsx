import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import {
  Users,
  FolderKanban,
  CheckCircle,
  Clock,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ProjectManagerView = () => {
  const { teamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});

  useEffect(() => {
    fetchData();
  }, [teamId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getProjectManagerView(teamId);
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Overview</h1>
          <p className="text-gray-600 mt-2">Your direct reports and project teams</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Direct Reports</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data?.summary?.directReportsCount || 0}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data?.summary?.projectsCount || 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FolderKanban className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Team Size</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {data?.summary?.totalTeamSize || 0}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Direct Reports Section */}
        {data?.directReports && data.directReports.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Direct Reports</h2>
              <p className="text-sm text-gray-600 mt-1">Team members reporting to you</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.directReports.map((report) => (
                  <div
                    key={report._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.user.name}</h3>
                        <p className="text-sm text-gray-600">{report.user.email}</p>
                        <span className="inline-flex items-center px-2 py-1 mt-2 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {report.role}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Tasks</p>
                        <p className="text-lg font-bold text-gray-900">
                          {report.stats.assignedTasks}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Completed</p>
                        <p className="text-lg font-bold text-green-600">
                          {report.stats.completedTasks}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Rate</p>
                        <p className="text-lg font-bold text-blue-600">
                          {report.stats.completionRate}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                      <Activity className="h-4 w-4" />
                      <span>{report.stats.recentActivities} activities this week</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Section */}
        {data?.projects && data.projects.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
              <p className="text-sm text-gray-600 mt-1">Projects you're leading with team members</p>
            </div>
            <div className="p-6 space-y-4">
              {data.projects.map((projectData) => (
                <div
                  key={projectData.project._id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Project Header */}
                  <div
                    className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleProject(projectData.project._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: projectData.project.color + '20' }}
                        >
                          <FolderKanban
                            className="w-5 h-5"
                            style={{ color: projectData.project.color }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {projectData.project.name}
                          </h3>
                          {projectData.project.description && (
                            <p className="text-sm text-gray-600">
                              {projectData.project.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-600" />
                            <span className="text-gray-600">{projectData.stats.memberCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">
                              {projectData.stats.completedTasks}/{projectData.stats.totalTasks}
                            </span>
                          </div>
                        </div>
                        {expandedProjects[projectData.project._id] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Project Members (Expandable) */}
                  {expandedProjects[projectData.project._id] && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Team Members</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projectData.members.map((member, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{member.user.name}</p>
                                <p className="text-xs text-gray-600">{member.user.email}</p>
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {member.role}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                              <span>{member.stats.assignedTasks} tasks</span>
                              <span className="text-green-600 font-medium">
                                {member.stats.completedTasks} done
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!data?.directReports || data.directReports.length === 0) &&
          (!data?.projects || data.projects.length === 0) && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Data</h3>
              <p className="text-gray-600">
                You don't have any direct reports or project teams assigned yet.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default ProjectManagerView;
