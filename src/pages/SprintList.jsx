import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSprint } from '../context/SprintContext';
import { useTeam } from '../context/TeamContext';
import { Plus, Play, CheckCircle, XCircle, Calendar, Target, TrendingUp, Edit2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import CreateSprintModal from '../components/sprint/CreateSprintModal';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import Pagination from '../components/shared/Pagination';
import sprintService from '../services/sprintService';
import projectService from '../services/projectService';

const SprintList = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentTeam, isAdmin, isMember } = useTeam();
  const { createSprint: contextCreateSprint, updateSprint: contextUpdateSprint, startSprint, deleteSprint: contextDeleteSprint } = useSprint();
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, sprint: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [velocityData, setVelocityData] = useState([]);

  // Only admins, managers, and team leads can manage sprints (not regular members)
  const canManageSprints = !isMember() || isAdmin();

  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSprints, setTotalSprints] = useState(0);
  const [pageSize] = useState(9);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSprints = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const matched = !query
      ? sprints
      : sprints.filter((sprint) =>
      `${sprint.name || ''} ${sprint.goal || ''}`.toLowerCase().includes(query)
    );

    // Keep active sprint(s) at the top while preserving the existing API sort order within each group.
    const active = matched.filter((sprint) => sprint.status === 'active');
    const others = matched.filter((sprint) => sprint.status !== 'active');
    return [...active, ...others];
  }, [sprints, searchTerm]);

  const sprintSummary = useMemo(() => {
    const planning = sprints.filter((sprint) => sprint.status === 'planning').length;
    const active = sprints.filter((sprint) => sprint.status === 'active').length;
    const completed = sprints.filter((sprint) => sprint.status === 'completed').length;
    return { planning, active, completed };
  }, [sprints]);

  const avgVelocity = useMemo(() => {
    if (velocityData.length === 0) return 0;
    const total = velocityData.reduce((sum, d) => sum + d.completedPoints, 0);
    return Math.round(total / velocityData.length);
  }, [velocityData]);

  useEffect(() => {
    if (currentTeam && projectId) {
      fetchSprints();
    }
  }, [currentTeam, projectId, currentPage, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    if (currentTeam && projectId) {
      fetchAnalytics();
    }
  }, [currentTeam, projectId]);

  const fetchAnalytics = async () => {
    try {
      const response = await projectService.getProjectAnalytics(currentTeam._id, projectId);
      if (response.data?.velocity) {
        setVelocityData(response.data.velocity);
      }
    } catch {
      // Analytics are optional, fail silently
    }
  };

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

  const handleOpenEditSprint = (sprint) => {
    setEditingSprint(sprint);
    setShowCreateModal(false);
  };

  const handleUpdateSprint = async (sprintData) => {
    if (!editingSprint) return;

    try {
      await contextUpdateSprint(projectId, editingSprint._id, sprintData);
      toast.success('Sprint updated successfully!');
      setEditingSprint(null);
      fetchSprints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating sprint');
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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
            {canManageSprints && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Sprint
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Planning</p>
            <p className="text-xl font-bold text-gray-900">{sprintSummary.planning}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Active</p>
            <p className="text-xl font-bold text-green-700">{sprintSummary.active}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Completed</p>
            <p className="text-xl font-bold text-blue-700">{sprintSummary.completed}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-gray-400" />
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Avg Velocity</p>
            </div>
            <p className="text-xl font-bold text-indigo-700">{avgVelocity} <span className="text-xs font-normal text-gray-400">SP</span></p>
          </div>
        </div>

        {/* Velocity Chart */}
        {velocityData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Sprint Velocity</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={velocityData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value, name) => [
                    `${value} SP`,
                    name === 'totalPoints' ? 'Committed' : 'Completed'
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => value === 'totalPoints' ? 'Committed' : 'Completed'}
                />
                <Bar dataKey="totalPoints" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="completedPoints" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filter and Sort Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter Sprint Name"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ height: '42px' }}
            />
          </div>
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
              Showing {filteredSprints.length} of {totalSprints} sprints
            </p>
          </div>
        </div>

        {/* Sprint List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSprints.map(sprint => (
            <div
              key={sprint._id}
              className={`rounded-xl shadow-sm border transition-all ${
                sprint.status === 'active'
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:shadow-blue-100'
                  : 'bg-white border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {sprint.status === 'active' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 mb-1">
                        Active Sprint
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">{sprint.name}</h3>
                  </div>
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
                {(sprint.status === 'planning' || sprint.status === 'active') && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${sprint.status === 'active' ? 'bg-blue-700' : 'bg-blue-600'}`}
                        style={{ width: `${sprint.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {sprint.status === 'active' && (
                    <>
                      <button
                        onClick={() => navigate(`/teams/${currentTeam._id}/projects/${projectId}/sprints/${sprint._id}`)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Open Sprint Board
                      </button>
                      {canManageSprints && (
                        <button
                          onClick={() => handleOpenEditSprint(sprint)}
                          className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </>
                  )}
                  {sprint.status === 'planning' && (
                    <>
                      {canManageSprints && (
                        <button
                          onClick={() => handleStartSprint(sprint._id)}
                          className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
                        >
                          Start Sprint
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditSprint(sprint)}
                        className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
                      >
                        <span className="inline-flex items-center gap-1">
                          Edit
                        </span>
                      </button>
                      {canManageSprints && (
                        <button
                          onClick={() => openDeleteModal(sprint)}
                          className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
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

        {filteredSprints.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sprints Yet</h3>
            <p className="text-gray-600 mb-4">
              {canManageSprints
                ? 'Create your first sprint to start planning your work'
                : 'No sprints have been created yet. Ask your project manager to create one.'}
            </p>
            {canManageSprints && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Sprint
              </button>
            )}
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
      {(showCreateModal || editingSprint) && (
        <CreateSprintModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingSprint(null);
          }}
          onSubmit={editingSprint ? handleUpdateSprint : handleCreateSprint}
          sprint={editingSprint}
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
