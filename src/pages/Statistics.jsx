import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { toast } from 'react-toastify';
import activityService from '../services/activityService';
import { useTeam } from '../context/TeamContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, CheckCircle, BarChart3, User, UsersRound, GitCompare } from 'lucide-react';

const Statistics = () => {
  const { isAdmin, isProjectManager, currentTeam } = useTeam();
  const canViewTeam = isAdmin() || isProjectManager();

  const [activeTab, setActiveTab] = useState('self');
  const [stats, setStats] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [teamActivities, setTeamActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  useEffect(() => {
    if (activeTab === 'self') {
      fetchData();
    } else if (activeTab === 'team' && canViewTeam && currentTeam) {
      fetchTeamData();
    } else if (activeTab === 'comparison' && canViewTeam && currentTeam) {
      fetchComparisonData();
    }
  }, [activeTab, dateRange, currentTeam]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      const [statsResponse, activitiesResponse] = await Promise.all([
        activityService.getStats({
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        }),
        activityService.getActivities({
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          limit: 100,
        }),
      ]);

      setStats(statsResponse.data);
      setActivities(activitiesResponse.data || []);
    } catch (error) {
      toast.error('Error loading statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      const [statsResponse, activitiesResponse] = await Promise.all([
        activityService.getTeamStats(currentTeam._id, {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        }),
        activityService.getTeamHistory(currentTeam._id, {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          limit: 200,
        }),
      ]);

      setTeamStats(statsResponse.data);
      setTeamActivities(activitiesResponse.data || []);
    } catch (error) {
      toast.error('Error loading team statistics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    if (!currentTeam?._id) return;
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));

      const response = await activityService.getMemberComparison(currentTeam._id, {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });

      setComparisonData(response.data);
    } catch (error) {
      toast.error('Error loading comparison data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentStats = activeTab === 'self' ? stats : teamStats;
  const currentActivities = activeTab === 'self' ? activities : teamActivities;

  // Prepare data for charts
  const hoursPerDay = currentActivities.map((activity) => ({
    date: format(new Date(activity.date), 'MMM d'),
    hours: activity.totalWorkHours,
    productivity: activity.productivity,
    name: activity.user?.name || 'You',
  }));

  const taskStatusData = currentStats ? Object.entries(currentStats.tasksByStatus || {}).map(([status, count]) => ({
    name: status,
    value: count,
  })) : [];

  const taskCategoryData = currentStats ? Object.entries(currentStats.tasksByCategory || {}).map(([category, count]) => ({
    name: category,
    value: count,
  })) : [];

  const moodData = currentStats ? Object.entries(currentStats.moodDistribution || {}).map(([mood, count]) => ({
    name: mood,
    value: count,
  })) : [];

  const renderSummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Days</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{currentStats?.totalDays || 0}</p>
          </div>
          <div className="p-3 bg-primary-100 rounded-lg">
            <CheckCircle className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Hours</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{(currentStats?.totalHours || 0).toFixed(1)}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Hours/Day</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {currentStats?.avgHoursPerDay?.toFixed(1) || '0.0'}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Productivity</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{currentStats?.avgProductivity || 0}/10</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCharts = () => (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Per Day Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Hours Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hoursPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hours" stroke="#0ea5e9" strokeWidth={2} name="Hours" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity Trend Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hoursPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="productivity" fill="#10b981" name="Productivity" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
          {taskStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No task data available</p>
          )}
        </div>

        {/* Task Category Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Categories</h3>
          {taskCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No category data available</p>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting & Task Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Total Meetings</span>
              <span className="font-semibold text-gray-900">{currentStats?.totalMeetings || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-600">Total Tasks</span>
              <span className="font-semibold text-gray-900">{currentStats?.totalTasks || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Avg Tasks/Day</span>
              <span className="font-semibold text-gray-900">
                {currentStats?.totalDays > 0 ? (currentStats?.totalTasks / currentStats?.totalDays).toFixed(1) : '0'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h3>
          {moodData.length > 0 ? (
            <div className="space-y-3">
              {moodData.map((mood, index) => {
                const percentage = currentStats?.totalDays > 0 ? (mood.value / currentStats.totalDays) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 capitalize">{mood.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {mood.value} days ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No mood data available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderComparison = () => {
    if (!comparisonData) return null;

    const { members, teamAverages } = comparisonData;

    // Prepare comparison chart data
    const hoursComparisonData = members.map((m) => ({
      name: m.name.split(' ')[0],
      hours: m.stats.totalHours,
      avgHours: m.stats.avgHoursPerDay,
    }));

    const productivityComparisonData = members.map((m) => ({
      name: m.name.split(' ')[0],
      productivity: m.stats.avgProductivity,
      teamAvg: teamAverages.avgProductivity,
    }));

    const completionComparisonData = members.map((m) => ({
      name: m.name.split(' ')[0],
      rate: m.stats.taskCompletionRate,
      teamAvg: teamAverages.avgTaskCompletionRate,
    }));

    return (
      <div className="space-y-6">
        {/* Team Averages Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <h4 className="text-sm font-medium text-blue-800">Team Avg Hours/Day</h4>
            <p className="text-3xl font-bold text-blue-900 mt-2">{teamAverages.avgHoursPerDay}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <h4 className="text-sm font-medium text-green-800">Team Avg Productivity</h4>
            <p className="text-3xl font-bold text-green-900 mt-2">{teamAverages.avgProductivity}/10</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <h4 className="text-sm font-medium text-purple-800">Team Task Completion</h4>
            <p className="text-3xl font-bold text-purple-900 mt-2">{teamAverages.avgTaskCompletionRate}%</p>
          </div>
        </div>

        {/* Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Total Hours Comparison */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Hours by Member</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hoursComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#0ea5e9" name="Total Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Productivity Comparison */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productivityComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="productivity" fill="#10b981" name="Productivity" />
                <Bar dataKey="teamAvg" fill="#9ca3af" name="Team Avg" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Task Completion Rate */}
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Rate (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={completionComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="rate" fill="#8b5cf6" name="Completion Rate %" />
                <Bar dataKey="teamAvg" fill="#9ca3af" name="Team Avg %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Details Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Member</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Active Days</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Total Hours</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Avg Hrs/Day</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Tasks</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Completion</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Productivity</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr key={member.userId} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-600">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-gray-900">{member.stats.activeDays}</td>
                    <td className="text-right py-3 px-4 text-sm text-gray-900">{member.stats.totalHours}</td>
                    <td className="text-right py-3 px-4 text-sm text-gray-900">{member.stats.avgHoursPerDay}</td>
                    <td className="text-right py-3 px-4 text-sm text-gray-900">
                      {member.stats.completedTasks}/{member.stats.totalTasks}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        member.stats.taskCompletionRate >= 80
                          ? 'bg-green-100 text-green-800'
                          : member.stats.taskCompletionRate >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.stats.taskCompletionRate}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-sm text-gray-900">{member.stats.avgProductivity}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-1">
            {canViewTeam ? 'Insights into your and team work patterns' : 'Insights into your work patterns'}
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="input-field w-auto"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Tabs for Admin/Manager */}
      {canViewTeam && (
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('self')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'self'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4" />
              My Statistics
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'team'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UsersRound className="h-4 w-4" />
              Team Statistics
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GitCompare className="h-4 w-4" />
              Comparison
            </button>
          </div>
        </div>
      )}

      {activeTab === 'comparison' ? (
        comparisonData ? (
          renderComparison()
        ) : (
          <div className="card text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No comparison data available</p>
          </div>
        )
      ) : !currentStats ? (
        <div className="card text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Not enough data to show statistics</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderSummaryCards()}
          {renderCharts()}
        </div>
      )}
    </div>
  );
};

export default Statistics;
