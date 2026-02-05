import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import teamService from '../services/teamService';

const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6'  // Teal
];

function getRandomProjectColor() {
  return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
}

const ProjectModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { currentTeam } = useTeam();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: getRandomProjectColor(),
    teamLeadId: '',
    members: []
  });
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        color: initialData.color || '#3B82F6',
        teamLeadId: initialData.teamLead?._id || '',
        members: []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: getRandomProjectColor(),
        teamLeadId: '',
        members: []
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && !initialData && currentTeam) {
      fetchTeamMembers();
    }
  }, [isOpen, initialData, currentTeam]);

  const fetchTeamMembers = async () => {
    if (!currentTeam) return;
    
    try {
      setLoadingMembers(true);
      const response = await teamService.getTeamMembers(currentTeam._id);
      const members = response.data || [];
      setTeamMembers(members.filter(m => m.status === 'active'));
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Project Name"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter Project Description"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Team Lead Selection - Only when creating */}
          {!initialData && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Lead
                </label>
                <select
                  value={formData.teamLeadId}
                  onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Team Lead</option>
                  {teamMembers.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Team Members Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Team Members
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                  {loadingMembers ? (
                    <div className="text-center py-4 text-gray-500">Loading members...</div>
                  ) : teamMembers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No team members available</div>
                  ) : (
                    teamMembers.map((member) => (
                      <label
                        key={member.user._id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.members.includes(member.user._id)}
                          onChange={() => toggleMember(member.user._id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{member.user.name}</span>
                          <span className="text-xs text-gray-500">({member.role})</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {formData.members.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.members.length} member(s) selected
                  </p>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;