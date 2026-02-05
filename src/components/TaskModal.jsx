import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300' }
];

const TaskModal = ({ isOpen, onClose, onSubmit, initialData, assignees = [] }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    tags: [],
    assignedTo: user?._id || null
  });
  const [tagInput, setTagInput] = useState('');
  const [mentionIds, setMentionIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const assigneeOptions = React.useMemo(() => {
    const options = [...assignees];
    if (initialData?.assignedTo && !options.some((member) => member._id === initialData.assignedTo._id)) {
      options.push(initialData.assignedTo);
    }
    return options;
  }, [assignees, initialData]);

  const findMemberIdByTag = (tag, options) => {
    if (!tag || !tag.startsWith('@')) return null;
    const name = tag.slice(1).trim().toLowerCase();
    if (!name) return null;
    const match = options.find((member) => member.name?.toLowerCase() === name);
    return match?._id || null;
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        tags: initialData.tags || [],
        assignedTo: initialData.assignedTo?._id || user?._id || null
      });
      setMentionIds([]);
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        tags: [],
        assignedTo: user?._id || null
      });
      setTagInput('');
      setMentionIds([]);
    }
  }, [initialData, isOpen, user]);

  useEffect(() => {
    if (!formData.tags.length) {
      setMentionIds([]);
      return;
    }
    const tagMentions = formData.tags
      .map((tag) => findMemberIdByTag(tag, assigneeOptions))
      .filter(Boolean);
    const uniqueMentions = Array.from(new Set(tagMentions));
    setMentionIds(uniqueMentions);
  }, [formData.tags, assigneeOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        assignedTo: formData.assignedTo || null,
        mentions: mentionIds
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    const nextTag = tagInput.trim();
    if (nextTag && !formData.tags.includes(nextTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, nextTag]
      });
      const mentionId = findMemberIdByTag(nextTag, assigneeOptions);
      if (mentionId) {
        setMentionIds((prev) => (prev.includes(mentionId) ? prev : [...prev, mentionId]));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const mentionId = findMemberIdByTag(tagToRemove, assigneeOptions);
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
    if (mentionId) {
      setMentionIds((prev) => prev.filter((id) => id !== mentionId));
    }
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const mentionOptions = React.useMemo(() => {
    const query = tagInput.trim().toLowerCase();
    if (!query.startsWith('@')) return [];
    const search = query.slice(1);
    return assigneeOptions
      .filter((member) => member.name?.toLowerCase().includes(search))
      .slice(0, 6);
  }, [tagInput, assigneeOptions]);

  const handleAddMention = (member) => {
    const mentionTag = `@${member.name}`;
    if (!formData.tags.includes(mentionTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, mentionTag]
      });
    }
    setMentionIds((prev) => (prev.includes(member._id) ? prev : [...prev, member._id]));
    setTagInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Task Title"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter Task Description"
              rows={4}
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                style={{ height: '42px' }}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a tag or type @ to mention"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Add
              </button>
            </div>
            {mentionOptions.length > 0 && (
              <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden">
                {mentionOptions.map((member) => (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => handleAddMention(member)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    @{member.name}
                  </button>
                ))}
              </div>
            )}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <select
              value={formData.assignedTo || ''}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              style={{ height: '42px' }}
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
