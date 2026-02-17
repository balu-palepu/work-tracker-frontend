import React, { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart,
} from 'recharts';

const BurndownChart = ({ data }) => {
  if (!data || !data.actual || !data.ideal) {
    return null;
  }

  const { actual, ideal, metrics } = data;

  const chartData = useMemo(() => {
    return ideal.map((point, index) => {
      const actualPoint = actual[index];
      const date = new Date(point.date);
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        ideal: point.remainingPoints,
        actual: actualPoint ? actualPoint.remainingPoints : undefined,
      };
    });
  }, [ideal, actual]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-gray-900">Sprint Burndown</h2>
        </div>
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed #3B82F6' }} />
            <span className="text-gray-500">Ideal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 bg-green-500/30 rounded-sm border border-green-500" />
            <span className="text-gray-500">Actual</span>
          </div>
        </div>
      </div>

      {/* Compact Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-blue-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-blue-900">{metrics.totalStoryPoints}</p>
        </div>
        <div className="bg-green-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">Done</p>
          <p className="text-lg font-bold text-green-900">{metrics.completedStoryPoints}</p>
        </div>
        <div className="bg-orange-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-orange-600 font-medium uppercase tracking-wide">Progress</p>
          <p className="text-lg font-bold text-orange-900">{metrics.progress}%</p>
        </div>
        <div className={`rounded-lg px-3 py-2 ${metrics.isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className={`text-[10px] font-medium uppercase tracking-wide ${metrics.isOverdue ? 'text-red-600' : 'text-gray-500'}`}>Days Left</p>
          <p className={`text-lg font-bold ${metrics.isOverdue ? 'text-red-900' : 'text-gray-900'}`}>{metrics.daysRemaining}</p>
        </div>
      </div>

      {/* Recharts Burndown */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.15}
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="ideal"
            name="Ideal"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {metrics.isOverdue && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <span className="font-medium">Sprint is overdue!</span> Consider completing the sprint or extending the timeline.
          </p>
        </div>
      )}
    </div>
  );
};

export default BurndownChart;
