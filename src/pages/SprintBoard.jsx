import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSprint } from '../context/SprintContext';
import { useTeam } from '../context/TeamContext';
import { CheckCircle, XCircle, Calendar, Target, ChevronsLeft, Play, LayoutGrid, List, Plus } from 'lucide-react';
import TrackingBoard from '../components/TrackingBoard';
import SprintRetrospective from '../components/sprint/SprintRetrospective';
import SprintPlanningView from '../components/sprint/SprintPlanningView';
import WorkItemIcon from '../components/shared/WorkItemIcon';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const PRIORITY_CONFIG = {
  urgent: { bg: 'bg-red-50', color: 'text-red-600', border: 'border-red-200' },
  high: { bg: 'bg-orange-50', color: 'text-orange-600', border: 'border-orange-200' },
  medium: { bg: 'bg-yellow-50', color: 'text-yellow-600', border: 'border-yellow-200' },
  low: { bg: 'bg-gray-50', color: 'text-gray-600', border: 'border-gray-200' },
};

const STATUS_STYLES = {
  todo: { bg: 'bg-gray-100', color: 'text-gray-700' },
  new: { bg: 'bg-gray-100', color: 'text-gray-700' },
  inprogress: { bg: 'bg-blue-100', color: 'text-blue-700' },
  active: { bg: 'bg-blue-100', color: 'text-blue-700' },
  resolved: { bg: 'bg-green-100', color: 'text-green-700' },
  completed: { bg: 'bg-green-100', color: 'text-green-700' },
  closed: { bg: 'bg-green-100', color: 'text-green-700' },
  done: { bg: 'bg-green-100', color: 'text-green-700' },
};


const SprintBoard = () => {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const {
    currentSprint, loadSprint, completeSprint, cancelSprint,
    startSprint, submitRetrospective,
  } = useSprint();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, task: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [viewMode, setViewMode] = useState('board');

  useEffect(() => {
    if (currentTeam && projectId && sprintId) {
      fetchSprintData();
      fetchProject();
    }
  }, [currentTeam, projectId, sprintId]);

  const fetchProject = async () => {
    try {
      const response = await projectService.getProject(currentTeam._id, projectId);
      setProjectData(response.data || response);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const fetchSprintData = async () => {
    try {
      setLoading(true);
      const sprintData = await loadSprint(projectId, sprintId);
      setTasks(sprintData.tasks || []);
    } catch (error) {
      toast.error('Error loading sprint');
    } finally {
      setLoading(false);
    }
  };

  const navigateToCreateTask = () => {
    navigate(`/teams/${currentTeam._id}/projects/${projectId}/tasks/new?sprint=${sprintId}`);
  };

  const navigateToTask = (taskId) => {
    navigate(`/teams/${currentTeam._id}/projects/${projectId}/tasks/${taskId}`);
  };

  const navigateToCompleteTask = (taskId, targetStatus) => {
    navigate(`/teams/${currentTeam._id}/projects/${projectId}/tasks/${taskId}/complete${targetStatus ? `?targetStatus=${targetStatus}` : ''}`);
  };

  const handleTaskDelete = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    if (task) setDeleteModal({ isOpen: true, task });
  };

  const confirmTaskDelete = async () => {
    if (!deleteModal.task) return;
    setIsDeleting(true);
    try {
      await taskService.deleteTask(currentTeam._id, projectId, deleteModal.task._id);
      setTasks(tasks.filter(t => t._id !== deleteModal.task._id));
      toast.success('Task deleted successfully!');
      await fetchSprintData();
      setDeleteModal({ isOpen: false, task: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus, newPosition) => {
    try {
      const response = await taskService.updateTaskStatus(currentTeam._id, projectId, taskId, newStatus, newPosition);
      setTasks(tasks.map(t => t._id === taskId ? response.data : t));
      await fetchSprintData();
    } catch (error) {
      toast.error('Error updating task status');
      await fetchSprintData();
    }
  };

  const handleCompleteSprint = async () => {
    const incompleteTasks = tasks.filter((task) => {
      const s = String(task?.status || '').toLowerCase();
      return !['resolved', 'completed', 'closed', 'done'].includes(s);
    });
    if (incompleteTasks.length > 0) {
      if (!window.confirm(`This sprint has ${incompleteTasks.length} incomplete tasks. Move them to backlog?`)) return;
    }
    try {
      await completeSprint(projectId, sprintId, { moveIncompleteTo: 'backlog' });
      toast.success('Sprint completed!');
      navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error completing sprint');
    }
  };

  const handleCancelSprint = async () => {
    if (!window.confirm('Are you sure you want to cancel this sprint? All tasks will be moved to backlog.')) return;
    try {
      await cancelSprint(projectId, sprintId);
      toast.success('Sprint cancelled. Tasks moved to backlog.');
      navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error cancelling sprint');
    }
  };

  const handleStartSprint = async () => {
    if (!window.confirm('Start this sprint?')) return;
    try {
      await startSprint(projectId, sprintId);
      toast.success('Sprint started!');
      await fetchSprintData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error starting sprint');
    }
  };

  const handleRetroSubmit = async (retroData) => {
    try {
      await submitRetrospective(projectId, sprintId, retroData);
      toast.success('Retrospective saved!');
      await fetchSprintData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving retrospective');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const workflowStatuses = React.useMemo(() => {
    const statuses = projectData?.workflowStatuses || projectData?.workflow?.workflowStatuses || projectData?.settings?.workflowStatuses;
    if (Array.isArray(statuses) && statuses.length > 0) {
      return [...statuses]
        .map((s) => {
          if (s.id === 'new') return { ...s, id: 'todo', label: 'To Do' };
          if (s.id === 'active') return { ...s, id: 'inprogress', label: 'In Progress' };
          if (s.id === 'resolved' || s.id === 'closed') return { ...s, id: 'resolved', label: 'Completed/Closed' };
          return s;
        })
        .filter((s) => s.id !== 'closed')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return [
      { id: 'todo', label: 'To Do', category: 'todo', color: '#6B7280', order: 0 },
      { id: 'inprogress', label: 'In Progress', category: 'inprogress', color: '#3B82F6', order: 1 },
      { id: 'resolved', label: 'Completed/Closed', category: 'completed', color: '#10B981', order: 2 },
    ];
  }, [projectData]);

  // Sort tasks for list view: inprogress first, then todo, then completed
  const sortedTasks = useMemo(() => {
    const statusOrder = { inprogress: 0, active: 0, todo: 1, new: 1, resolved: 2, completed: 2, closed: 2, done: 2 };
    return [...tasks].sort((a, b) => {
      const aOrder = statusOrder[a.status] ?? 1;
      const bOrder = statusOrder[b.status] ?? 1;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.position ?? 0) - (b.position ?? 0);
    });
  }, [tasks]);

  const completedTaskCount = tasks.filter((t) => ['resolved', 'completed', 'closed', 'done'].includes(String(t?.status || '').toLowerCase())).length;
  const totalTaskCount = tasks.length;
  const remainingTaskCount = Math.max(totalTaskCount - completedTaskCount, 0);
const DONE_STATUSES = ['resolved', 'completed', 'closed', 'done'];
  const spTotal = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const spCompleted = tasks.filter(t => DONE_STATUSES.includes(String(t?.status || '').toLowerCase())).reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!currentSprint) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Sprint not found</p>
          <button onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints`)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Sprints
          </button>
        </div>
      </div>
    );
  }

  const getStatusLabel = (status) => {
    const labels = { todo: 'To Do', new: 'To Do', inprogress: 'In Progress', active: 'In Progress', resolved: 'Completed', completed: 'Completed', closed: 'Closed', done: 'Done' };
    return labels[status] || status;
  };

  const renderListView = () => (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">{sortedTasks.length} items</p>
        <button
          onClick={navigateToCreateTask}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider w-[40%]">Task</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">SP</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedTasks.map(task => {
                const pConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const sStyle = STATUS_STYLES[task.status] || STATUS_STYLES.todo;
                const isCompleted = ['resolved', 'completed', 'closed', 'done'].includes(task.status);

                return (
                  <tr
                    key={task._id}
                    className={`hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <WorkItemIcon type={task.workItemType} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {task.displayId && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-900 text-white flex-shrink-0">
                                {task.displayId}
                              </span>
                            )}
                            <button
                              onClick={() => navigateToTask(task._id)}
                              className={`text-sm font-medium hover:text-blue-600 truncate text-left ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}
                            >
                              {task.title}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sStyle.bg} ${sStyle.color}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${pConfig.bg} ${pConfig.color} ${pConfig.border}`}>
                        {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {task.storyPoints ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                          {task.storyPoints}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                            {task.assignedTo.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-700 truncate">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigateToTask(task._id)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          View
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleTaskDelete(task._id)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    No tasks in this sprint
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sprint Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints`)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-3"
          >
            <ChevronsLeft className="w-4 h-4 mr-1" />
            Back to Sprints
          </button>

          <div className="flex items-start gap-5">
            {/* Sprint Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 truncate">{currentSprint.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  currentSprint.status === 'active' ? 'bg-blue-100 text-blue-700'
                    : currentSprint.status === 'completed' ? 'bg-green-100 text-green-700'
                    : currentSprint.status === 'planning' ? 'bg-gray-100 text-gray-600'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {currentSprint.status}
                </span>
                {currentSprint.status === 'active' && currentSprint.daysRemaining != null && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                    {currentSprint.daysRemaining}d left
                  </span>
                )}
              </div>
              {currentSprint.goal && (
                <p className="text-gray-500 text-sm mt-1 line-clamp-1">{currentSprint.goal}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(currentSprint.startDate)} - {formatDate(currentSprint.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  {spCompleted}/{spTotal} SP
                </span>
              </div>
            </div>

            {/* View Toggle + Actions */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {currentSprint.status !== 'planning' && (
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode('board')}
                    className={`flex items-center px-2.5 py-1.5 text-sm transition-colors ${
                      viewMode === 'board' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Board View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center px-2.5 py-1.5 text-sm transition-colors ${
                      viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
              {currentSprint.status === 'planning' && (
                <button onClick={handleStartSprint} className="flex items-center px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
                  <Play className="w-4 h-4 mr-1.5" />
                  Start Sprint
                </button>
              )}
              {currentSprint.status === 'active' && (
                <>
                  <button onClick={handleCancelSprint} className="flex items-center px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Cancel
                  </button>
                  <button onClick={handleCompleteSprint} className="flex items-center px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black transition-colors">
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Complete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Total Items</p>
              <p className="text-lg font-bold text-gray-900">{totalTaskCount}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-green-600">Completed</p>
              <p className="text-lg font-bold text-green-700">{completedTaskCount}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-orange-600">Remaining</p>
              <p className="text-lg font-bold text-orange-700">{remainingTaskCount}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-blue-600">Story Points</p>
              <p className="text-lg font-bold text-blue-700">{spCompleted}/{spTotal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sprint Content: Planning View vs Board/List */}
      {currentSprint.status === 'planning' ? (
        <SprintPlanningView
          sprint={currentSprint}
          tasks={tasks}
          onStartSprint={handleStartSprint}
          onNavigateToTask={navigateToTask}
          onNavigateToCreate={navigateToCreateTask}
        />
      ) : viewMode === 'list' ? (
        renderListView()
      ) : (
        <div className="h-[calc(100vh-320px)]">
          <TrackingBoard
            tasks={tasks}
            loading={false}
            onTaskDelete={handleTaskDelete}
            onTaskStatusChange={handleTaskStatusChange}
            onInlineTaskCreate={async (data) => {
              try {
                await taskService.createTask(currentTeam._id, projectId, { ...data, sprint: sprintId });
                await fetchSprintData();
              } catch (error) {
                toast.error(error.response?.data?.message || 'Error creating task');
                throw error;
              }
            }}
            teamId={currentTeam?._id}
            projectId={projectId}
            sprintEndDate={currentSprint?.endDate}
            workflowStatuses={workflowStatuses}
            onNavigateToCreate={navigateToCreateTask}
            onNavigateToTask={navigateToTask}
            onNavigateToComplete={navigateToCompleteTask}
          />
        </div>
      )}

      {/* Retrospective for completed sprints */}
      {currentSprint.status === 'completed' && (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SprintRetrospective sprint={currentSprint} onSubmit={handleRetroSubmit} />
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, task: null })}
        onConfirm={confirmTaskDelete}
        itemName={deleteModal.task?.title || ''}
        itemType="task"
        loading={isDeleting}
      />
    </div>
  );
};

export default SprintBoard;
