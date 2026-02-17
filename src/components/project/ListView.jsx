import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Plus } from 'lucide-react';

const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

const ListView = ({ tasks, onOpenTask, onEditTask, onCreateTask, onStatusChange, workflowStatuses }) => {
  const [sortField, setSortField] = useState('title');
  const [sortDir, setSortDir] = useState('asc');

  const normalizeStatus = (status) => {
    if (status === 'new') return 'todo';
    if (status === 'active') return 'inprogress';
    if (status === 'closed') return 'resolved';
    return status;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const arr = [...tasks];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = (a.title || '').localeCompare(b.title || '');
          break;
        case 'workItemType':
          cmp = (a.workItemType || 'task').localeCompare(b.workItemType || 'task');
          break;
        case 'status':
          cmp = (normalizeStatus(a.status) || '').localeCompare(normalizeStatus(b.status) || '');
          break;
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case 'assignedTo':
          cmp = (a.assignedTo?.name || '').localeCompare(b.assignedTo?.name || '');
          break;
        case 'storyPoints':
          cmp = (a.storyPoints || 0) - (b.storyPoints || 0);
          break;
        case 'dueDate':
          cmp = new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
          break;
        default:
          cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [tasks, sortField, sortDir]);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-600" />
      : <ArrowDown className="w-3 h-3 text-blue-600" />;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">No work items yet</p>
        <p className="text-sm mt-1">Create your first item to get started</p>
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">Work Items</h3>
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Work Item
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                { field: 'workItemType', label: 'Type', width: 'w-44' },
                { field: 'title', label: 'Title', width: '' },
                { field: 'status', label: 'Status', width: 'w-28' },
                { field: 'priority', label: 'Priority', width: 'w-24' },
                { field: 'assignedTo', label: 'Assignee', width: 'w-36' },
                { field: 'storyPoints', label: 'SP', width: 'w-16' },
                { field: 'dueDate', label: 'Due Date', width: 'w-28' },
              ].map(col => (
                <th
                  key={col.field}
                  onClick={() => handleSort(col.field)}
                  className={`py-3 px-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 ${col.width}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon field={col.field} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(task => {
              const normalizedStatus = normalizeStatus(task.status);
              const statusDef = workflowStatuses?.find(s => s.id === normalizedStatus);
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

              return (
                <tr key={task._id} className="hover:bg-gray-50 border-b border-gray-100 group">
                  <td className="py-2.5 px-3">
                    <span className="text-xs font-medium text-gray-700 capitalize">
                      {task.workItemType === 'story' ? 'User Story' : (task.workItemType || 'task')}
                      {task.displayId ? ' - ' : ''}
                      {task.displayId ? <span className="text-blue-600 font-semibold">{task.displayId}</span> : null}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => onOpenTask(task._id)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate max-w-sm block text-left"
                    >
                      {task.title}
                    </button>
                  </td>
                  <td className="py-2.5 px-3">
                    {onStatusChange && workflowStatuses?.length > 0 ? (
                      <select
                        value={normalizedStatus}
                        onChange={(e) => onStatusChange(task._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white focus:ring-1 focus:ring-blue-500"
                      >
                        {workflowStatuses.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: statusDef?.color || '#6B7280' }}
                      >
                        {statusDef?.label || task.status}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-sm text-gray-600">
                    {task.assignedTo?.name || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-gray-600 text-center">
                    {task.storyPoints || '-'}
                  </td>
                  <td className={`py-2.5 px-3 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {formatDate(task.dueDate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListView;
