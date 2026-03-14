import { useState, useEffect } from 'react';
import { useTeam } from '../context/TeamContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Trash2, ChevronsLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const TeamSettings = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { currentTeam, updateTeam, deleteTeam, isAdmin, isOwner } = useTeam();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timezone: 'UTC',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    defaultSprintDuration: 14
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentTeam) {
      setFormData({
        name: currentTeam.name || '',
        description: currentTeam.description || '',
        timezone: currentTeam.settings?.timezone || 'UTC',
        workingHoursStart: currentTeam.settings?.workingHours?.start || '09:00',
        workingHoursEnd: currentTeam.settings?.workingHours?.end || '17:00',
        defaultSprintDuration: currentTeam.settings?.defaultSprintDuration || 14
      });
    }
  }, [currentTeam]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin()) {
      toast.error('Only admins can update team settings');
      return;
    }

    try {
      setSaving(true);
      await updateTeam({
        name: formData.name,
        description: formData.description,
        settings: {
          timezone: formData.timezone,
          workingHours: {
            start: formData.workingHoursStart,
            end: formData.workingHoursEnd
          },
          defaultSprintDuration: parseInt(formData.defaultSprintDuration)
        }
      });
    } catch (error) {
      console.error('Error updating team:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!isAdmin()) {
      toast.error('Only admins can delete the team');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTeam(teamId);
      navigate('/teams');
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/teams/${teamId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronsLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
            {/* Delete */}
            {isAdmin() && (
            <div className="px-6 py-4 border-t border-gray-200 bg-red-50">
              <h2 className="text-lg font-semibold text-red-900 mb-2">Delete Team</h2>
              <p className="text-sm text-red-700 mb-4">
                Once you delete a team, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Team
              </button>
            </div>
          )}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
            <p className="text-gray-600 mt-1">Manage your team's configuration</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={!isAdmin()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-field"
                    rows="3"
                    disabled={!isAdmin()}
                  />
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Working Hours</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="input-field"
                    disabled={!isAdmin()}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Kolkata">India</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="workingHoursStart"
                    value={formData.workingHoursStart}
                    onChange={handleChange}
                    className="input-field"
                    disabled={!isAdmin()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="workingHoursEnd"
                    value={formData.workingHoursEnd}
                    onChange={handleChange}
                    className="input-field"
                    disabled={!isAdmin()}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            {isAdmin() && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>

        
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTeam}
        itemName={currentTeam?.name || ''}
        itemType="team"
        loading={isDeleting}
      />
    </div>
  );
};

export default TeamSettings;
