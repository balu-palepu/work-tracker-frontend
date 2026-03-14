import React, { useMemo } from 'react';
import { Play, Plus, Target, Users, AlertTriangle } from 'lucide-react';
import { getWorkItemConfig } from '../shared/WorkItemIcon';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-700',
};

const SprintPlanningView = ({ sprint, tasks, onStartSprint, onNavigateToTask, onNavigateToCreate }) => {
  const committedSP = sprint?.metrics?.totalStoryPoints || tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const capacity = sprint?.capacity || 0;
  const overCapacity = capacity > 0 && committedSP > capacity;
  const capacityPercent = capacity > 0 ? (committedSP / capacity) * 100 : 0;

  const assigneeSummary = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      const key = task.assignedTo?._id || 'unassigned';
      const name = task.assignedTo?.name || 'Unassigned';
      if (!map[key]) map[key] = { name, points: 0, count: 0 };
      map[key].points += task.storyPoints || 0;
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => b.points - a.points);
  }, [tasks]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Capacity Gauge */}
      {capacity > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Capacity Planning</h3>
            </div>
            <span className={`text-sm font-medium ${overCapacity ? 'text-red-600' : 'text-gray-600'}`}>
              {committedSP} / {capacity} SP committed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${overCapacity ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          {overCapacity && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <p className="text-xs text-red-600 font-medium">Over capacity by {committedSP - capacity} SP</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Sprint Items ({tasks.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={onNavigateToCreate}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
                <button
                  onClick={onStartSprint}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Sprint
                </button>
              </div>
            </div>
            {tasks.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                <Target className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No items in this sprint yet</p>
                <p className="text-xs text-gray-400 mt-1">Add items from the backlog to start planning</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => onNavigateToTask(task._id)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    {(() => { const cfg = getWorkItemConfig(task.workItemType); return <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>; })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-400 truncate">{task.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                      {task.priority || 'medium'}
                    </span>
                    {task.storyPoints > 0 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                        {task.storyPoints} SP
                      </span>
                    )}
                    {task.assignedTo ? (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                        {task.assignedTo.name?.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-gray-400">?</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Team Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Team Load</h3>
            </div>
            {assigneeSummary.length === 0 ? (
              <p className="text-xs text-gray-400">No tasks assigned yet</p>
            ) : (
              <div className="space-y-2">
                {assigneeSummary.map((member) => (
                  <div key={member.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                        member.name === 'Unassigned' ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                      }`}>
                        {member.name === 'Unassigned' ? '?' : member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-700">{member.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-gray-900">{member.points} SP</span>
                      <span className="text-[10px] text-gray-400 ml-1">({member.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Sprint Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Items</span>
                <span className="font-semibold text-gray-900">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Story Points</span>
                <span className="font-semibold text-gray-900">{committedSP}</span>
              </div>
              {capacity > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacity</span>
                  <span className="font-semibold text-gray-900">{capacity}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Unestimated</span>
                <span className="font-semibold text-orange-600">{tasks.filter(t => !t.storyPoints).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unassigned</span>
                <span className="font-semibold text-orange-600">{tasks.filter(t => !t.assignedTo).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintPlanningView;
