import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSprint } from '../context/SprintContext';
import { useTeam } from '../context/TeamContext';
import { Package, Plus } from 'lucide-react';
import taskService from '../services/taskService';
import projectMemberService from '../services/projectMemberService';
import sprintService from '../services/sprintService';
import TaskDetailsModal from '../components/TaskDetailsModal';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import Pagination from '../components/shared/Pagination';

const Backlog = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const { sprints, loadSprints, addTasksToSprint } = useSprint();
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showSprintSelector, setShowSprintSelector] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, task: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (currentTeam && projectId) {
      fetchData();
      fetchAssignees();
    }
  }, [currentTeam, projectId, currentPage, sortBy, sortOrder]);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder
      };
      const [backlogResponse] = await Promise.all([
        sprintService.getBacklog(currentTeam._id, projectId, params),
        loadSprints(projectId)
      ]);
      setBacklog(backlogResponse.data || []);
      setTotalTasks(backlogResponse.total || 0);
      setTotalPages(backlogResponse.totalPages || 1);
    } catch (error) {
      toast.error('Error loading backlog');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedTasks([]); // Clear selection when changing page
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === backlog.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(backlog.map(task => task._id));
    }
  };

  const handleAddToSprint = async (sprintId) => {
    if (selectedTasks.length === 0) {
      toast.warning('Please select tasks to add to sprint');
      return;
    }

    try {
      await addTasksToSprint(projectId, sprintId, selectedTasks);
      toast.success(`${selectedTasks.length} tasks added to sprint`);
      setSelectedTasks([]);
      setShowSprintSelector(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding tasks to sprint');
    }
  };

  const openDeleteModal = (task) => {
    setDeleteModal({ isOpen: true, task });
  };

  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      await taskService.deleteTask(currentTeam._id, projectId, deleteModal.task._id);
      await fetchData();
      toast.success('Task deleted successfully');
      setDeleteModal({ isOpen: false, task: null });
    } catch (error) {
      toast.error('Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const planningSprints = sprints.filter(s => s.status === 'planning' || s.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Backlog</h1>
            <p className="mt-2 text-gray-600">
              {backlog.length} tasks waiting to be added to a sprint
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View Sprints
            </button>
            {selectedTasks.length > 0 && (
              <button
                onClick={() => setShowSprintSelector(!showSprintSelector)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add to Sprint ({selectedTasks.length})
              </button>
            )}
          </div>
        </div>

        {/* Sprint Selector Dropdown */}
        {showSprintSelector && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Sprint:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {planningSprints.map(sprint => (
                <button
                  key={sprint._id}
                  onClick={() => handleAddToSprint(sprint._id)}
                  className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">{sprint.name}</p>
                    <p className="text-xs text-gray-500">{sprint.metrics.totalStoryPoints} points</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${sprint.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {sprint.status}
                  </span>
                </button>
              ))}
              {planningSprints.length === 0 && (
                <p className="text-gray-500 col-span-3 text-center py-4">
                  No sprints available. Create a sprint first.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sort Controls */}
        {backlog.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ height: '42px' }}
              >
                <option value="priority">Priority</option>
                <option value="storyPoints">Story Points</option>
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ height: '42px' }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="ml-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
              <p className="text-sm text-gray-600">
                Showing {backlog.length} of {totalTasks} tasks
              </p>
            </div>
          </div>
        )}

        {/* Backlog Table */}
        {backlog.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTasks.length === backlog.length && backlog.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Story Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backlog.map(task => (
                    <tr
                      key={task._id}
                      className={`hover:bg-gray-50 ${selectedTasks.includes(task._id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task._id)}
                          onChange={() => handleTaskSelect(task._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {task.storyPoints || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {task.assignedTo ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {task.assignedTo.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="ml-2 text-sm text-gray-900">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDetailTaskId(task._id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openDeleteModal(task)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalTasks}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Backlog is Empty</h3>
            <p className="text-gray-600 mb-4">
              All tasks are either assigned to sprints or you haven't created any tasks yet
            </p>
            <button
              onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}`)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Task
            </button>
          </div>
        )}
      </div>

      <TaskDetailsModal
        isOpen={!!detailTaskId}
        onClose={() => setDetailTaskId(null)}
        teamId={currentTeam?._id}
        projectId={projectId}
        taskId={detailTaskId}
        assignees={assignees}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, task: null })}
        onConfirm={handleDeleteTask}
        itemName={deleteModal.task?.title || ''}
        itemType="task"
        loading={isDeleting}
      />
    </div>
  );
};

export default Backlog;
