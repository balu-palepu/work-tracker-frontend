import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronsLeft, X } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import projectMemberService from '../services/projectMemberService';
import sprintService from '../services/sprintService';
import WorkItemIcon, { WORK_ITEM_TYPES, getWorkItemConfig } from '../components/shared/WorkItemIcon';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

// Hierarchy rules: which types can be parents for a given type
const PARENT_RULES = {
  subtask: ['task', 'story', 'feature', 'epic'],
  task: ['story', 'feature', 'epic'],
  bug: ['story', 'feature', 'epic'],
  story: ['feature', 'epic'],
  feature: ['epic'],
  epic: [],
};
const PARENT_REQUIRED_TYPES = ['subtask'];

const toDateInputValue = (dateLike) => {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const clampDateToRange = (value, minValue, maxValue) => {
  if (!value) return value;
  if (minValue && value < minValue) return minValue;
  if (maxValue && value > maxValue) return maxValue;
  return value;
};

const TaskCreatePage = () => {
  const { teamId, projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const sprintQueryParam = searchParams.get('sprint');
  const forceBacklogMode = sprintQueryParam === 'none' || sprintQueryParam === 'backlog';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [sprints, setSprints] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workItemType: searchParams.get('type') || 'task',
    priority: 'medium',
    status: '',
    assignedTo: '',
    storyPoints: '',
    parentTask: searchParams.get('parentTask') || '',
    startDate: '',
    dueDate: '',
    tags: [],
    sprint: forceBacklogMode ? '' : (sprintQueryParam || ''),
  });
  const [tagInput, setTagInput] = useState('');

  const effectiveTeamId = teamId || currentTeam?._id;
  const navigateToProjectPage = () => {
    if (effectiveTeamId && projectId) {
      navigate(`/teams/${effectiveTeamId}/projects/${projectId}`);
      return;
    }
    navigate('/teams');
  };

  const selectedSprint = useMemo(() => {
    if (!formData.sprint) return null;
    return sprints.find((sprint) => sprint._id === formData.sprint) || null;
  }, [formData.sprint, sprints]);

  const sprintStartDate = selectedSprint ? toDateInputValue(selectedSprint.startDate) : '';
  const sprintEndDate = selectedSprint ? toDateInputValue(selectedSprint.endDate) : '';

  useEffect(() => {
    if (effectiveTeamId && projectId) {
      fetchData();
    }
  }, [effectiveTeamId, projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectRes, membersRes, tasksRes] = await Promise.all([
        projectService.getProject(effectiveTeamId, projectId),
        projectMemberService.getProjectMembers(effectiveTeamId, projectId),
        taskService.getProjectTasks(effectiveTeamId, projectId),
      ]);
      const sprintRes = await sprintService.getSprints(effectiveTeamId, projectId, { limit: 200 });

      const proj = projectRes.data || projectRes;
      setProjectData(proj);

      const members = membersRes.success ? (membersRes.data || []) : (Array.isArray(membersRes) ? membersRes : []);
      setAssignees(members.map((pm) => pm.user || pm).filter(Boolean));

      const tasks = tasksRes.data || tasksRes || [];
      setAllTasks(Array.isArray(tasks) ? tasks : []);

      const sprintList = Array.isArray(sprintRes?.data) ? sprintRes.data : (Array.isArray(sprintRes) ? sprintRes : []);
      setSprints(sprintList);
      const activeSprint = sprintList.find((sprint) => sprint.status === 'active');

      // Set default status from workflow
      const statuses = proj?.workflowStatuses || proj?.workflow?.workflowStatuses || proj?.settings?.workflowStatuses || [];
      const defaultStatus = statuses.length > 0 ? statuses.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0]?.id : 'new';
      setFormData((prev) => ({
        ...prev,
        status: prev.status || defaultStatus || 'new',
        assignedTo: prev.assignedTo || user?._id || '',
        sprint: prev.sprint || (forceBacklogMode ? '' : (activeSprint?._id || '')),
      }));
    } catch (error) {
      toast.error('Error loading project data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const workflowStatuses = useMemo(() => {
    const statuses = projectData?.workflowStatuses || projectData?.workflow?.workflowStatuses || projectData?.settings?.workflowStatuses;
    if (Array.isArray(statuses) && statuses.length > 0) {
      return [...statuses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return [
      { id: 'new', label: 'New', category: 'todo', color: '#6B7280', order: 0 },
      { id: 'active', label: 'Active', category: 'inprogress', color: '#3B82F6', order: 1 },
      { id: 'resolved', label: 'Resolved', category: 'completed', color: '#10B981', order: 2 },
      { id: 'closed', label: 'Closed', category: 'completed', color: '#6B7280', order: 3 },
    ];
  }, [projectData]);

  const availableTypes = useMemo(() => {
    const types = projectData?.workItemTypes;
    if (Array.isArray(types) && types.length > 0) {
      return WORK_ITEM_TYPES.filter((t) => types.includes(t.value));
    }
    return WORK_ITEM_TYPES;
  }, [projectData]);

  // Filter parent tasks based on hierarchy rules
  const eligibleParentTasks = useMemo(() => {
    const allowedParentTypes = PARENT_RULES[formData.workItemType] || [];
    if (allowedParentTypes.length === 0) return [];
    return allTasks.filter((t) => allowedParentTypes.includes(t.workItemType || 'task'));
  }, [allTasks, formData.workItemType]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset parent task if type changes and current parent is no longer eligible
      if (field === 'workItemType') {
        const allowedParentTypes = PARENT_RULES[value] || [];
        if (updated.parentTask) {
          const parentTask = allTasks.find((t) => t._id === updated.parentTask);
          if (parentTask && !allowedParentTypes.includes(parentTask.workItemType || 'task')) {
            updated.parentTask = '';
          }
        }
      }

      if (field === 'sprint') {
        const sprint = sprints.find((item) => item._id === value);
        if (sprint) {
          const minDate = toDateInputValue(sprint.startDate);
          const maxDate = toDateInputValue(sprint.endDate);
          updated.startDate = clampDateToRange(updated.startDate || minDate, minDate, maxDate);
          updated.dueDate = clampDateToRange(updated.dueDate || maxDate, minDate, maxDate);
        }
      }

      if ((field === 'startDate' || field === 'dueDate') && selectedSprint) {
        updated[field] = clampDateToRange(value, sprintStartDate, sprintEndDate);
      }

      return updated;
    });
  };

  useEffect(() => {
    if (!selectedSprint) return;
    setFormData((prev) => {
      const nextStart = clampDateToRange(prev.startDate || sprintStartDate, sprintStartDate, sprintEndDate);
      const nextDue = clampDateToRange(prev.dueDate || sprintEndDate, sprintStartDate, sprintEndDate);
      if (nextStart === prev.startDate && nextDue === prev.dueDate) return prev;
      return { ...prev, startDate: nextStart, dueDate: nextDue };
    });
  }, [selectedSprint, sprintStartDate, sprintEndDate]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const mentionOptions = useMemo(() => {
    const query = tagInput.trim().toLowerCase();
    if (!query.startsWith('@')) return [];
    const search = query.slice(1);
    return assignees.filter((m) => m.name?.toLowerCase().includes(search)).slice(0, 6);
  }, [tagInput, assignees]);

  const handleAddMention = (member) => {
    const mentionTag = `@${member.name}`;
    if (!formData.tags.includes(mentionTag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, mentionTag] }));
    }
    setTagInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (PARENT_REQUIRED_TYPES.includes(formData.workItemType) && !formData.parentTask) {
      toast.error(`A parent item is required for ${formData.workItemType} work items.`);
      return;
    }

    setSubmitting(true);
    try {
      const mentionIds = formData.tags
        .filter((t) => t.startsWith('@'))
        .map((t) => {
          const name = t.slice(1).toLowerCase();
          const match = assignees.find((m) => m.name?.toLowerCase() === name);
          return match?._id;
        })
        .filter(Boolean);

      const payload = {
        title: formData.title,
        description: formData.description,
        workItemType: formData.workItemType,
        priority: formData.priority,
        status: formData.status,
        assignedTo: formData.assignedTo || null,
        storyPoints: formData.storyPoints ? Number(formData.storyPoints) : undefined,
        parentTask: formData.parentTask || undefined,
        startDate: formData.startDate || undefined,
        dueDate: formData.dueDate || undefined,
        tags: formData.tags,
        mentions: mentionIds,
        sprint: formData.sprint || undefined,
      };

      if (payload.sprint && sprintStartDate && sprintEndDate) {
        payload.startDate = clampDateToRange(payload.startDate || sprintStartDate, sprintStartDate, sprintEndDate);
        payload.dueDate = clampDateToRange(payload.dueDate || sprintEndDate, sprintStartDate, sprintEndDate);
      }

      await taskService.createTask(effectiveTeamId, projectId, payload);
      toast.success('Work item created successfully!');
      navigateToProjectPage();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating work item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <button
          onClick={navigateToProjectPage}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronsLeft className="w-4 h-4 mr-1" />
          Back to Project
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Create Work Item</h1>
            <p className="text-sm text-gray-500 mt-1">{projectData?.name || 'Project'}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Work Item Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleChange('workItemType', type.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                      formData.workItemType === type.value
                        ? `${type.bg} ${type.color} border-current`
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <WorkItemIcon type={type.value} size="sm" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter title"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe the work item"
                rows={4}
              />
            </div>

            {/* Parent Task */}
            {PARENT_RULES[formData.workItemType]?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Item {PARENT_REQUIRED_TYPES.includes(formData.workItemType) && <span className="text-red-500">*</span>}
              </label>
              <select
                value={formData.parentTask}
                onChange={(e) => handleChange('parentTask', e.target.value)}
                required={PARENT_REQUIRED_TYPES.includes(formData.workItemType)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                  PARENT_REQUIRED_TYPES.includes(formData.workItemType) && !formData.parentTask
                    ? 'border-red-300'
                    : 'border-gray-300'
                }`}
              >
                <option value="" disabled={PARENT_REQUIRED_TYPES.includes(formData.workItemType)}>
                  {PARENT_REQUIRED_TYPES.includes(formData.workItemType)
                    ? 'Select a parent item (required)'
                    : 'None (Top-level item)'}
                </option>
                {eligibleParentTasks.map((task) => {
                  const config = getWorkItemConfig(task.workItemType);
                  return (
                    <option key={task._id} value={task._id}>
                      [{config.label}] {task.title}
                    </option>
                  );
                })}
              </select>
              {PARENT_REQUIRED_TYPES.includes(formData.workItemType) && eligibleParentTasks.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  No eligible parent items available. Create a higher-level work item first.
                </p>
              )}
              {PARENT_REQUIRED_TYPES.includes(formData.workItemType) && !formData.parentTask && eligibleParentTasks.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  A parent item is required for {formData.workItemType} work items.
                </p>
              )}
            </div>
            )}

            {/* Two-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sprint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sprint</label>
                <select
                  value={formData.sprint}
                  onChange={(e) => handleChange('sprint', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">No Sprint (Backlog)</option>
                  {sprints.map((sprint) => (
                    <option key={sprint._id} value={sprint._id}>
                      {sprint.name} ({sprint.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {workflowStatuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">Unassigned</option>
                  {assignees.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Story Points</label>
                <input
                  type="number"
                  value={formData.storyPoints}
                  onChange={(e) => handleChange('storyPoints', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={sprintStartDate || undefined}
                  max={sprintEndDate || undefined}
                />
                {selectedSprint && (
                  <p className="text-xs text-gray-500 mt-1">
                    Date locked to sprint range: {sprintStartDate} to {sprintEndDate}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={sprintStartDate || undefined}
                  max={sprintEndDate || undefined}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
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
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={navigateToProjectPage}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Work Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskCreatePage;
