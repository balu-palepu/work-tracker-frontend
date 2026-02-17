import React from 'react';
import { Calendar, Edit2, Trash2, AlertCircle, GitBranch } from 'lucide-react';
import WorkItemIcon, { getWorkItemConfig } from './shared/WorkItemIcon';

const PRIORITY_CONFIG = {
  low: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Low',
  },
  medium: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Medium',
  },
  high: {
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'High',
  },
  urgent: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Urgent',
  }
};

const TaskCard = ({ task, isDragging, onEdit, onDelete, onOpen, subtaskCount = 0, completedSubtasks = 0, parentTaskTitle }) => {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const workItemConfig = getWorkItemConfig(task.workItemType);

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const subtaskPercent = subtaskCount > 0 ? Math.round((completedSubtasks / subtaskCount) * 100) : 0;

  return (
    <div
      onClick={() => onOpen && onOpen()}
      className={`
        bg-white rounded-xl p-3 shadow-sm border-2 border-gray-200
        hover:shadow-md transition-all cursor-move group
        border-l-4 ${workItemConfig.border}
        ${isDragging ? 'shadow-2xl rotate-3 scale-105' : ''}
      `}
    >
      {/* Type + Priority Badge */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.displayId && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-900 text-white">
              {task.displayId}
            </span>
          )}
          <WorkItemIcon type={task.workItemType} size="sm" />
          <span className={`
            inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold
            ${priority.bg} ${priority.color} ${priority.border} border
          `}>
            {priority.label}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 hover:bg-blue-50 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this task?')) {
                onDelete();
              }
            }}
            className="p-1 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Parent breadcrumb */}
      {parentTaskTitle && (
        <div className="flex items-center gap-1 mb-1 text-[10px] text-gray-400 truncate">
          <GitBranch className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{parentTaskTitle}</span>
        </div>
      )}

      {/* Title */}
      <h4 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 text-sm">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">
          {task.description}
        </p>
      )}

      {/* Subtask progress */}
      {subtaskCount > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: `${subtaskPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
            {completedSubtasks}/{subtaskCount}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Due Date */}
          {task.dueDate && (
            <div className={`
              flex items-center space-x-1
              ${isOverdue ? 'text-red-600' : 'text-gray-500'}
            `}>
              {isOverdue ? (
                <AlertCircle className="w-3.5 h-3.5" />
              ) : (
                <Calendar className="w-3.5 h-3.5" />
              )}
              <span className="font-medium">{formatDate(task.dueDate)}</span>
            </div>
          )}
          {/* Story Points */}
          {task.storyPoints > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">
              {task.storyPoints} SP
            </span>
          )}
        </div>

        {/* Assigned To */}
        {task.assignedTo && (
          <div className="flex items-center space-x-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold">
              {task.assignedTo.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-gray-400 font-medium">+{task.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
