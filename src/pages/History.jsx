import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { toast } from 'react-toastify';
import activityService from '../services/activityService';
import { useTeam } from '../context/TeamContext';
import { Calendar, Clock, Users, CheckCircle, User, UsersRound } from 'lucide-react';

const History = () => {
  const { isAdmin, isProjectManager, currentTeam } = useTeam();
  const canViewTeam = isAdmin() || isProjectManager();

  const [activeTab, setActiveTab] = useState('self');
  const [activities, setActivities] = useState([]);
  const [teamActivities, setTeamActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Filters
  const [dateRange, setDateRange] = useState('30');
  const [selectedMember, setSelectedMember] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (activeTab === 'self') {
      fetchActivities();
    } else if (activeTab === 'team' && canViewTeam && currentTeam) {
      fetchTeamActivities();
    }
  }, [activeTab, dateRange, selectedMember, currentTeam]);

  useEffect(() => {
    if (canViewTeam && currentTeam) {
      fetchTeamMembers();
    }
  }, [currentTeam]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      const response = await activityService.getActivities({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        limit: 50
      });
      setActivities(response.data || []);
    } catch (error) {
      toast.error('Error loading activities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamActivities = async () => {
    if (!currentTeam?._id) return;
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      const params = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        limit: 100
      };

      if (selectedMember) {
        params.userId = selectedMember;
      }

      const response = await activityService.getTeamHistory(currentTeam._id, params);
      setTeamActivities(response.data || []);
    } catch (error) {
      toast.error('Error loading team activities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    // Extract unique members from team activities or use admin service
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 90);
      const response = await activityService.getTeamHistory(currentTeam._id, {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        limit: 200
      });

      const members = [];
      const seen = new Set();
      (response.data || []).forEach(activity => {
        if (activity.user && !seen.has(activity.user._id)) {
          seen.add(activity.user._id);
          members.push(activity.user);
        }
      });
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      blocked: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const currentActivities = activeTab === 'self' ? activities : teamActivities;

  const renderActivityList = () => (
    <div className="lg:col-span-1 space-y-3">
      {currentActivities.map((activity) => (
        <div
          key={activity._id}
          onClick={() => setSelectedActivity(activity)}
          className={`card cursor-pointer transition-all hover:shadow-md ${
            selectedActivity?._id === activity._id ? 'ring-2 ring-primary-500' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">
                {format(new Date(activity.date), 'MMM d, yyyy')}
              </h3>
              {activeTab === 'team' && activity.user && (
                <p className="text-sm text-gray-500">{activity.user.name}</p>
              )}
            </div>
            <span className="text-sm font-medium text-primary-600">
              {activity.totalWorkHours}h
            </span>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{activity.meetings?.length || 0} meetings</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>{activity.tasks?.length || 0} tasks</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderActivityDetails = () => (
    <div className="lg:col-span-2">
      {selectedActivity ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {format(new Date(selectedActivity.date), 'EEEE, MMMM d, yyyy')}
            </h2>
            {activeTab === 'team' && selectedActivity.user && (
              <p className="text-lg text-gray-600 mb-2">{selectedActivity.user.name}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{selectedActivity.totalWorkHours} hours</span>
              </div>
              <span>|</span>
              <span>Productivity: {selectedActivity.productivity}/10</span>
              <span>|</span>
              <span>Mood: {selectedActivity.mood}</span>
            </div>
          </div>

          {/* Meetings */}
          {selectedActivity.meetings?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary-600" />
                <span>Meetings ({selectedActivity.meetings.length})</span>
              </h3>
              <div className="space-y-4">
                {selectedActivity.meetings.map((meeting, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                      <span className="text-sm text-gray-600">{meeting.duration} min</span>
                    </div>
                    {meeting.summary && (
                      <p className="text-gray-600 text-sm">{meeting.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {selectedActivity.tasks?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary-600" />
                <span>Tasks ({selectedActivity.tasks.length})</span>
              </h3>
              <div className="space-y-4">
                {selectedActivity.tasks.map((task, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{task.title}</h4>
                      <span className="text-sm text-gray-600">{task.timeSpent} min</span>
                    </div>
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="badge badge-info">{task.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra Activities */}
          {selectedActivity.extraActivities?.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Extra Activities ({selectedActivity.extraActivities.length})
              </h3>
              <div className="space-y-4">
                {selectedActivity.extraActivities.map((extra, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{extra.title}</h4>
                      <span className="text-sm text-gray-600">{extra.duration} min</span>
                    </div>
                    {extra.description && (
                      <p className="text-gray-600 text-sm mb-2">{extra.description}</p>
                    )}
                    <span className="badge badge-info">{extra.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedActivity.notes && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedActivity.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600">Select an activity to view details</p>
        </div>
      )}
    </div>
  );

  if (loading && currentActivities.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
        <p className="text-gray-600 mt-1">
          {canViewTeam ? 'View your and team members\' past activities' : 'View your past work activities'}
        </p>
      </div>

      {/* Tabs for Admin/Manager */}
      {canViewTeam && (
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => { setActiveTab('self'); setSelectedActivity(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'self'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4" />
              My History
            </button>
            <button
              onClick={() => { setActiveTab('team'); setSelectedActivity(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'team'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UsersRound className="h-4 w-4" />
              Team History
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="input-field w-auto"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>

        {activeTab === 'team' && teamMembers.length > 0 && (
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Team Members</option>
            {teamMembers.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {currentActivities.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {activeTab === 'self' ? 'No activities recorded yet' : 'No team activities found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderActivityList()}
          {renderActivityDetails()}
        </div>
      )}
    </div>
  );
};

export default History;
