import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import teamService from '../services/teamService';
import MultiSelectDropdown from '../components/shared/MultiSelectDropdown';
import Pagination from '../components/shared/Pagination';
import TableHeader from '../components/shared/TableHeader';
import { Users, Plus, ArrowLeft, Mail, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const TeamMembers = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { currentTeam, hasTeamPermission } = useTeam();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [pageSize] = useState(10);
  const [sortField, setSortField] = useState('joinedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Add member form
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newMemberManager, setNewMemberManager] = useState('');
  const [adding, setAdding] = useState(false);
  const [addErrors, setAddErrors] = useState('');

  // Edit member form
  const [editRole, setEditRole] = useState('');
  const [editManager, setEditManager] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (teamId) {
      loadMembers();
    }
  }, [teamId, currentPage, sortField, sortOrder, searchTerm]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeamMembers(teamId, {
        page: currentPage,
        limit: pageSize,
        sortBy: sortField,
        sortOrder: sortOrder,
        search: searchTerm
      });
      setMembers(response.data || []);
      const totalCount = response.total || response.count || response.data?.length || 0;
      setTotalMembers(totalCount);
      setTotalPages(response.totalPages || Math.max(1, Math.ceil(totalCount / pageSize)));
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await teamService.getAvailableUsers(teamId);
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error('Error loading available users:', error);
      toast.error('Failed to load available users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showAddModal && teamId) {
      loadAvailableUsers();
    }
  }, [showAddModal, teamId]);

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      setAdding(true);
      setAddErrors('');
      const reportingManagerId =
        newMemberRole === 'member' || newMemberRole === 'Manager'
          ? (newMemberManager || null)
          : null;

      if ((newMemberRole === 'member' || newMemberRole === 'Manager') && !reportingManagerId) {
        toast.error('Please select a reporting manager');
        setAdding(false);
        return;
      }

      const results = await Promise.allSettled(
        selectedUsers.map((userId) =>
          teamService.addTeamMember(teamId, {
            userId,
            role: newMemberRole,
            reportingManagerId
          })
        )
      );

      const failures = results
        .map((result, index) => ({ result, userId: selectedUsers[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ userId, result }) => {
          const user = availableUsers.find(u => u._id === userId);
          const message = result.reason?.response?.data?.message || result.reason?.message || 'Failed to add';
          return `${user?.name || userId}: ${message}`;
        });

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      if (successCount > 0) {
        toast.success(`${successCount} member${successCount === 1 ? '' : 's'} added successfully`);
        loadMembers();
      }

      if (failures.length > 0) {
        setAddErrors(failures.join(' | '));
        toast.error('Some members could not be added');
        return;
      }

      setShowAddModal(false);
      setSelectedUsers([]);
      setNewMemberRole('member');
      setNewMemberManager('');
    } catch (error) {
      console.error('Error adding member:', error);
      const errorMsg = error.response?.data?.message || 'Failed to add member';
      setAddErrors(errorMsg);
      toast.error(errorMsg);
    } finally {
      setAdding(false);
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();

    if (!selectedMember) return;

    try {
      setUpdating(true);
      const reportingManagerId =
        editRole === 'member' || editRole === 'Manager'
          ? (editManager || null)
          : null;

      if ((editRole === 'member' || editRole === 'Manager') && !reportingManagerId) {
        toast.error('Please select a reporting manager');
        setUpdating(false);
        return;
      }

      await teamService.updateTeamMember(teamId, selectedMember.user._id, {
        role: editRole,
        reportingManagerId
      });

      toast.success('Member updated successfully');
      setShowEditModal(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.user.name} from the team?`)) {
      return;
    }

    try {
      await teamService.removeTeamMember(teamId, member.user._id);
      toast.success('Member removed successfully');
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditManager(member.reportingManager?._id || member.user?.reportingManager || '');
    setShowEditModal(true);
    setActionMenuOpen(null);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      Manager: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || colors.member;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      Manager: 'Manager',
      member: 'Member',
      viewer: 'Viewer'
    };
    return labels[role] || role;
  };

  const canManageMembers = hasTeamPermission('canManageTeam');
  const adminMembers = members.filter((m) => m.role === 'admin' && m.user?._id);
  const managerOptions = members
    .filter((m) => m.role === 'admin' || m.role === 'Manager')
    .map((m) => m.user)
    .filter((u) => u?._id);

  useEffect(() => {
    if (!showAddModal) return;
    if (newMemberRole === 'member' || newMemberRole === 'Manager') {
      const isValid = managerOptions.some((manager) => manager._id === newMemberManager);
      if (!isValid) {
        setNewMemberManager('');
      }
    } else {
      setNewMemberManager('');
    }
  }, [showAddModal, newMemberRole, managerOptions, newMemberManager]);

  useEffect(() => {
    if (!showEditModal) return;
    if (editRole === 'member' || editRole === 'Manager') {
      const isValid = managerOptions.some((manager) => manager._id === editManager);
      if (!isValid) {
        setEditManager('');
      }
    } else {
      setEditManager('');
    }
  }, [showEditModal, editRole, managerOptions, editManager]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/teams/${teamId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="w-6 h-6 mr-2" />
                Team Members
              </h1>
              <p className="text-gray-600 mt-1">
                {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
              </p>
            </div>
            {canManageMembers && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Enter Search members"
              value={searchTerm}
              onChange={handleSearch}
              className="input-field"
            />
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <TableHeader
                columns={[
                  { field: 'user.name', label: 'Name', sortable: true },
                  { field: 'user.email', label: 'Email', sortable: true },
                  { field: 'role', label: 'Role', sortable: true },
                  { field: 'reportingManager.name', label: 'Manager', sortable: true },
                  { field: 'joinedAt', label: 'Joined', sortable: true },
                  { field: 'actions', label: 'Actions', sortable: false }
                ]}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <tbody className="divide-y divide-gray-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No team members found
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-blue-600">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{member.user.name}</p>
                            {member.customTitle && (
                              <p className="text-xs text-gray-500 truncate">{member.customTitle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{member.user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {member.reportingManager?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canManageMembers && member.user._id !== currentTeam?.owner && (
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === member._id ? null : member._id)}
                              className="p-2 hover:bg-gray-100 rounded-full"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>

                            {actionMenuOpen === member._id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                  onClick={() => openEditModal(member)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit Role
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(member)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalMembers}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                {loadingUsers ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                  </div>
                ) : (
                  <MultiSelectDropdown
                    options={availableUsers}
                    selectedValues={selectedUsers}
                    onChange={setSelectedUsers}
                    label="Select Users *"
                    placeholder="Select Users"
                    displayField="name"
                    valueField="_id"
                  />
                )}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="input-field appearance-none bg-white"
                  style={{ height: '42px' }}
                >
                  <option value="member">Member</option>
                  <option value="Manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">SME</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager
                </label>
                <select
                  value={newMemberManager}
                  onChange={(e) => setNewMemberManager(e.target.value)}
                  className="input-field appearance-none bg-white"
                  style={{ height: '42px' }}
                >
                  <option value="">None</option>
                  {managerOptions.map((manager) => (
                    <option key={manager._id} value={manager._id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>
              {addErrors && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {addErrors}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedUsers([]);
                    setNewMemberRole('member');
                    setNewMemberManager('');
                    setAddErrors('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={adding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={adding}
                >
                  {adding ? 'Adding...' : 'Add Members'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Member Role</h2>
            <p className="text-gray-600 mb-4">{selectedMember.user.name}</p>
            <form onSubmit={handleEditMember}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="input-field appearance-none bg-white"
                  style={{ height: '42px' }}
                >
                  <option value="member">Member</option>
                  <option value="Manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">SME</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager
                </label>
                <select
                  value={editManager}
                  onChange={(e) => setEditManager(e.target.value)}
                  className="input-field appearance-none bg-white"
                  style={{ height: '42px' }}
                >
                  <option value="">None</option>
                  {managerOptions
                    .filter((manager) => manager._id !== selectedMember.user._id)
                    .map((manager) => (
                      <option key={manager._id} value={manager._id}>
                        {manager.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
