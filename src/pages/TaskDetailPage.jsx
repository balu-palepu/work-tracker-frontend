import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ChevronsLeft, MessageSquare, User, Calendar, Tag, Target,
  Clock, Edit3, Save, XCircle, Trash2, CheckCircle, Plus, ChevronRight,
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import projectMemberService from '../services/projectMemberService';
import WorkItemIcon, { getWorkItemConfig, WORK_ITEM_TYPES } from '../components/shared/WorkItemIcon';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

const TaskDetailPage = () => {
  const { teamId, projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [childTasks, setChildTasks] = useState([]);
  const [ancestry, setAncestry] = useState([]);
  const [taskProgress, setTaskProgress] = useState({ total: 0, completed: 0, percentage: 0 });

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const effectiveTeamId = teamId || currentTeam?._id;
  const navigateToProjectPage = () => {
    if (effectiveTeamId && projectId) {
      navigate(`/teams/${effectiveTeamId}/projects/${projectId}`);
      return;
    }
    navigate('/teams');
  };

  const loadTask = useCallback(async () => {
    try {
      const response = await taskService.getTask(effectiveTeamId, projectId, taskId);
      const taskData = response.data || response;
      setTask(taskData);
      setEditData({
        title: taskData.title || '',
        description: taskData.description || '',
        status: taskData.status || 'new',
        priority: taskData.priority || 'medium',
        assignedTo: taskData.assignedTo?._id || '',
        storyPoints: taskData.storyPoints || '',
        startDate: taskData.startDate ? new Date(taskData.startDate).toISOString().split('T')[0] : '',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
        workItemType: taskData.workItemType || 'task',
        parentTask: typeof taskData.parentTask === 'object' ? taskData.parentTask?._id : taskData.parentTask || '',
      });
    } catch (error) {
      toast.error('Error loading task');
      console.error(error);
    }
  }, [effectiveTeamId, projectId, taskId]);

  useEffect(() => {
    if (effectiveTeamId && projectId && taskId) {
      const fetchAll = async () => {
        setLoading(true);
        try {
          await Promise.all([
            loadTask(),
            projectService.getProject(effectiveTeamId, projectId).then((res) => setProjectData(res.data || res)),
            projectMemberService.getProjectMembers(effectiveTeamId, projectId).then((res) => {
              const members = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
              setAssignees(members.map((pm) => pm.user || pm).filter(Boolean));
            }),
            taskService.getTaskChildren(effectiveTeamId, projectId, taskId)
              .then((res) => setChildTasks(res.data || []))
              .catch(() => setChildTasks([])),
            taskService.getTaskAncestry(effectiveTeamId, projectId, taskId)
              .then((res) => setAncestry(res.data || []))
              .catch(() => setAncestry([])),
            taskService.getTaskProgress(effectiveTeamId, projectId, taskId)
              .then((res) => setTaskProgress(res.data || { total: 0, completed: 0, percentage: 0 }))
              .catch(() => setTaskProgress({ total: 0, completed: 0, percentage: 0 })),
          ]);
        } finally {
          setLoading(false);
        }
      };
      fetchAll();
    }
  }, [effectiveTeamId, projectId, taskId, loadTask]);

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

  const statusDef = useMemo(() => {
    return workflowStatuses.find((s) => s.id === task?.status) || { label: task?.status, color: '#6B7280' };
  }, [task?.status, workflowStatuses]);

  const isCompletedCategory = useMemo(() => {
    const targetStatus = workflowStatuses.find((s) => s.id === editData.status);
    return targetStatus?.category === 'completed';
  }, [editData.status, workflowStatuses]);

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: editData.title,
        description: editData.description,
        status: editData.status,
        priority: editData.priority,
        assignedTo: editData.assignedTo || null,
        storyPoints: editData.storyPoints ? Number(editData.storyPoints) : undefined,
        startDate: editData.startDate || undefined,
        dueDate: editData.dueDate || undefined,
        workItemType: editData.workItemType,
        parentTask: editData.parentTask || undefined,
      };
      const response = await taskService.updateTask(effectiveTeamId, projectId, taskId, payload);
      setTask(response.data || response);
      setIsEditing(false);
      toast.success('Task updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating task');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (task) {
      setEditData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'new',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo?._id || '',
        storyPoints: task.storyPoints || '',
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        workItemType: task.workItemType || 'task',
        parentTask: typeof task.parentTask === 'object' ? task.parentTask?._id : task.parentTask || '',
      });
    }
  };

  const getMentionIdsFromText = (text) => {
    if (!text || !assignees.length) return [];
    const lowerText = text.toLowerCase();
    return assignees
      .filter((m) => m.name && lowerText.includes(`@${m.name.toLowerCase()}`))
      .map((m) => m._id);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const mentions = getMentionIdsFromText(commentText);
      await taskService.addTaskComment(effectiveTeamId, projectId, taskId, {
        text: commentText,
        mentions,
      });
      setCommentText('');
      await loadTask();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Error adding comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await taskService.deleteTask(effectiveTeamId, projectId, taskId);
      toast.success('Task deleted');
      navigateToProjectPage();
    } catch (error) {
      toast.error('Error deleting task');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCompleteClick = () => {
    navigate(`/teams/${effectiveTeamId}/projects/${projectId}/tasks/${taskId}/complete`);
  };

  const commentMentionOptions = useMemo(() => {
    const parts = commentText.trim().split(/\s+/);
    const last = parts[parts.length - 1] || '';
    if (!last.startsWith('@')) return [];
    const query = last.slice(1).toLowerCase();
    if (!query) return [];
    return assignees.filter((m) => m.name?.toLowerCase().includes(query)).slice(0, 6);
  }, [commentText, assignees]);

  const insertMention = (member) => {
    const parts = commentText.trim().split(/\s+/);
    parts[parts.length - 1] = `@${member.name}`;
    setCommentText(`${parts.join(' ')} `);
  };

  const getDefaultChildType = (parentType) => {
    const map = {
      epic: 'feature',
      feature: 'story',
      story: 'task',
      task: 'subtask',
      bug: 'subtask',
      subtask: null,
    };
    return map[parentType] || 'task';
  };

  const childTypeToCreate = getDefaultChildType(task?.workItemType);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Task not found</p>
          <button onClick={navigateToProjectPage} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go To Projects
          </button>
        </div>
      </div>
    );
  }

  const typeConfig = getWorkItemConfig(task.workItemType);
  const priorityDef = PRIORITIES.find((p) => p.value === task.priority) || PRIORITIES[1];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <button onClick={navigateToProjectPage} className="flex items-center text-gray-600 hover:text-gray-900">
            <ChevronsLeft className="w-4 h-4 mr-1" />
            Back to Project
          </button>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
            {!isCompletedCategory && (
              <button
                onClick={handleCompleteClick}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {ancestry.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-2.5 mb-6 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
              {ancestry.map((node, index) => (
                <React.Fragment key={node._id}>
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <button
                    onClick={() => navigate(`/teams/${effectiveTeamId}/projects/${projectId}/tasks/${node._id}`)}
                    className={`${node._id === taskId ? 'text-gray-900 font-semibold' : 'text-gray-600'} hover:underline`}
                  >
                    {node.title}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Type */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <WorkItemIcon type={task.workItemType} size="md" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: statusDef.color }}
                >
                  {statusDef.label || task.status}
                </span>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleEditChange('title', e.target.value)}
                  className="w-full text-xl font-bold text-gray-900 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                {isEditing ? (
                  <textarea
                    value={editData.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={5}
                    placeholder="Add a description..."
                  />
                ) : (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {task.description || 'No description provided.'}
                  </p>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-700">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Child Tasks */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Child Items ({childTasks.length})</h3>
                {childTypeToCreate && (
                  <button
                    onClick={() => navigate(`/teams/${effectiveTeamId}/projects/${projectId}/tasks/new?parentTask=${taskId}&type=${childTypeToCreate}`)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add {childTypeToCreate === 'story' ? 'User Story' : childTypeToCreate}
                  </button>
                )}
              </div>
              {childTasks.length === 0 ? (
                <p className="text-sm text-gray-500">No child work items yet.</p>
              ) : (
                <div className="space-y-1">
                  {childTasks.map((child) => (
                    <button
                      key={child._id}
                      onClick={() => navigate(`/teams/${effectiveTeamId}/projects/${projectId}/tasks/${child._id}`)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                    >
                      <WorkItemIcon type={child.workItemType} size="sm" />
                      <span className="text-sm text-gray-900 truncate flex-1">{child.title}</span>
                      <span className="text-xs text-gray-500">{child.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Conversation ({task.comments?.length || 0})
                </h3>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1 mb-4">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment, index) => (
                    <div key={comment._id || index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No comments yet.</p>
                )}
              </div>

              <div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Add a comment... (type @ to mention)"
                />
                {commentMentionOptions.length > 0 && (
                  <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
                    {commentMentionOptions.map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => insertMention(member)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        @{member.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSubmitComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-100">Details</h3>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                {isEditing ? (
                  <select
                    value={editData.status}
                    onChange={(e) => handleEditChange('status', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    {workflowStatuses.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <span
                    className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: statusDef.color }}
                  >
                    {statusDef.label || task.status}
                  </span>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                {isEditing ? (
                  <select
                    value={editData.priority}
                    onChange={(e) => handleEditChange('priority', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${priorityDef.color}`}>
                    {task.priority}
                  </span>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
                {isEditing ? (
                  <select
                    value={editData.assignedTo}
                    onChange={(e) => handleEditChange('assignedTo', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  >
                    <option value="">Unassigned</option>
                    {assignees.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {task.assignedTo?.name ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                          {task.assignedTo.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700">{task.assignedTo.name}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Work Item Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                <div className="flex items-center gap-1.5">
                  <WorkItemIcon type={task.workItemType} size="sm" />
                  <span className="text-sm text-gray-700">{typeConfig.label}</span>
                </div>
              </div>

              {/* Story Points */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Story Points</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.storyPoints}
                    onChange={(e) => handleEditChange('storyPoints', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    placeholder="0"
                  />
                ) : (
                  <span className="text-sm text-gray-700">{task.storyPoints || '-'}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hierarchy Progress</label>
                <p className="text-sm text-gray-700">
                  {taskProgress.completed}/{taskProgress.total} completed ({taskProgress.percentage}%)
                </p>
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all"
                    style={{ width: `${taskProgress.percentage || 0}%` }}
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => handleEditChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {task.startDate ? new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.dueDate}
                    onChange={(e) => handleEditChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className={`text-sm ${task.dueDate && new Date(task.dueDate) < new Date() ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                )}
              </div>

              {/* Parent Task */}
              {task.parentTask && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Parent Item</label>
                  <button
                    onClick={() => {
                      const parentId = typeof task.parentTask === 'object' ? task.parentTask._id : task.parentTask;
                      navigate(`/teams/${effectiveTeamId}/projects/${projectId}/tasks/${parentId}`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {typeof task.parentTask === 'object' ? task.parentTask.title : 'View Parent'}
                  </button>
                </div>
              )}

              {/* Sprint */}
              {task.sprint && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sprint</label>
                  <span className="text-sm text-gray-700">
                    {typeof task.sprint === 'object' ? task.sprint.name : task.sprint}
                  </span>
                </div>
              )}

              {/* Resolution */}
              {task.resolution && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Resolution</label>
                  <span className="text-sm text-gray-700 capitalize">{task.resolution}</span>
                </div>
              )}

              {/* Completion Reason */}
              {task.completionReason && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Completion Reason</label>
                  <p className="text-sm text-gray-700">{task.completionReason}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Created {task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Updated {task.updatedAt ? new Date(task.updatedAt).toLocaleString() : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={task?.title || ''}
        itemType="task"
        loading={isDeleting}
      />
    </div>
  );
};

export default TaskDetailPage;
