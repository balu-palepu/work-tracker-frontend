import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, GitBranch } from 'lucide-react';
import WorkItemIcon from '../shared/WorkItemIcon';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const HierarchyRow = ({ task, level, children, onOpen, onEdit, workflowStatuses }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children && children.length > 0;

  const statusDef = useMemo(() => {
    return workflowStatuses?.find(s => s.id === task.status);
  }, [task.status, workflowStatuses]);

  const statusLabel = statusDef?.label || task.status;
  const statusColor = statusDef?.color || '#6B7280';

  return (
    <>
      <tr className="hover:bg-blue-50/40 border-b border-gray-100 group transition-colors">
        {/* Expand + Type + Title */}
        <td className="py-2 px-3">
          <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
            {/* Tree line indicator */}
            {level > 0 && (
              <span className="w-3 h-px bg-gray-300 mr-1 flex-shrink-0" />
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-0.5 mr-1.5 rounded transition-colors flex-shrink-0 ${
                hasChildren
                  ? 'hover:bg-gray-200 text-gray-500'
                  : 'text-transparent cursor-default'
              }`}
              disabled={!hasChildren}
            >
              {hasChildren ? (
                expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <span className="w-3.5 h-3.5 inline-block" />
              )}
            </button>
            <WorkItemIcon type={task.workItemType} size="sm" className="mr-2 flex-shrink-0" />
            <button
              onClick={() => onOpen(task._id)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate text-left transition-colors"
            >
              {task.displayId ? <span className="text-xs text-gray-500 mr-2">{task.displayId}</span> : null}
              {task.title}
            </button>
            {hasChildren && (
              <span className="ml-2 text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 flex-shrink-0">
                {children.length}
              </span>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="py-2 px-3">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: statusColor }}
          >
            {statusLabel}
          </span>
        </td>

        {/* Priority */}
        <td className="py-2 px-3">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
            {task.priority}
          </span>
        </td>

        {/* Assignee */}
        <td className="py-2 px-3">
          {task.assignedTo?.name ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 flex-shrink-0">
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 truncate">{task.assignedTo.name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </td>

        {/* Story Points */}
        <td className="py-2 px-3 text-center">
          {task.storyPoints ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
              {task.storyPoints}
            </span>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </td>

        {/* Due Date */}
        <td className="py-2 px-3 hidden sm:table-cell">
          {task.dueDate ? (
            <span className={`text-xs ${new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </td>

        {/* Actions */}
        <td className="py-2 px-3">
          <button
            onClick={() => onEdit(task)}
            className="text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity font-medium"
          >
            Edit
          </button>
        </td>
      </tr>

      {/* Children */}
      {expanded && hasChildren && children.map((child) => (
        <HierarchyRow
          key={child._id}
          task={child}
          level={level + 1}
          children={child._children || []}
          onOpen={onOpen}
          onEdit={onEdit}
          workflowStatuses={workflowStatuses}
        />
      ))}
    </>
  );
};

const HierarchyView = ({ tasks, onOpenTask, onEditTask, onCreateTask, workflowStatuses }) => {
  // Build tree from flat task list
  const tree = useMemo(() => {
    const taskMap = {};
    tasks.forEach(t => { taskMap[t._id] = { ...t, _children: [] }; });

    const roots = [];
    tasks.forEach(t => {
      const node = taskMap[t._id];
      const parentId = typeof t.parentTask === 'object' ? t.parentTask?._id : t.parentTask;
      if (parentId && taskMap[parentId]) {
        taskMap[parentId]._children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [tasks]);

  // Count items with children
  const stats = useMemo(() => {
    let parents = 0;
    tasks.forEach(t => {
      const hasChild = tasks.some(other => {
        const pid = typeof other.parentTask === 'object' ? other.parentTask?._id : other.parentTask;
        return pid === t._id;
      });
      if (hasChild) parents++;
    });
    return { parents, total: tasks.length, roots: tree.length };
  }, [tasks, tree]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <GitBranch className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-lg font-medium">No work items yet</p>
        <p className="text-sm mt-1">Create your first item to see the hierarchy</p>
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Item
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{stats.total} items</span>
          <span className="w-px h-3 bg-gray-300" />
          <span>{stats.roots} root items</span>
          {stats.parents > 0 && (
            <>
              <span className="w-px h-3 bg-gray-300" />
              <span>{stats.parents} with children</span>
            </>
          )}
        </div>
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Title</th>
              <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">Status</th>
              <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-24">Priority</th>
              <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-36">Assignee</th>
              <th className="py-2.5 px-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-14">SP</th>
              <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-20 hidden sm:table-cell">Due</th>
              <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-14"></th>
            </tr>
          </thead>
          <tbody>
            {tree.map((task) => (
              <HierarchyRow
                key={task._id}
                task={task}
                level={0}
                children={task._children}
                onOpen={onOpenTask}
                onEdit={onEditTask}
                workflowStatuses={workflowStatuses}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HierarchyView;
