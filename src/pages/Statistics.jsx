import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { toast } from 'react-toastify';
import activityService from '../services/activityService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, CheckCircle, BarChart3 } from 'lucide-react';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Prepare data for charts
  const hoursPerDay = activities.map((activity) => ({
    date: format(new Date(activity.date), 'MMM d'),
    hours: activity.totalWorkHours,
    productivity: activity.productivity,
  }));

  const taskStatusData = Object.entries(stats.tasksByStatus || {}).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const taskCategoryData = Object.entries(stats.tasksByCategory || {}).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  const moodData = Object.entries(stats.moodDistribution || {}).map(([mood, count]) => ({
    name: mood,
    value: count,
  }));

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
          <p className="text-gray-600 mt-1">Insights into your work patterns</p>
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

      {!stats ? (
        <div className="card text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Not enough data to show statistics</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalDays}</p>
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
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalHours.toFixed(1)}</p>
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
                    {stats.avgHoursPerDay?.toFixed(1) || '0.0'}
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
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.avgProductivity}/10</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

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
                  <span className="font-semibold text-gray-900">{stats.totalMeetings}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Total Tasks</span>
                  <span className="font-semibold text-gray-900">{stats.totalTasks}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Avg Tasks/Day</span>
                  <span className="font-semibold text-gray-900">
                    {stats.totalDays > 0 ? (stats.totalTasks / stats.totalDays).toFixed(1) : '0'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Distribution</h3>
              {moodData.length > 0 ? (
                <div className="space-y-3">
                  {moodData.map((mood, index) => {
                    const percentage = (mood.value / stats.totalDays) * 100;
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
      )}
    </div>
  );
};

export default Statistics;
