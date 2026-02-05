import React from 'react';
import { Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';

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

const TaskCard = ({ task, isDragging, onEdit, onDelete, onOpen }) => {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      onClick={() => onOpen && onOpen()}
      className={`
        bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200 
        hover:shadow-md transition-all cursor-move group
        ${isDragging ? 'shadow-2xl rotate-3 scale-105' : ''}
      `}
    >
      {/* Priority Badge */}
      <div className="flex items-start justify-between mb-3">
        <span className={`
          inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
          ${priority.bg} ${priority.color} ${priority.border} border
        `}>
          <span>{priority.label}</span>
        </span>

        {/* Action Buttons */}
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this task?')) {
                onDelete();
              }
            }}
            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {/* Due Date */}
        {task.dueDate && (
          <div className={`
            flex items-center space-x-1
            ${isOverdue ? 'text-red-600' : 'text-gray-500'}
          `}>
            {isOverdue ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            <span className="font-medium">{formatDate(task.dueDate)}</span>
          </div>
        )}

        {/* Assigned To */}
        {task.assignedTo && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
              {task.assignedTo.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard
