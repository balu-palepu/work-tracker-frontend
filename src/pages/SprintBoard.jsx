import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSprint } from '../context/SprintContext';
import { useTeam } from '../context/TeamContext';
import { CheckCircle, XCircle, TrendingUp, Calendar, Target, ArrowLeft } from 'lucide-react';
import TrackingBoard from '../components/TrackingBoard';
import BurndownChart from '../components/sprint/BurndownChart';
import taskService from '../services/taskService';
import projectMemberService from '../services/projectMemberService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const SprintBoard = () => {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const { currentSprint, loadSprint, completeSprint, cancelSprint, loadBurndownData, burndownData } = useSprint();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [showBurndown, setShowBurndown] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, task: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentTeam && projectId && sprintId) {
      fetchSprintData();
      fetchAssignees();
    }
  }, [currentTeam, projectId, sprintId]);

  const fetchAssignees = async () => {
    try {
      const response = await projectMemberService.getProjectMembers(currentTeam._id, projectId);
      const members = response.success ? (response.data || []) : [];
      setAssignees(members.map((pm) => pm.user).filter(Boolean));
    } catch (error) {
      console.error('Error loading project members:', error);
      setAssignees([]);
    }
  };

  const fetchSprintData = async () => {
    try {
      setLoading(true);
      const sprintData = await loadSprint(projectId, sprintId);
      setTasks(sprintData.tasks || []);

      if (sprintData.status === 'active') {
        await loadBurndownData(projectId, sprintId);
      }
    } catch (error) {
      toast.error('Error loading sprint');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreate = async (taskData) => {
    try {
      const response = await taskService.createTask(currentTeam._id, projectId, {
        ...taskData,
        sprint: sprintId
      });
      setTasks([...tasks, response.data]);
      toast.success('Task created successfully!');
      await fetchSprintData(); // Refresh to update metrics
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating task');
      throw error;
    }
  };

  const handleTaskUpdate = async (taskId, taskData) => {
    try {
      const response = await taskService.updateTask(currentTeam._id, projectId, taskId, taskData);
      setTasks(tasks.map(t => t._id === taskId ? response.data : t));
      toast.success('Task updated successfully!');
      await fetchSprintData(); // Refresh to update metrics
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating task');
      throw error;
    }
  };

  const handleTaskDelete = (taskId) => {
    // Find the task from tasks array
    const task = tasks.find(t => t._id === taskId);
    if (task) {
      setDeleteModal({ isOpen: true, task });
    }
  };

  const confirmTaskDelete = async () => {
    if (!deleteModal.task) return;

    setIsDeleting(true);
    try {
      await taskService.deleteTask(currentTeam._id, projectId, deleteModal.task._id);
      setTasks(tasks.filter(t => t._id !== deleteModal.task._id));
      toast.success('Task deleted successfully!');
      await fetchSprintData(); // Refresh to update metrics
      setDeleteModal({ isOpen: false, task: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus, newPosition) => {
    try {
      const response = await taskService.updateTaskStatus(
        currentTeam._id,
        projectId,
        taskId,
        newStatus,
        newPosition
      );
      setTasks(tasks.map(t => t._id === taskId ? response.data : t));
      await fetchSprintData(); // Refresh to update metrics
    } catch (error) {
      toast.error('Error updating task status');
      await fetchSprintData(); // Revert on error
    }
  };

  const handleCompleteSprint = async () => {
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');

    if (incompleteTasks.length > 0) {
      const moveToBacklog = window.confirm(
        `This sprint has ${incompleteTasks.length} incomplete tasks. Move them to backlog?`
      );

      if (!moveToBacklog) return;
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentSprint) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Sprint not found</p>
          <button
            onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sprints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sprint Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sprints
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentSprint.name}</h1>
              {currentSprint.goal && (
                <p className="text-gray-600 mt-2">{currentSprint.goal}</p>
              )}
              <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(currentSprint.startDate)} - {formatDate(currentSprint.endDate)}
                </div>
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  {currentSprint.metrics.completedStoryPoints} / {currentSprint.metrics.totalStoryPoints} points
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {currentSprint.progress}% complete
                </div>
                {currentSprint.status === 'active' && (
                  <div className="flex items-center text-blue-600">
                    <span className="font-medium">{currentSprint.daysRemaining} days remaining</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {currentSprint.status === 'active' && burndownData && (
                <button
                  onClick={() => setShowBurndown(!showBurndown)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {showBurndown ? 'Hide' : 'Show'} Burndown
                </button>
              )}
              {currentSprint.status === 'active' && (
                <>
                  <button
                    onClick={handleCancelSprint}
                    className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Cancel Sprint
                  </button>
                  <button
                    onClick={handleCompleteSprint}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Complete Sprint
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${currentSprint.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Burndown Chart */}
      {showBurndown && burndownData && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BurndownChart data={burndownData} />
        </div>
      )}

      {/* Sprint Board */}
      <div className="h-[calc(100vh-280px)]">
        <TrackingBoard
          tasks={tasks}
          loading={false}
          onTaskCreate={handleTaskCreate}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          onTaskStatusChange={handleTaskStatusChange}
          assignees={assignees}
          teamId={currentTeam?._id}
          projectId={projectId}
        />
      </div>

      {/* Delete Confirmation Modal */}
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
