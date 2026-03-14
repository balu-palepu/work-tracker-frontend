import React, { useState, useRef, useCallback } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';

const FILTER_FIELDS = [
  { id: 'workItemType', label: 'Type', type: 'select' },
  { id: 'status', label: 'Status', type: 'select' },
  { id: 'priority', label: 'Priority', type: 'select' },
  { id: 'assignedTo', label: 'Assignee', type: 'select' },
  { id: 'tags', label: 'Tags', type: 'text' },
  { id: 'dueDate', label: 'Due Before', type: 'date' },
];

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const TYPE_OPTIONS = [
  { value: 'epic', label: 'Epic' },
  { value: 'feature', label: 'Feature' },
  { value: 'story', label: 'Story' },
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'subtask', label: 'Subtask' },
];

const FilterBar = ({ filters, onFiltersChange, assignees = [], workflowStatuses = [] }) => {
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [savedViews, setSavedViews] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('project_saved_views') || '[]');
    } catch {
      return [];
    }
  });
  const [showSavedViews, setShowSavedViews] = useState(false);
  const [viewName, setViewName] = useState('');

  const addFilterRef = useRef(null);
  const savedViewsRef = useRef(null);
  useClickOutside(addFilterRef, useCallback(() => setShowAddFilter(false), []));
  useClickOutside(savedViewsRef, useCallback(() => setShowSavedViews(false), []));

  const activeFilters = filters || [];

  const getFieldOptions = (fieldId) => {
    if (fieldId === 'workItemType') return TYPE_OPTIONS;
    if (fieldId === 'priority') return PRIORITY_OPTIONS;
    if (fieldId === 'status') return workflowStatuses.map((s) => ({ value: s.id, label: s.label }));
    if (fieldId === 'assignedTo') return assignees.map((a) => ({ value: a._id, label: a.name }));
    return [];
  };

  const addFilter = (fieldId) => {
    if (activeFilters.some((f) => f.field === fieldId)) return;
    onFiltersChange([...activeFilters, { field: fieldId, value: '' }]);
    setShowAddFilter(false);
  };

  const updateFilter = (index, value) => {
    onFiltersChange(activeFilters.map((f, i) => (i === index ? { ...f, value } : f)));
  };

  const removeFilter = (index) => onFiltersChange(activeFilters.filter((_, i) => i !== index));

  const clearAll = () => onFiltersChange([]);

  const saveView = () => {
    const name = viewName.trim();
    if (!name) return;
    const updated = [...savedViews, { name, filters: activeFilters }];
    setSavedViews(updated);
    localStorage.setItem('project_saved_views', JSON.stringify(updated));
    setViewName('');
  };

  const loadView = (view) => {
    onFiltersChange(view.filters || []);
    setShowSavedViews(false);
  };

  const deleteView = (index) => {
    const updated = savedViews.filter((_, i) => i !== index);
    setSavedViews(updated);
    localStorage.setItem('project_saved_views', JSON.stringify(updated));
  };

  const availableFields = FILTER_FIELDS.filter((f) => !activeFilters.some((af) => af.field === f.id));

  return (
    <div className="flex flex-wrap items-center gap-2 py-1">

      {activeFilters.map((filter, index) => {
        const fieldDef = FILTER_FIELDS.find((f) => f.id === filter.field);
        const options = getFieldOptions(filter.field);
        return (
          <div key={`${filter.field}-${index}`} className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
            <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100">{fieldDef?.label || filter.field}</span>
            {fieldDef?.type === 'select' ? (
              <select
                value={filter.value}
                onChange={(e) => updateFilter(index, e.target.value)}
                className="px-2 py-1 text-xs border-0 bg-transparent focus:ring-0 text-blue-800"
              >
                <option value="">Any</option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : fieldDef?.type === 'date' ? (
              <input
                type="date"
                value={filter.value}
                onChange={(e) => updateFilter(index, e.target.value)}
                className="px-2 py-1 text-xs border-0 bg-transparent focus:ring-0 text-blue-800"
              />
            ) : (
              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(index, e.target.value)}
                placeholder="Enter Tags"
                className="px-2 py-1 text-xs border-0 bg-transparent focus:ring-0 w-24 text-blue-800"
              />
            )}
            <button onClick={() => removeFilter(index)} className="px-1.5 py-1 hover:bg-blue-100">
              <X className="w-3 h-3 text-blue-500" />
            </button>
          </div>
        );
      })}

      {/* {availableFields.length > 0 && (
        <div className="relative" ref={addFilterRef}>
          <button onClick={() => setShowAddFilter((v) => !v)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            + Filter
          </button>
          {showAddFilter && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px]">
              {availableFields.map((field) => (
                <button key={field.id} onClick={() => addFilter(field.id)} className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  {field.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )} */}

      {activeFilters.length > 0 && (
        <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Clear all</button>
      )}

      {(activeFilters.length > 0 || savedViews.length > 0) && <div className="w-px h-5 bg-gray-200 mx-1" />}

      {activeFilters.length > 0 && (
        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveView()}
            placeholder="Save as view"
            className="px-2 py-1 text-xs border border-gray-200 rounded-lg w-28"
          />
          <button onClick={saveView} disabled={!viewName.trim()} className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30">
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {savedViews.length > 0 && (
        <div className="relative" ref={savedViewsRef}>
          <button onClick={() => setShowSavedViews((v) => !v)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
            Saved Views
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSavedViews && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
              {savedViews.map((view, index) => (
                <div key={`${view.name}-${index}`} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                  <button onClick={() => loadView(view)} className="text-sm text-gray-700 flex-1 text-left">{view.name}</button>
                  <button onClick={() => deleteView(index)} className="p-0.5 text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const applyFilters = (tasks, filters) => {
  if (!filters || filters.length === 0) return tasks;

  return tasks.filter((task) =>
    filters.every((filter) => {
      if (!filter.value) return true;
      if (filter.field === 'workItemType') return task.workItemType === filter.value;
      if (filter.field === 'status') return task.status === filter.value;
      if (filter.field === 'priority') return task.priority === filter.value;
      if (filter.field === 'assignedTo') return task.assignedTo?._id === filter.value || task.assignedTo === filter.value;
      if (filter.field === 'tags') {
        const value = String(filter.value).toLowerCase();
        return (task.tags || []).some((tag) => String(tag).toLowerCase().includes(value));
      }
      if (filter.field === 'dueDate') {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) <= new Date(filter.value);
      }
      return true;
    })
  );
};

export default FilterBar;
