import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSprint } from '../context/SprintContext';
import { useTeam } from '../context/TeamContext';
import { Plus, Play, CheckCircle, XCircle, Calendar, Target, TrendingUp } from 'lucide-react';
import CreateSprintModal from '../components/sprint/CreateSprintModal';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import Pagination from '../components/shared/Pagination';
import sprintService from '../services/sprintService';

const SprintList = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const { createSprint: contextCreateSprint, startSprint, deleteSprint: contextDeleteSprint } = useSprint();
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, sprint: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSprints, setTotalSprints] = useState(0);
  const [pageSize] = useState(9);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (currentTeam && projectId) {
      fetchSprints();
    }
  }, [currentTeam, projectId, currentPage, sortBy, sortOrder, statusFilter]);

  const fetchSprints = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await sprintService.getSprints(currentTeam._id, projectId, params);
      setSprints(response.data || []);
      setTotalSprints(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      toast.error('Error loading sprints');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async (sprintData) => {
    try {
      await contextCreateSprint(projectId, sprintData);
      toast.success('Sprint created successfully!');
      setShowCreateModal(false);
      fetchSprints(); // Reload with pagination
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating sprint');
    }
  };

  const handleStartSprint = async (sprintId) => {
    if (!window.confirm('Are you sure you want to start this sprint?')) return;

    try {
      await startSprint(projectId, sprintId);
      toast.success('Sprint started!');
      fetchSprints(); // Reload to update status
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error starting sprint');
    }
  };

  const openDeleteModal = (sprint) => {
    setDeleteModal({ isOpen: true, sprint });
  };

  const handleDeleteSprint = async () => {
    setIsDeleting(true);
    try {
      await contextDeleteSprint(projectId, deleteModal.sprint._id);
      toast.success('Sprint deleted successfully!');
      setDeleteModal({ isOpen: false, sprint: null });
      fetchSprints(); // Reload with pagination
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting sprint');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page
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

  const getStatusBadge = (status) => {
    const badges = {
      planning: { color: 'bg-gray-100 text-gray-800', icon: Calendar },
      active: { color: 'bg-green-100 text-green-800', icon: Play },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const badge = badges[status] || badges.planning;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sprints</h1>
            <p className="mt-2 text-gray-600">Manage your project sprints and iterations</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/backlog`)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View Backlog
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Sprint
            </button>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ height: '42px' }}
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ height: '42px' }}
            >
              <option value="createdAt">Created Date</option>
              <option value="startDate">Start Date</option>
              <option value="endDate">End Date</option>
              <option value="name">Name</option>
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
              Showing {sprints.length} of {totalSprints} sprints
            </p>
          </div>
        </div>

        {/* Active Sprint */}
        {sprints.filter(s => s.status === 'active').map(sprint => (
          <div key={sprint._id} className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 mb-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold">{sprint.name}</h2>
                  {getStatusBadge(sprint.status)}
                </div>
                {sprint.goal && (
                  <p className="text-blue-100 mb-4">{sprint.goal}</p>
                )}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                  </div>
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    {sprint.metrics.completedStoryPoints} / {sprint.metrics.totalStoryPoints} points
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {sprint.progress}% complete
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints/${sprint._id}`)}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                View Sprint Board
              </button>
            </div>
          </div>
        ))}

        {/* Sprint List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.filter(s => s.status !== 'active').map(sprint => (
            <div
              key={sprint._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{sprint.name}</h3>
                  {getStatusBadge(sprint.status)}
                </div>

                {sprint.goal && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{sprint.goal}</p>
                )}

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                  </div>
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    {sprint.metrics.totalStoryPoints} story points
                  </div>
                  {sprint.status === 'completed' && (
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Velocity: {sprint.metrics.velocity}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {sprint.status === 'planning' && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${sprint.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {sprint.status === 'planning' && (
                    <>
                      <button
                        onClick={() => handleStartSprint(sprint._id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Start Sprint
                      </button>
                      <button
                        onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints/${sprint._id}`)}
                        className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(sprint)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {(sprint.status === 'completed' || sprint.status === 'cancelled') && (
                    <button
                      onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints/${sprint._id}`)}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {sprints.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sprints Yet</h3>
            <p className="text-gray-600 mb-4">Create your first sprint to start planning your work</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Sprint
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && sprints.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalSprints}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Create Sprint Modal */}
      {showCreateModal && (
        <CreateSprintModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSprint}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, sprint: null })}
        onConfirm={handleDeleteSprint}
        itemName={deleteModal.sprint?.name || ''}
        itemType="sprint"
        loading={isDeleting}
      />
    </div>
  );
};

export default SprintList;
