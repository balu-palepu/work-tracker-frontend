import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Settings, ArrowRight, Shield } from 'lucide-react';

const TeamSelection = () => {
  const navigate = useNavigate();
  const { teams, loading, selectTeam, createTeam } = useTeam();
  const { isSystemAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSelectTeam = async (teamId) => {
    try {
      await selectTeam(teamId);
      navigate(`/teams/${teamId}`);
    } catch (error) {
      console.error('Error selecting team:', error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      setCreating(true);
      const team = await createTeam({
        name: newTeamName,
        description: newTeamDescription
      });
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
      navigate(`/teams/${team._id}`);
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Select a Team</h1>
          <p className="text-gray-600">Choose a team to continue or create a new one</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {teams.map((team) => (
            <div
              key={team._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleSelectTeam(team._id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {team.userRole}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
              {team.description && (
                <p className="text-gray-600 text-sm mb-4">{team.description}</p>
              )}
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                <span>{team.memberCount || 1} members</span>
              </div>
            </div>
          ))}

          {/* Create New Team Card - Only for Admins */}
          {isSystemAdmin() ? (
            <div
              className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer flex items-center justify-center"
              onClick={() => setShowCreateModal(true)}
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Create New Team</h3>
                <p className="text-gray-600 text-sm">Start collaborating with your team</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg shadow-md p-6 border-2 border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-1">Admin Only</h3>
                <p className="text-gray-500 text-sm">Only admins can create teams</p>
              </div>
            </div>
          )}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No teams yet</h3>
            {isSystemAdmin() ? (
              <>
                <p className="text-gray-600 mb-4">Create your first team to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary inline-flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Team
                </button>
              </>
            ) : (
              <p className="text-gray-600 mb-4">
                You haven't been assigned to any teams yet. Please contact your administrator.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="input-field"
                  placeholder="Enter Team Name"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Enter Team Description"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeamName('');
                    setNewTeamDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={creating || !newTeamName.trim()}
                >
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSelection;
