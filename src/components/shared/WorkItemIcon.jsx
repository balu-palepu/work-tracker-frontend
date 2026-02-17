import React from 'react';
import { Bug, Gem, Zap, BookOpen, CheckSquare, GitBranch } from 'lucide-react';

const WORK_ITEM_CONFIG = {
  epic: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-400', label: 'Epic' },
  feature: { icon: Gem, color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-400', label: 'Feature' },
  story: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-400', label: 'Story' },
  task: { icon: CheckSquare, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-400', label: 'Task' },
  bug: { icon: Bug, color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-400', label: 'Bug' },
  subtask: { icon: GitBranch, color: 'text-teal-500', bg: 'bg-teal-100', border: 'border-teal-400', label: 'Subtask' },
};

export const getWorkItemConfig = (type) => {
  return WORK_ITEM_CONFIG[type] || WORK_ITEM_CONFIG.task;
};

export const WORK_ITEM_TYPES = Object.entries(WORK_ITEM_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  color: config.color,
  bg: config.bg,
}));

const WorkItemIcon = ({ type, size = 'sm', showLabel = false, className = '' }) => {
  const config = getWorkItemConfig(type);
  const IconComponent = config.icon;

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <IconComponent className={`${sizeClasses[size]} ${config.color}`} />
      {showLabel && (
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      )}
    </span>
  );
};

export default WorkItemIcon;
