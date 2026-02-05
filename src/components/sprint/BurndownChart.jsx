import React from 'react';
import { TrendingDown } from 'lucide-react';

const BurndownChart = ({ data }) => {
  if (!data || !data.actual || !data.ideal) {
    return null;
  }

  const { actual, ideal, metrics } = data;

  // Calculate chart dimensions and scale
  const maxPoints = Math.max(
    ...actual.map(d => d.remainingPoints),
    ...ideal.map(d => d.remainingPoints),
    metrics.totalStoryPoints
  );

  const chartHeight = 300;
  const chartWidth = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  const xScale = (index, total) => {
    const availableWidth = chartWidth - padding.left - padding.right;
    return padding.left + (index / (total - 1)) * availableWidth;
  };

  const yScale = (value) => {
    const availableHeight = chartHeight - padding.top - padding.bottom;
    return padding.top + availableHeight - (value / maxPoints) * availableHeight;
  };

  // Create path for ideal line
  const idealPath = ideal.map((point, index) => {
    const x = xScale(index, ideal.length);
    const y = yScale(point.remainingPoints);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // Create path for actual line
  const actualPath = actual.map((point, index) => {
    const x = xScale(index, ideal.length);
    const y = yScale(point.remainingPoints);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingDown className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Sprint Burndown Chart</h2>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-blue-600 mr-2"></div>
            <span className="text-gray-600">Ideal</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-green-600 mr-2"></div>
            <span className="text-gray-600">Actual</span>
          </div>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Points</p>
          <p className="text-2xl font-bold text-blue-900">{metrics.totalStoryPoints}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-900">{metrics.completedStoryPoints}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Progress</p>
          <p className="text-2xl font-bold text-orange-900">{metrics.progress}%</p>
        </div>
        <div className={`rounded-lg p-4 ${metrics.isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className={`text-sm font-medium ${metrics.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            Days Remaining
          </p>
          <p className={`text-2xl font-bold ${metrics.isOverdue ? 'text-red-900' : 'text-gray-900'}`}>
            {metrics.daysRemaining}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="mx-auto"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = yScale(maxPoints * fraction);
            return (
              <g key={fraction}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-600"
                >
                  {Math.round(maxPoints * fraction)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {ideal.map((point, index) => {
            const x = xScale(index, ideal.length);
            return (
              <text
                key={index}
                x={x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {formatDate(point.date)}
              </text>
            );
          })}

          {/* Ideal line */}
          <path
            d={idealPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Actual line */}
          {actual.length > 0 && (
            <path
              d={actualPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
            />
          )}

          {/* Actual data points */}
          {actual.map((point, index) => {
            const x = xScale(index, ideal.length);
            const y = yScale(point.remainingPoints);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#10b981"
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}

          {/* Axis labels */}
          <text
            x={chartWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            className="text-sm fill-gray-700 font-medium"
          >
            Sprint Days
          </text>
          <text
            x={15}
            y={chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 15, ${chartHeight / 2})`}
            className="text-sm fill-gray-700 font-medium"
          >
            Story Points Remaining
          </text>
        </svg>
      </div>

      {/* Status indicator */}
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
