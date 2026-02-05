import { createContext, useContext, useState, useEffect } from 'react';
import teamService from '../services/teamService';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const TeamContext = createContext();

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export const TeamProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentTeam, setCurrentTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [teamMembership, setTeamMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resetTeamState = () => {
    setCurrentTeam(null);
    setTeams([]);
    setTeamMembership(null);
    setError(null);
    setLoading(false);
  };

  // Load teams when authenticated user changes
  useEffect(() => {
    if (user) {
      loadTeams();
    } else {
      resetTeamState();
      localStorage.removeItem('currentTeamId');
    }
  }, [user]);

  // Load teams from API
  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeams();
      const teamsData = response.data || [];
      setTeams(teamsData);

      // Auto-select first team or load from localStorage
      const savedTeamId = localStorage.getItem('currentTeamId');
      if (savedTeamId && teamsData.find(t => t._id === savedTeamId)) {
        await selectTeam(savedTeamId);
      } else if (teamsData.length > 0) {
        await selectTeam(teamsData[0]._id);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError(err.response?.data?.message || 'Failed to load teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // Select a team
  const selectTeam = async (teamId) => {
    try {
      const response = await teamService.getTeam(teamId);
      const teamData = response.data;

      setCurrentTeam(teamData);
      setTeamMembership({
        role: teamData.userRole,
        permissions: teamData.userPermissions
      });

      // Save to localStorage
      localStorage.setItem('currentTeamId', teamId);

      return teamData;
    } catch (err) {
      console.error('Error selecting team:', err);
      toast.error(err.response?.data?.message || 'Failed to select team');
      throw err;
    }
  };

  // Create a new team
  const createTeam = async (teamData) => {
    try {
      const response = await teamService.createTeam(teamData);
      const newTeam = response.data;

      // Reload teams to include new one
      await loadTeams();

      // Select the new team
      await selectTeam(newTeam._id);

      toast.success('Team created successfully');
      return newTeam;
    } catch (err) {
      console.error('Error creating team:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create team';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Update current team
  const updateTeam = async (teamData) => {
    try {
      if (!currentTeam) {
        throw new Error('No team selected');
      }

      const response = await teamService.updateTeam(currentTeam._id, teamData);
      const updatedTeam = response.data;

      setCurrentTeam(updatedTeam);

      // Update in teams list
      setTeams(teams.map(t => t._id === updatedTeam._id ? updatedTeam : t));

      toast.success('Team updated successfully');
      return updatedTeam;
    } catch (err) {
      console.error('Error updating team:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update team';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Delete team
  const deleteTeam = async (teamId) => {
    try {
      await teamService.deleteTeam(teamId);

      // Remove from teams list
      setTeams(teams.filter(t => t._id !== teamId));

      // If current team was deleted, select another
      if (currentTeam && currentTeam._id === teamId) {
        const remainingTeams = teams.filter(t => t._id !== teamId);
        if (remainingTeams.length > 0) {
          await selectTeam(remainingTeams[0]._id);
        } else {
          setCurrentTeam(null);
          setTeamMembership(null);
          localStorage.removeItem('currentTeamId');
        }
      }

      toast.success('Team deleted successfully');
    } catch (err) {
      console.error('Error deleting team:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete team';
      toast.error(errorMsg);
      throw err;
    }
  };

  // Check if user has team permission
  const hasTeamPermission = (permission) => {
    if (!teamMembership) return false;

    // Admin role has all permissions
    if (teamMembership.role === 'admin') {
      return true;
    }

    // Check specific permission
    return teamMembership.permissions?.[permission] === true;
  };

  // Check if user has project permission
  const hasProjectPermission = (projectRole, permission) => {
    // Admin role has all permissions
    if (teamMembership?.role === 'admin') {
      return true;
    }

    // Define permission mappings (simplified)
    const projectPermissions = {
      owner: ['edit', 'delete', 'manage_members', 'manage_sprints', 'assign_tasks'],
      manager: ['edit', 'manage_sprints', 'assign_tasks'],
      contributor: ['assign_tasks', 'create_task'],
      viewer: ['view']
    };

    const allowedPermissions = projectPermissions[projectRole] || [];
    return allowedPermissions.includes(permission);
  };

  // Check if user is admin
  const isAdmin = () => {
    return teamMembership?.role === 'admin';
  };

  // Check if user is owner
  const isOwner = () => {
    return currentTeam && currentTeam.owner === currentTeam.userId;
  };

  // Check if user is Manager
  const isProjectManager = () => {
    return teamMembership?.role === 'project_manager';
  };

  // Check if user is SME (viewer role with restricted access)
  const isSME = () => {
    return teamMembership?.role === 'viewer' || teamMembership?.role === 'sme';
  };

  // Check if user is regular member
  const isMember = () => {
    return teamMembership?.role === 'member';
  };

  const value = {
    currentTeam,
    teams,
    teamMembership,
    loading,
    error,
    loadTeams,
    selectTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    hasTeamPermission,
    hasProjectPermission,
    isAdmin,
    isOwner,
    isProjectManager,
    isSME,
    isMember
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export default TeamContext;
