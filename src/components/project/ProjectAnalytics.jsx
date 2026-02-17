import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity, Clock, CheckCircle2 } from 'lucide-react';
import projectService from '../../services/projectService';

const TYPE_COLORS = {
  epic: '#F97316',
  feature: '#8B5CF6',
  story: '#3B82F6',
  task: '#6B7280',
  bug: '#EF4444',
  subtask: '#14B8A6',
};

const PRIORITY_COLORS_MAP = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#10B981',
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </div>
);

const ProjectAnalytics = ({ teamId, projectId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId && projectId) loadAnalytics();
  }, [teamId, projectId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjectAnalytics(teamId, projectId);
      const payload = response?.data && !Array.isArray(response.data) ? response.data : response;
      setAnalytics(payload || null);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>Unable to load analytics</p>
      </div>
    );
  }

  const typeData = Object.entries(analytics.typeCounts || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: TYPE_COLORS[name] || '#6B7280',
  }));

  const priorityData = Object.entries(analytics.priorityCounts || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: PRIORITY_COLORS_MAP[name] || '#6B7280',
  }));

  const statusData = Object.entries(analytics.statusCounts || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    value,
  }));

  const velocityData = analytics.velocity || [];

  return (
    <div className="space-y-6 p-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Items" value={analytics.totalTasks} color="bg-blue-500" />
        <StatCard icon={CheckCircle2} label="Completed" value={analytics.completedTasks} color="bg-green-500" />
        <StatCard icon={Clock} label="Avg Cycle Time" value={`${analytics.avgCycleTime}d`} color="bg-yellow-500" />
        <StatCard icon={TrendingUp} label="Types" value={Object.keys(analytics.typeCounts || {}).length} color="bg-purple-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Chart */}
        {velocityData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sprint Velocity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completedPoints" name="Completed SP" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalPoints" name="Total SP" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Distribution */}
        {statusData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Items by Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" name="Count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Item Types */}
        {typeData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Work Item Types</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Priority Breakdown */}
        {priorityData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Priority Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectAnalytics;
