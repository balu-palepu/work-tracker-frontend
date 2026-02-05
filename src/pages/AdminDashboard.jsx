import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import adminService from '../services/adminService';
import ProjectManagerView from '../components/admin/ProjectManagerView';
import Pagination from '../components/shared/Pagination';
import {
  Users,
  FolderKanban,
  CheckCircle,
  Clock,
  Activity,
  AlertCircle,
  Award,
  ArrowRight
} from 'lucide-react';

const AdminDashboard = () => {
  const { teamId } = useParams();
  const { loading: teamLoading, isAdmin, isProjectManager } = useTeam();
  const [dashboard, setDashboard] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('all');
  const todayIso = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(todayIso);
  const [dateTo, setDateTo] = useState(todayIso);
  const [detailActivity, setDetailActivity] = useState(null);
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 10;
  const [totalActivities, setTotalActivities] = useState(0);
  const [totalActivityPages, setTotalActivityPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const activitySummary = useMemo(() => {
    return {
      entries: totalActivities,
      users: 0 // Backend doesn't return unique users count
    };
  }, [totalActivities]);

  useEffect(() => {
    fetchDashboard();
  }, [teamId]);

  useEffect(() => {
    fetchActivityFeed();
  }, [teamId, selectedMember, dateFrom, dateTo, activityPage]);

  useEffect(() => {
    setActivityPage(1);
  }, [selectedMember, dateFrom, dateTo]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, membersResponse] = await Promise.all([
        adminService.getDashboard(teamId),
        adminService.getTeamMembers(teamId)
      ]);

      if (dashboardResponse.success) {
        setDashboard(dashboardResponse.data);
      }

      if (membersResponse.success) {
        const members = (membersResponse.data || [])
          .map((member) => member.user)
          .filter(Boolean);
        setTeamMembers(Array.isArray(members) ? members : []);
      } else {
        setTeamMembers([]);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
      } else {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const params = {
        page: activityPage,
        limit: activityPageSize,
        sortBy: 'date',
        sortOrder: 'desc'
      };
      if (selectedMember !== 'all') params.userId = selectedMember;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const response = await adminService.getActivityFeed(teamId, params);
      if (response.success) {
        const activities = response.data?.activities;
        setActivityFeed(Array.isArray(activities) ? activities : []);
        setTotalActivities(response.total || 0);
        setTotalActivityPages(response.totalPages || 1);
      } else {
        setActivityFeed([]);
        setTotalActivities(0);
        setTotalActivityPages(1);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
      } else {
        setError(err.response?.data?.message || 'Failed to load activity feed');
      }
    }
  };

  const handleActivityPageChange = (page) => {
    setActivityPage(page);
  };

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

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

  // Show Manager View for Managers (not full admins)
  if (isProjectManager() && !isAdmin()) {
    return <ProjectManagerView />;
  }

  // Show full admin dashboard for admins
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Team overview and management</p>
        </div>

        {/* Analytics Summary */}
        {/* {!analyticsLoading && analytics && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Analytics Summary</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</p>
                    {analytics.completionRateTrend !== 0 && (
                      <span className={`flex items-center text-sm font-medium ${
                        analytics.completionRateTrend > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analytics.completionRateTrend > 0 ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                        {Math.abs(analytics.completionRateTrend)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-gray-600 font-medium">Avg. Speed of tasks</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageVelocity}</p>
                  <p className="text-xs text-gray-500">pts/sprint</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <p className="text-sm text-gray-600 font-medium">Active Members</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.activeMembers}/{analytics.totalMembers}
                  </p>
                  <p className="text-xs text-gray-500">this week</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <p className="text-sm text-gray-600 font-medium">Avg. Duration</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.averageTaskDuration}</p>
                  <p className="text-xs text-gray-500">days</p>
                </div>
              </div>

              {analytics.statusDistribution && Object.keys(analytics.statusDistribution).length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart className="h-4 w-4 text-gray-700" />
                    <h3 className="text-sm font-semibold text-gray-900">Task Status Distribution</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(analytics.statusDistribution).map(([status, count]) => (
                      <div key={status} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                        <p className="text-lg font-bold text-gray-900">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analytics.projectDistribution && analytics.projectDistribution.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Projects by Task Count</h3>
                  <div className="space-y-2">
                    {analytics.projectDistribution.slice(0, 3).map((project, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{project.name}</span>
                            <span className="text-sm text-gray-600">{project.taskCount} tasks</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full"
                              style={{ width: `${project.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )} */}

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total Members */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboard?.stats?.totalMembers || 0}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Link
              to={`/teams/${teamId}/members`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block flex items-center gap-2"
            >
              View or Manage Members <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {dashboard?.stats?.totalProjects || 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FolderKanban className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Link
              to={`/teams/${teamId}/projects`}
              className="text-sm text-green-600 hover:text-green-800 font-medium mt-4 inline-block flex items-center gap-2"
            >
              View or Manage Projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* <Link
            to={`/teams/${teamId}/members`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Members</h3>
                <p className="text-sm text-gray-600">Add or remove team members</p>
              </div>
            </div>
          </Link> */}

          <Link
            to={`/teams/${teamId}/bandwidth`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Bandwidth Reports</h3>
                <p className="text-sm text-gray-600">Review resource allocation and bandwidth availability</p>
              </div>
            </div>
          </Link>

          {/* <Link
            to={`/teams/${teamId}/admin/analytics`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 rounded-full p-3">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Team Analytics</h3>
                <p className="text-sm text-gray-600">View detailed insights</p>
              </div>
            </div>
          </Link> */}
        </div>

        {/* Daily Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Team Members Activity</h2>
              <span className="text-sm text-gray-500">
                Total Entries: {activitySummary.entries}
                {/* {activitySummary.users} users */}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Member</span>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-44"
                >
                  <option value="all">All Members</option>
                  {teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="p-6">
            {activityFeed.length > 0 ? (
              <div className="space-y-4">
                {activityFeed.map((activity) => (
                  <div
                    key={activity._id}
                    onClick={() => setDetailActivity(activity)}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-2"
                  >
                    <div className="bg-gray-100 rounded-full p-2 mt-1">
                      <Activity className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {activity.user?.name || 'Unknown User'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.date || activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>{activity.totalWorkHours || 0} hrs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <span>{activity.meetings?.length || 0} meetings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span>{activity.tasks?.length || 0} tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No daily activity yet</p>
            )}
          </div>

          {/* Activity Pagination */}
          {totalActivityPages > 1 && (
            <Pagination
              currentPage={activityPage}
              totalPages={totalActivityPages}
              totalItems={totalActivities}
              pageSize={activityPageSize}
              onPageChange={handleActivityPageChange}
            />
          )}
        </div>

        {/* Top Contributors */}
        {dashboard?.topContributors && dashboard.topContributors.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Top Contributors</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboard.topContributors.map((contributor, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                      <Award className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{contributor.name}</p>
                      <p className="text-sm text-gray-500">
                        {contributor.tasksCompleted} tasks completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {contributor.completionRate}%
                      </p>
                      <p className="text-xs text-gray-500">completion rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {detailActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {detailActivity.user?.name || 'User'} •{' '}
                  {new Date(detailActivity.date || detailActivity.createdAt).toLocaleDateString()}
                </h3>
                <p className="text-sm text-gray-500">
                  {detailActivity.totalWorkHours || 0} hours worked
                </p>
              </div>
              <button
                onClick={() => setDetailActivity(null)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Tasks</h4>
                {detailActivity.tasks && detailActivity.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {detailActivity.tasks.map((task, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-xs text-gray-500">
                          {task.timeSpent || 0} mins • {task.status || 'in-progress'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No tasks logged.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Meetings</h4>
                {detailActivity.meetings && detailActivity.meetings.length > 0 ? (
                  <div className="space-y-2">
                    {detailActivity.meetings.map((meeting, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{meeting.title}</div>
                        <div className="text-xs text-gray-500">{meeting.duration || 0} mins</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No meetings logged.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Extra Activities</h4>
                {detailActivity.extraActivities && detailActivity.extraActivities.length > 0 ? (
                  <div className="space-y-2">
                    {detailActivity.extraActivities.map((extra, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{extra.title}</div>
                        <div className="text-xs text-gray-500">{extra.duration || 0} mins</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No extra activities logged.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
