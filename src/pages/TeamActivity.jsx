import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import adminService from '../services/adminService';
import teamService from '../services/teamService';
import { AlertCircle, ArrowLeft, Clock, Users, CheckCircle, ChevronsLeft } from 'lucide-react';

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const getUserId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id || null;
};

const getReportingManagerId = (member) => (
  getUserId(member?.reportingManager)
  || getUserId(member?.reportingManagerId)
  || getUserId(member?.user?.reportingManager)
  || getUserId(member?.user?.reportingManagerId)
);

const getMemberUserId = (member) => (
  getUserId(member?.user) || getUserId(member)
);

const getMemberName = (member) => (
  member?.user?.name || member?.name || 'Member'
);

const extractMembers = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.members)) return response.members;
  if (Array.isArray(response?.data?.members)) return response.data.members;
  return [];
};

const TeamActivity = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, isAdmin, teamMembership } = useTeam();

  const todayIso = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(todayIso);
  const [dateTo, setDateTo] = useState(todayIso);
  const [activities, setActivities] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailActivity, setDetailActivity] = useState(null);

  const isTeamAdmin = typeof isAdmin === 'function' ? isAdmin() : false;

  useEffect(() => {
    if (!currentTeam) return;
    loadMembers();
  }, [currentTeam]);

  useEffect(() => {
    if (!currentTeam) return;
    fetchActivities();
  }, [currentTeam, selectedMember, dateFrom, dateTo]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeamMembers(currentTeam._id, { limit: 1000 });
      setTeamMembers(extractMembers(response));
    } catch (err) {
      console.error('Error loading team members:', err);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const directReportMembers = useMemo(() => {
    if (!user?._id) return [];
    return teamMembers.filter((member) => {
      const managerId = getReportingManagerId(member);
      return managerId === user._id;
    });
  }, [teamMembers, user]);

  const isManagerRole = normalizeRole(teamMembership?.role) === 'manager';

  const canView = useMemo(() => {
    if (isTeamAdmin) return true;
    if (isManagerRole) return true;
    return directReportMembers.length > 0;
  }, [isTeamAdmin, isManagerRole, directReportMembers]);

  const allowedUserIds = useMemo(() => {
    if (isTeamAdmin) {
      return new Set(teamMembers.map(getMemberUserId).filter(Boolean));
    }
    return new Set(directReportMembers.map(getMemberUserId).filter(Boolean));
  }, [isTeamAdmin, teamMembers, directReportMembers]);

  const filteredMembers = useMemo(() => {
    if (isTeamAdmin) return teamMembers;
    return directReportMembers;
  }, [isTeamAdmin, teamMembers, directReportMembers]);

  useEffect(() => {
    if (selectedMember === 'all') return;
    const isValidSelection = filteredMembers.some(
      (member) => getMemberUserId(member) === selectedMember
    );
    if (!isValidSelection) {
      setSelectedMember('all');
    }
  }, [filteredMembers, selectedMember]);

  const fetchActivities = async () => {
    if (!currentTeam) return;
    if (!canView) {
      setActivities([]);
      return;
    }

    try {
      setLoading(true);
      const params = {};
      if (selectedMember !== 'all') params.userId = selectedMember;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const response = await adminService.getActivityFeed(currentTeam._id, params);
      if (response.success) {
        const data = response.data?.activities || [];
        const scoped = data.filter((activity) =>
          allowedUserIds.has(activity.user?._id || activity.user)
        );
        setActivities(scoped);
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error('Error loading activity feed:', err);
      setError(err.response?.data?.message || 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  if (!currentTeam) {
    return null;
  }

  if (!canView) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/teams/${teamId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronsLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Team Activity</h2>
              <span className="text-sm text-gray-500">
                {activities.length} entries
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Members</option>
                  {filteredMembers.map((member) => (
                    <option key={getMemberUserId(member)} value={getMemberUserId(member)}>
                      {getMemberName(member)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : activities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No daily activity yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Work Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meetings
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activities.map((activity) => (
                      <tr
                        key={activity._id}
                        onClick={() => setDetailActivity(activity)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {activity.user?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {new Date(activity.date || activity.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {activity.totalWorkHours || 0} hrs
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {activity.meetings?.length || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {activity.tasks?.length || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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

export default TeamActivity;
