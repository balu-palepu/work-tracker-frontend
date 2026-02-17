import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronsLeft, CheckCircle } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import WorkItemIcon, { getWorkItemConfig } from '../components/shared/WorkItemIcon';

const RESOLUTIONS = [
  { value: 'fixed', label: 'Fixed' },
  { value: "won't fix", label: "Won't Fix" },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'by design', label: 'By Design' },
  { value: 'cannot reproduce', label: 'Cannot Reproduce' },
];

const TaskCompletionPage = () => {
  const { teamId, projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentTeam } = useTeam();

  const [task, setTask] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    targetStatus: searchParams.get('targetStatus') || '',
    resolution: 'fixed',
    completionReason: '',
  });

  const effectiveTeamId = teamId || currentTeam?._id;
  const navigateToProjectPage = () => {
    if (effectiveTeamId && projectId) {
      navigate(`/teams/${effectiveTeamId}/projects/${projectId}`);
      return;
    }
    navigate('/teams');
  };

  useEffect(() => {
    if (effectiveTeamId && projectId && taskId) {
      fetchData();
    }
  }, [effectiveTeamId, projectId, taskId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, projectRes] = await Promise.all([
        taskService.getTask(effectiveTeamId, projectId, taskId),
        projectService.getProject(effectiveTeamId, projectId),
      ]);
      setTask(taskRes.data || taskRes);
      setProjectData(projectRes.data || projectRes);
    } catch (error) {
      toast.error('Error loading task data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const completedStatuses = useMemo(() => {
    const statuses = projectData?.workflowStatuses || projectData?.workflow?.workflowStatuses || projectData?.settings?.workflowStatuses;
    if (Array.isArray(statuses) && statuses.length > 0) {
      return statuses
        .filter((s) => s.category === 'completed')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return [
      { id: 'resolved', label: 'Resolved', category: 'completed', color: '#10B981' },
      { id: 'closed', label: 'Closed', category: 'completed', color: '#6B7280' },
    ];
  }, [projectData]);

  // Set default target status once data is loaded
  useEffect(() => {
    if (completedStatuses.length > 0 && !formData.targetStatus) {
      setFormData((prev) => ({ ...prev, targetStatus: completedStatuses[0].id }));
    }
  }, [completedStatuses]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.completionReason.trim()) {
      toast.error('Please provide a completion reason');
      return;
    }

    setSubmitting(true);
    try {
      await taskService.updateTask(effectiveTeamId, projectId, taskId, {
        status: formData.targetStatus,
        resolution: formData.resolution,
        completionReason: formData.completionReason,
      });
      toast.success('Task completed successfully!');
      navigate(`/teams/${effectiveTeamId}/projects/${projectId}/tasks/${taskId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error completing task');
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
  const selectedStatus = completedStatuses.find((s) => s.id === formData.targetStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <button
          onClick={navigateToProjectPage}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronsLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h1 className="text-lg font-bold text-gray-900">Complete Work Item</h1>
            </div>
          </div>

          {/* Task Summary */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <WorkItemIcon type={task.workItemType} size="md" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mt-1">{task.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Current status: <span className="font-medium">{task.status}</span>
              {task.assignedTo?.name && (
                <> &bull; Assigned to: <span className="font-medium">{task.assignedTo.name}</span></>
              )}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Target Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Status *
              </label>
              <div className="flex flex-wrap gap-2">
                {completedStatuses.map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => handleChange('targetStatus', status.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                      formData.targetStatus === status.id
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: status.color }} />
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution *
              </label>
              <select
                value={formData.resolution}
                onChange={(e) => handleChange('resolution', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {RESOLUTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Completion Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason / Notes *
              </label>
              <textarea
                value={formData.completionReason}
                onChange={(e) => handleChange('completionReason', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Explain why this item is being completed with this resolution..."
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.completionReason.length}/500
              </p>
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
                disabled={submitting || !formData.completionReason.trim()}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Completing...' : 'Complete Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionPage;
