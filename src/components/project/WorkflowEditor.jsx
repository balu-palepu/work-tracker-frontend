import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import BaseModal from '../shared/BaseModal';
import projectService from '../../services/projectService';
import { toast } from 'react-toastify';

const CATEGORY_OPTIONS = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-700' },
  { value: 'inprogress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
];

const STATUS_COLORS = [
  '#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

const WorkflowEditor = ({ isOpen, onClose, teamId, projectId, currentStatuses = [], onSave }) => {
  const [statuses, setStatuses] = useState(() =>
    currentStatuses.length > 0
      ? currentStatuses.map((s, i) => ({ ...s, order: s.order ?? i }))
      : [
          { id: 'todo', label: 'To Do', category: 'todo', color: '#6B7280', order: 0 },
          { id: 'inprogress', label: 'In Progress', category: 'inprogress', color: '#3B82F6', order: 1 },
          { id: 'resolved', label: 'Completed/Closed', category: 'completed', color: '#10B981', order: 2 },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addStatus = () => {
    const newId = `status_${Date.now()}`;
    setStatuses([...statuses, {
      id: newId,
      label: '',
      category: 'todo',
      color: STATUS_COLORS[statuses.length % STATUS_COLORS.length],
      order: statuses.length,
    }]);
  };

  const removeStatus = (index) => {
    if (statuses.length <= 3) {
      setError('Must have at least 3 statuses (one per category)');
      return;
    }
    const updated = statuses.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }));
    setStatuses(updated);
    setError('');
  };

  const updateStatus = (index, field, value) => {
    const updated = statuses.map((s, i) =>
      i === index ? { ...s, [field]: value, id: field === 'label' && !s.id.startsWith('status_') ? s.id : (field === 'label' ? value.toLowerCase().replace(/\s+/g, '_') : s.id) } : s
    );
    setStatuses(updated);
    setError('');
  };

  const moveStatus = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= statuses.length) return;
    const updated = [...statuses];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setStatuses(updated.map((s, i) => ({ ...s, order: i })));
  };

  const validate = () => {
    const categories = new Set(statuses.map(s => s.category));
    if (!categories.has('todo') || !categories.has('inprogress') || !categories.has('completed')) {
      return 'Each category (To Do, In Progress, Completed) must have at least one status';
    }
    if (statuses.some(s => !s.label.trim())) {
      return 'All statuses must have a label';
    }
    const ids = statuses.map(s => s.id);
    if (new Set(ids).size !== ids.length) {
      return 'Status IDs must be unique. Change duplicate labels.';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await projectService.updateWorkflow(teamId, projectId, {
        workflowStatuses: statuses,
      });
      toast.success('Workflow updated successfully');
      onSave?.(statuses);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Workflow Editor" size="lg">
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-500">
          Configure the statuses for your project board. Each status belongs to a category that determines its column grouping.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Status List */}
        <div className="space-y-2">
          {statuses.map((status, index) => (
            <div key={status.id + index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {/* Reorder */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveStatus(index, -1)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Color */}
              <input
                type="color"
                value={status.color}
                onChange={(e) => updateStatus(index, 'color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />

              {/* Label */}
              <input
                type="text"
                value={status.label}
                onChange={(e) => updateStatus(index, 'label', e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Status name"
              />

              {/* Category */}
              <select
                value={status.category}
                onChange={(e) => updateStatus(index, 'category', e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeStatus(index)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Status */}
        <button
          type="button"
          onClick={addStatus}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Status
        </button>

        {/* Category Legend */}
        <div className="flex gap-3 pt-2">
          {CATEGORY_OPTIONS.map((cat) => {
            const count = statuses.filter(s => s.category === cat.value).length;
            return (
              <span key={cat.value} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                {cat.label}: {count}
              </span>
            );
          })}
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 mr-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default WorkflowEditor;
