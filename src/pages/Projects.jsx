import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { useSprint } from '../context/SprintContext';
import ProjectSidebar from '../components/ProjectSidebar';
import TrackingBoard from '../components/TrackingBoard';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import teamService from '../services/teamService';
import projectMemberService from '../services/projectMemberService';
import sprintService from '../services/sprintService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import MultiSelectDropdown from '../components/shared/MultiSelectDropdown';
import { Folder, User, UserPlus, X, Users, Trash2, Plus, Calendar, ClipboardList } from 'lucide-react';

const Projects = () => {
  const { currentTeam, isAdmin, selectTeam } = useTeam();
  const { user, isSystemAdmin } = useAuth();
  const { currentSprint, sprints, backlog, loadSprints, loadBacklog, clearSprintData } = useSprint();
  const navigate = useNavigate();
  const { teamId: teamIdParam, projectId: projectIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const taskIdParam = searchParams.get('taskId');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectAssignees, setProjectAssignees] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [membersToAdd, setMembersToAdd] = useState([]);
  const [taskFilter, setTaskFilter] = useState('all');
  const [sprintLoading, setSprintLoading] = useState(false);
  const [backlogLoading, setBacklogLoading] = useState(false);
  const [sprintIndex, setSprintIndex] = useState(0);
  const [sprintTasks, setSprintTasks] = useState([]);
  const [sprintTasksLoading, setSprintTasksLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, task: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (teamIdParam && (!currentTeam || currentTeam._id !== teamIdParam)) {
      selectTeam(teamIdParam).catch((error) => {
        console.error('Error selecting team from route:', error);
      });
    }
  }, [teamIdParam, currentTeam, selectTeam]);

  useEffect(() => {
    if (!currentTeam) {
      navigate('/teams');
      return;
    }
    fetchProjects();
    fetchTeamMembers();
  }, [currentTeam, navigate]);

  useEffect(() => {
    if (selectedProject && currentTeam) {
      fetchTasks(selectedProject._id);
      fetchProjectAssignees(selectedProject._id);
      loadSprintData(selectedProject._id);
    }
  }, [selectedProject, currentTeam]);

  useEffect(() => {
    if (showMembersModal && selectedProject && currentTeam) {
      fetchProjectMembers(selectedProject._id);
    }
  }, [showMembersModal, selectedProject, currentTeam]);

  useEffect(() => {
    if (!selectedProject) {
      clearSprintData();
    }
  }, [selectedProject, clearSprintData]);


  const [roleFilter, setRoleFilter] = useState('all');

  const filteredProjects = useMemo(() => {
    if (roleFilter === 'all') return projects;
    return projects.filter((project) => {
      const role = project?.userRole;
      const createdById = project.createdBy?._id || project.createdBy;
      const teamLeadId = project.teamLead?._id || project.teamLead;
      const userId = user?._id;

      if (roleFilter === 'owner') {
        return role === 'owner' || (createdById && userId && createdById === userId);
      }
      if (roleFilter === 'lead') {
        return role === 'manager' || (teamLeadId && userId && teamLeadId === userId);
      }
      if (roleFilter === 'sme') {
        return role === 'viewer' || role === 'sme';
      }
      if (roleFilter === 'contributor') {
        return role === 'contributor';
      }
      return true;
    });
  }, [projects, roleFilter, user]);

  useEffect(() => {
    if (projectIdParam && projects.length > 0) {
      const match = projects.find((project) => project._id === projectIdParam);
      if (match && selectedProject?._id !== match._id) {
        setSelectedProject(match);
      }
      return;
    }

    if (!selectedProject && filteredProjects.length > 0) {
      setSelectedProject(filteredProjects[0]);
      return;
    }

    if (selectedProject && !filteredProjects.some(p => p._id === selectedProject._id)) {
      setSelectedProject(filteredProjects[0] || null);
    }
  }, [filteredProjects, selectedProject, projectIdParam, projects]);

  const fetchProjects = async () => {
    if (!currentTeam) return;

    try {
      setLoading(true);
      const response = await projectService.getProjects(currentTeam._id);
      setProjects(response.data);

      if (projectIdParam) {
        const match = response.data.find((project) => project._id === projectIdParam);
        if (match) {
          setSelectedProject(match);
          return;
        }
      }

      // Select first project by default
      if (response.data.length > 0 && !selectedProject) {
        setSelectedProject(response.data[0]);
      }
    } catch (error) {
      toast.error('Error fetching projects');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    if (!currentTeam) return;

    try {
      const response = await teamService.getTeamMembers(currentTeam._id);
      const members = response.data || [];
      setTeamMembers(members.filter(m => m.status === 'active'));
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchProjectMembers = async (projectId) => {
    if (!currentTeam) return;

    try {
      setMembersLoading(true);
      const response = await projectMemberService.getProjectMembers(currentTeam._id, projectId);
      if (response.success) {
        setProjectMembers(response.data || []);
      } else {
        setProjectMembers([]);
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
      toast.error(error.response?.data?.message || 'Error fetching project members');
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchProjectAssignees = async (projectId) => {
    if (!currentTeam) return;

    try {
      const response = await projectMemberService.getProjectMembers(currentTeam._id, projectId);
      const members = response.success ? (response.data || []) : [];
      const users = members.map((pm) => pm.user).filter(Boolean);

      if (selectedProject?.teamLead && !users.some(u => u._id === selectedProject.teamLead._id)) {
        users.push(selectedProject.teamLead);
      }

      const uniqueUsers = Array.from(new Map(users.map(u => [u._id, u])).values());
      setProjectAssignees(uniqueUsers);
    } catch (error) {
      console.error('Error fetching project assignees:', error);
      setProjectAssignees([]);
    }
  };

  const loadSprintData = async (projectId) => {
    try {
      setSprintLoading(true);
      setBacklogLoading(true);
      await Promise.all([loadSprints(projectId), loadBacklog(projectId)]);
    } catch (error) {
      console.error('Error loading sprint data:', error);
    } finally {
      setSprintLoading(false);
      setBacklogLoading(false);
    }
  };

  const fetchTasks = async (projectId) => {
    if (!currentTeam) return;

    try {
      setTasksLoading(true);
      const response = await taskService.getProjectTasks(currentTeam._id, projectId);
      setTasks(response.data);
    } catch (error) {
      toast.error('Error fetching tasks');
      console.error(error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleProjectCreate = async (projectData) => {
    if (!currentTeam) return;

    try {
      const response = await projectService.createProject(currentTeam._id, projectData);
      setProjects([response.data, ...projects]);
      setSelectedProject(response.data);
      toast.success('Project created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating project');
      throw error;
    }
  };

  const handleProjectUpdate = async (projectId, projectData) => {
    if (!currentTeam) return;

    try {
      const response = await projectService.updateProject(currentTeam._id, projectId, projectData);
      setProjects(projects.map(p => p._id === projectId ? response.data : p));
      if (selectedProject?._id === projectId) {
        setSelectedProject(response.data);
      }
      toast.success('Project updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating project');
      throw error;
    }
  };

  const handleProjectDelete = async (projectId) => {
    if (!currentTeam) return;

    try {
      await projectService.deleteProject(currentTeam._id, projectId);
      setProjects(projects.filter(p => p._id !== projectId));

      if (selectedProject?._id === projectId) {
        setSelectedProject(projects.find(p => p._id !== projectId) || null);
      }

      toast.success('Project deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting project');
      throw error;
    }
  };

  const handleTaskCreate = async (taskData) => {
    if (!selectedProject || !currentTeam) return;

    try {
      const response = await taskService.createTask(currentTeam._id, selectedProject._id, taskData);
      setTasks([...tasks, response.data]);
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating task');
      throw error;
    }
  };

  const handleTaskUpdate = async (taskId, taskData) => {
    if (!selectedProject || !currentTeam) return;

    try {
      const response = await taskService.updateTask(currentTeam._id, selectedProject._id, taskId, taskData);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === taskId ? response.data : task))
      );
      toast.success('Task updated successfully!');
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
    if (!selectedProject || !currentTeam || !deleteModal.task) return;

    setIsDeleting(true);
    try {
      await taskService.deleteTask(currentTeam._id, selectedProject._id, deleteModal.task._id);
      setTasks(tasks.filter(t => t._id !== deleteModal.task._id));
      toast.success('Task deleted successfully!');
      setDeleteModal({ isOpen: false, task: null });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus, newPosition, sourceStatus) => {
    if (!selectedProject || !currentTeam) return;

    try {
      // Optimistic UI update to avoid flicker
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) =>
          task._id === taskId ? { ...task, status: newStatus, position: newPosition } : task
        );

        const normalizeColumn = (status) => {
          const columnTasks = updatedTasks
            .filter((task) => task.status === status && task._id !== taskId)
            .sort((a, b) => a.position - b.position);
          if (status === newStatus) {
            columnTasks.splice(newPosition, 0, updatedTasks.find((task) => task._id === taskId));
          }
          return columnTasks.map((task, index) => ({ ...task, position: index }));
        };

        const statuses = ['todo', 'inprogress', 'completed'];
        const normalized = statuses.flatMap((status) => normalizeColumn(status));
        return normalized;
      });

      const response = await taskService.updateTaskStatus(
        currentTeam._id,
        selectedProject._id,
        taskId,
        newStatus,
        newPosition
      );

      setTasks(tasks.map(t => t._id === taskId ? response.data : t));
    } catch (error) {
      toast.error('Error updating task status');
      console.error(error);
      // Revert on error
      fetchTasks(selectedProject._id);
    }
  };

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'assigned') {
      return tasks.filter(task => {
        const assigned = task.assignedTo;
        const assignedId = typeof assigned === 'string'
          ? assigned
          : assigned?._id || assigned?.id;
        if (assignedId && assignedId === user?._id) return true;
        const assignedName = typeof assigned === 'object' ? assigned?.name : null;
        if (assignedName && user?.name && assignedName === user.name) return true;
        const assignedEmail = typeof assigned === 'object' ? assigned?.email : null;
        if (assignedEmail && user?.email && assignedEmail === user.email) return true;
        return false;
      });
    }
    if (taskFilter === 'completed') {
      return tasks.filter(task => task.status === 'completed' || task.status === 'done');
    }
    return tasks;
  }, [tasks, taskFilter, user]);

  const activeSprint = currentSprint || sprints.find(s => s.status === 'active') || null;

  const sprintTimeline = useMemo(() => {
    return [...sprints].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [sprints]);

  useEffect(() => {
    if (!sprintTimeline.length) {
      setSprintIndex(0);
      return;
    }
    const activeIndex = activeSprint
      ? sprintTimeline.findIndex((s) => s._id === activeSprint._id)
      : 0;
    setSprintIndex(activeIndex >= 0 ? activeIndex : 0);
  }, [sprintTimeline, activeSprint]);

  const displayedSprint = sprintTimeline[sprintIndex] || activeSprint;

  useEffect(() => {
    if (!displayedSprint || !currentTeam || !selectedProject) {
      setSprintTasks([]);
      return;
    }

    const loadDisplayedSprintTasks = async () => {
      try {
        setSprintTasksLoading(true);
        const response = await sprintService.getSprint(
          currentTeam._id,
          selectedProject._id,
          displayedSprint._id
        );
        const tasksForSprint = response?.data?.tasks || [];
        setSprintTasks(Array.isArray(tasksForSprint) ? tasksForSprint : []);
      } catch (error) {
        console.error('Error loading sprint tasks:', error);
        setSprintTasks([]);
      } finally {
        setSprintTasksLoading(false);
      }
    };

    loadDisplayedSprintTasks();
  }, [displayedSprint, currentTeam, selectedProject]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getDefaultSprintWindow = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 13);
    return { start, end };
  };

  const handleAssignTeamLead = async (teamLeadId) => {
    if (!selectedProject || !currentTeam) return;

    try {
      setAssigning(true);
      const response = await projectService.assignTeamLead(
        currentTeam._id,
        selectedProject._id,
        teamLeadId
      );

      if (response.success) {
        // Update selected project
        setSelectedProject(response.data);
        // Update in projects list
        setProjects(projects.map(p => 
          p._id === selectedProject._id ? response.data : p
        ));
        toast.success(response.message || 'Team lead assigned successfully');
        setShowAssignModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error assigning team lead');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveTeamLead = async () => {
    if (!selectedProject || !currentTeam) return;

    try {
      setAssigning(true);
      const response = await projectService.assignTeamLead(
        currentTeam._id,
        selectedProject._id,
        null
      );

      if (response.success) {
        // Update selected project
        setSelectedProject(response.data);
        // Update in projects list
        setProjects(projects.map(p => 
          p._id === selectedProject._id ? response.data : p
        ));
        toast.success(response.message || 'Team lead removed successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error removing team lead');
    } finally {
      setAssigning(false);
    }
  };

  const canManageMembers = () => {
    const isTeamLead = !!(selectedProject?.teamLead?._id && user?._id && selectedProject.teamLead._id === user._id);
    const isProjectManager = selectedProject?.userRole === 'owner' || selectedProject?.userRole === 'manager';
    return isSystemAdmin?.() || isTeamLead || isProjectManager;
  };

  const handleAddProjectMember = async () => {
    if (!selectedProject || !currentTeam || membersToAdd.length === 0) return;

    try {
      setMemberActionLoading(true);
      const results = await Promise.allSettled(
        membersToAdd.map((userId) =>
          projectMemberService.addProjectMember(currentTeam._id, selectedProject._id, {
            userId,
            role: 'contributor'
          })
        )
      );

      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failureCount = results.filter((result) => result.status === 'rejected').length;

      if (successCount > 0) {
        toast.success(`${successCount} member${successCount === 1 ? '' : 's'} added successfully`);
        setMembersToAdd([]);
        await fetchProjectMembers(selectedProject._id);
      }

      if (failureCount > 0) {
        toast.error(`Failed to add ${failureCount} member${failureCount === 1 ? '' : 's'}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding members');
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveProjectMember = async (memberUserId) => {
    if (!selectedProject || !currentTeam) return;

    try {
      setMemberActionLoading(true);
      const response = await projectMemberService.removeProjectMember(
        currentTeam._id,
        selectedProject._id,
        memberUserId
      );

      if (response.success) {
        toast.success(response.message || 'Member removed');
        await fetchProjectMembers(selectedProject._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error removing member');
    } finally {
      setMemberActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <ProjectSidebar
        projects={filteredProjects}
        selectedProject={selectedProject}
        onProjectSelect={setSelectedProject}
        onProjectCreate={handleProjectCreate}
        onProjectUpdate={handleProjectUpdate}
        onProjectDelete={handleProjectDelete}
        currentUser={user}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedProject ? (
          <>
            {/* Project Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: selectedProject.color + '20' }}
                  >
                    <Folder
                      className="w-6 h-6"
                      style={{ color: selectedProject.color }}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {selectedProject.name}
                    </h1>
                    {selectedProject.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedProject.description}
                      </p>
                    )}
                    {selectedProject.teamLead && (
                      <div className="flex items-center gap-2 mt-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Team Lead: <span className="font-medium">{selectedProject.teamLead.name}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canManageMembers() && (
                    <button
                      onClick={() => setShowMembersModal(true)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Manage Members
                    </button>
                  )}
                  {isAdmin?.() && (
                    <>
                      {selectedProject.teamLead && (
                        <button
                          onClick={handleRemoveTeamLead}
                          disabled={assigning}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove Team Lead
                        </button>
                      )}
                      <button
                        onClick={() => setShowAssignModal(true)}
                        disabled={assigning}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        {selectedProject.teamLead ? 'Change Team Lead' : 'Assign Team Lead'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sprint & Backlog Overview */}
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Sprint Tracker</h3>
                    </div>
                    {displayedSprint && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                        {displayedSprint.status}
                      </span>
                    )}
                  </div>
                  {sprintLoading ? (
                    <p className="text-sm text-gray-500">Loading sprint...</p>
                  ) : displayedSprint ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{displayedSprint.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(displayedSprint.startDate)} - {formatDate(displayedSprint.endDate)}
                      </p>
                      {sprintTimeline.length > 1 && (
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Select Sprint Range
                          </label>
                          <select
                            value={displayedSprint?._id || ''}
                            onChange={(e) => {
                              const nextId = e.target.value;
                              const nextIndex = sprintTimeline.findIndex((s) => s._id === nextId);
                              if (nextIndex >= 0) setSprintIndex(nextIndex);
                            }}
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-gray-700"
                          >
                            {sprintTimeline.map((sprint) => (
                              <option key={sprint._id} value={sprint._id}>
                                {sprint.name} • {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Tasks in this sprint: {sprintTasks.length}
                        </p>
                        {sprintTasksLoading ? (
                          <p className="text-sm text-gray-500">Loading sprint tasks...</p>
                        ) : sprintTasks.length > 0 ? (
                          <ul className="space-y-2">
                            {sprintTasks.slice(0, 5).map((task) => (
                              <li key={task._id} className="text-sm text-gray-700 flex items-center justify-between">
                                <span className="truncate">{task.title}</span>
                                <span className="text-xs text-gray-400">{task.status}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">No tasks for this sprint</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setSprintIndex((prev) => Math.min(sprintTimeline.length - 1, prev + 1))}
                          disabled={sprintIndex >= sprintTimeline.length - 1}
                          className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setSprintIndex((prev) => Math.max(0, prev - 1))}
                          disabled={sprintIndex <= 0}
                          className="px-2 py-1 text-xs border border-gray-300 rounded text-gray-600 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </>
                  ) : (
                    (() => {
                      const { start, end } = getDefaultSprintWindow();
                      return (
                        <>
                          <p className="text-sm font-medium text-gray-900">Current Sprint (14 days)</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(start)} - {formatDate(end)}
                          </p>
                        </>
                      );
                    })()
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Backlog</h3>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                      {backlog.length} tasks
                    </span>
                  </div>
                  {backlogLoading ? (
                    <p className="text-sm text-gray-500">Loading backlog...</p>
                  ) : backlog.length > 0 ? (
                    <ul className="space-y-2">
                      {backlog.slice(0, 5).map((task) => (
                        <li key={task._id} className="text-sm text-gray-700 flex items-center justify-between">
                          <span className="truncate">{task.title}</span>
                          <span className="text-xs text-gray-400">{task.priority}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No backlog items</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Tasks View</label>
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tasks</option>
                  <option value="assigned">Assigned To Me</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Assign Team Lead Modal */}
            {showAssignModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Assign Team Lead
                    </h3>
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Select a team member to assign as team lead for "{selectedProject.name}"
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {teamMembers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No team members available</p>
                      ) : (
                        teamMembers.map((member) => (
                          <button
                            key={member.user._id}
                            onClick={() => handleAssignTeamLead(member.user._id)}
                            disabled={assigning || selectedProject.teamLead?._id === member.user._id}
                            className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                          >
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {member.user.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {member.user.email} • {member.role}
                              </div>
                            </div>
                            {selectedProject.teamLead?._id === member.user._id && (
                              <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                Current
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Manage Members Modal */}
            {showMembersModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Manage Project Members
                    </h3>
                    <button
                      onClick={() => setShowMembersModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="px-6 py-4 space-y-6">
                    <div>
                      <p className="text-sm text-gray-600">
                        Project: <span className="font-medium text-gray-900">{selectedProject.name}</span>
                      </p>
                    </div>

                    {/* Add Member */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Add team members</h4>
                      </div>
                      <div className="space-y-3">
                        <MultiSelectDropdown
                          options={teamMembers
                            .filter((tm) => {
                              const tmUserId = tm.user?._id;
                              return tmUserId && !projectMembers.some((pm) => pm.user?._id === tmUserId);
                            })
                            .map((tm) => ({
                              _id: tm.user._id,
                              name: tm.user.name,
                              email: tm.user.email,
                              role: tm.role
                            }))}
                          selectedValues={membersToAdd}
                          onChange={setMembersToAdd}
                          label="Select Team Members"
                          placeholder="Select Team Members"
                          displayField="name"
                          valueField="_id"
                        />
                        <button
                          onClick={handleAddProjectMember}
                          disabled={membersToAdd.length === 0 || memberActionLoading}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {memberActionLoading ? 'Adding...' : `Add ${membersToAdd.length > 0 ? `(${membersToAdd.length})` : ''}`}
                        </button>
                      </div>
                    </div>

                    {/* Current Members */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Current members</h4>
                      </div>

                      {membersLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading project members...</div>
                      ) : projectMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No members found</div>
                      ) : (
                        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                          {projectMembers.map((pm) => {
                            const isOwner = pm.role === 'owner';
                            return (
                              <div key={pm._id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {pm.user?.name || 'Unknown'}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {pm.user?.email || 'N/A'} • {pm.role}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRemoveProjectMember(pm.user?._id)}
                                  disabled={memberActionLoading || isOwner}
                                  className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  title={isOwner ? 'Cannot remove project owner' : 'Remove member'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={() => setShowMembersModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden">
              <TrackingBoard
                tasks={filteredTasks}
                loading={tasksLoading}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
                assignees={projectAssignees}
                teamId={currentTeam?._id}
                projectId={selectedProject?._id}
                initialTaskId={taskIdParam}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Project Selected
              </h2>
              <p className="text-gray-600">
                Select a project from the sidebar or create a new one to get started
              </p>
            </div>
          </div>
        )}
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

export default Projects;
