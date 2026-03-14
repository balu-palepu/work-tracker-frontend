import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSprint } from '../context/SprintContext';
import { useTeam } from '../context/TeamContext';
import { Package, Plus, AlertTriangle, Users, Hash, Target, ArrowUpDown } from 'lucide-react';
import WorkItemIcon, { WORK_ITEM_TYPES } from '../components/shared/WorkItemIcon';
import taskService from '../services/taskService';
import sprintService from '../services/sprintService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import Pagination from '../components/shared/Pagination';

const PRIORITY_CONFIG = {
  urgent: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Urgent' },
  high: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'High' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Medium' },
  low: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Low' },
};

const Backlog = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const { sprints, loadSprints, addTasksToSprint } = useSprint();
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, task: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [estimationFilter, setEstimationFilter] = useState('all');

  // Sprint assignment
  const [selectedSprintId, setSelectedSprintId] = useState('');

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
    }
  }, [currentTeam, projectId, currentPage, sortBy, sortOrder]);

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

  // Health metrics
  const healthMetrics = useMemo(() => {
    const totalSP = backlog.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const unestimated = backlog.filter(t => !t.storyPoints).length;
    const urgentHigh = backlog.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    const unassigned = backlog.filter(t => !t.assignedTo).length;
    return { total: backlog.length, totalSP, unestimated, urgentHigh, unassigned };
  }, [backlog]);

  // Client-side filtering
  const filteredBacklog = useMemo(() => {
    return backlog.filter(task => {
      if (typeFilter !== 'all' && (task.workItemType || 'task') !== typeFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (estimationFilter === 'estimated' && !task.storyPoints) return false;
      if (estimationFilter === 'unestimated' && task.storyPoints) return false;
      return true;
    });
  }, [backlog, typeFilter, priorityFilter, estimationFilter]);

  // Selected tasks info
  const selectedInfo = useMemo(() => {
    const tasks = backlog.filter(t => selectedTasks.includes(t._id));
    return {
      count: tasks.length,
      sp: tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
    };
  }, [selectedTasks, backlog]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedTasks([]);
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
    if (selectedTasks.length === filteredBacklog.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredBacklog.map(task => task._id));
    }
  };

  const handleAddToSprint = async () => {
    if (selectedTasks.length === 0 || !selectedSprintId) {
      toast.warning('Please select tasks and a sprint');
      return;
    }

    try {
      await addTasksToSprint(projectId, selectedSprintId, selectedTasks);
      toast.success(`${selectedTasks.length} tasks added to sprint`);
      setSelectedTasks([]);
      setSelectedSprintId('');
      fetchData();
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

  const planningSprints = sprints.filter(s => s.status === 'planning' || s.status === 'active');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderTaskRow = (task) => {
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

    return (
      <tr
        key={task._id}
        className={`hover:bg-gray-50 transition-colors ${selectedTasks.includes(task._id) ? 'bg-blue-50' : ''}`}
      >
        <td className="px-4 py-3 w-10">
          <input
            type="checkbox"
            checked={selectedTasks.includes(task._id)}
            onChange={() => handleTaskSelect(task._id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </td>
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
                  onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/tasks/${task._id}`)}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate text-left"
                >
                  {task.title}
                </button>
              </div>
              {task.parentTask && (
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  Parent: {task.parentTask.title || task.parentTask}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border}`}>
            {priorityConfig.label}
          </span>
        </td>
        <td className="px-4 py-3">
          {task.storyPoints ? (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
              {task.storyPoints} SP
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
              onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/tasks/${task._id}`)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              View
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => openDeleteModal(task)}
              className="text-red-600 hover:text-red-800 text-xs font-medium"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Backlog</h1>
            <p className="mt-1 text-sm text-gray-600">
              {totalTasks} items in backlog
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/tasks/new?sprint=none`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Item
            </button>
            <button
              onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              View Sprints
            </button>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Hash className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Total Items</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{healthMetrics.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Story Points</p>
            </div>
            <p className="text-xl font-bold text-indigo-700">{healthMetrics.totalSP}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Unestimated</p>
            </div>
            <p className={`text-xl font-bold ${healthMetrics.unestimated > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
              {healthMetrics.unestimated}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Urgent/High</p>
            </div>
            <p className={`text-xl font-bold ${healthMetrics.urgentHigh > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {healthMetrics.urgentHigh}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Unassigned</p>
            </div>
            <p className={`text-xl font-bold ${healthMetrics.unassigned > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
              {healthMetrics.unassigned}
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter - chips */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-500 font-medium mr-1">Type:</span>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  typeFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {WORK_ITEM_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    typeFilter === type.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200" />

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500 font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="w-px h-5 bg-gray-200" />

            {/* Estimation Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-500 font-medium mr-1">Estimation:</span>
              {['all', 'estimated', 'unestimated'].map(val => (
                <button
                  key={val}
                  onClick={() => setEstimationFilter(val)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    estimationFilter === val ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="w-3 h-3 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="priority">Priority</option>
                <option value="storyPoints">Story Points</option>
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-1.5 py-1 border border-gray-200 rounded text-xs text-gray-500 hover:bg-gray-50"
              >
                {sortOrder === 'desc' ? 'DESC' : 'ASC'}
              </button>
            </div>
          </div>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-500">
            Showing {filteredBacklog.length} of {backlog.length} items on this page ({totalTasks} total)
          </p>
          {selectedTasks.length > 0 && (
            <p className="text-xs text-blue-600 font-medium">
              {selectedInfo.count} selected ({selectedInfo.sp} SP)
            </p>
          )}
        </div>

        {/* Backlog Table */}
        {filteredBacklog.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-2 text-left w-10">
                      <input
                        type="checkbox"
                        checked={filteredBacklog.length > 0 && selectedTasks.length === filteredBacklog.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">SP</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                    <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBacklog.map(task => renderTaskRow(task))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Package className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {backlog.length === 0 ? 'Backlog is Empty' : 'No matching items'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {backlog.length === 0
                ? 'All tasks are either assigned to sprints or you haven\'t created any tasks yet'
                : 'Try adjusting your filters to find what you\'re looking for'
              }
            </p>
            {backlog.length === 0 && (
              <button
                onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/tasks/new?sprint=none`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Backlog Item
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && backlog.length > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalTasks}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Sticky Sprint Assignment Toolbar */}
      {selectedTasks.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-6 py-3 z-50">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium">
                {selectedInfo.count} items selected
              </span>
              <span className="text-gray-400 text-xs">
                ({selectedInfo.sp} SP)
              </span>
              <button
                onClick={() => setSelectedTasks([])}
                className="text-gray-400 hover:text-white text-xs underline"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedSprintId}
                onChange={(e) => setSelectedSprintId(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 text-white border border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Sprint...</option>
                {planningSprints.map(sprint => (
                  <option key={sprint._id} value={sprint._id}>
                    {sprint.name} ({sprint.metrics?.totalStoryPoints || 0} SP{sprint.capacity ? ` / ${sprint.capacity}` : ''})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddToSprint}
                disabled={!selectedSprintId}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedSprintId
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Move to Sprint
              </button>
            </div>
          </div>
        </div>
      )}

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
