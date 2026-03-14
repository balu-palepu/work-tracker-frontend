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
import reportService from '../services/reportService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';
import MultiSelectDropdown from '../components/shared/MultiSelectDropdown';
import DownloadReportButton from '../components/shared/DownloadReportButton';
import HierarchyView from '../components/project/HierarchyView';
import ListView from '../components/project/ListView';
import FilterBar, { applyFilters } from '../components/project/FilterBar';
import ProjectAnalytics from '../components/project/ProjectAnalytics';
import SprintSelectorBar from '../components/project/SprintSelectorBar';
import SprintCalendarView from '../components/project/SprintCalendarView';
import { Folder, User, X, Users, Trash2, Plus, Calendar, CalendarDays, ClipboardList, LayoutGrid, List, GitBranch } from 'lucide-react';

const Projects = () => {
  const { currentTeam, isAdmin, selectTeam, loading: teamLoading } = useTeam();
  const { user, isSystemAdmin, loading: authLoading } = useAuth();
  const { sprints, backlog, loadSprints, loadBacklog, clearSprintData } = useSprint();
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
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [sprintLoading, setSprintLoading] = useState(false);
  const [backlogLoading, setBacklogLoading] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, task: null });
  const [isDeleting, setIsDeleting] = useState(false);
  // Initialize teamSelecting to true if we have a teamIdParam to prevent premature redirects
  const [teamSelecting, setTeamSelecting] = useState(!!teamIdParam);

  useEffect(() => {
    if (teamIdParam && (!currentTeam || currentTeam._id !== teamIdParam)) {
      setTeamSelecting(true);
      selectTeam(teamIdParam)
        .catch((error) => {
          console.error('Error selecting team from route:', error);
        })
        .finally(() => {
          setTeamSelecting(false);
        });
    } else if (teamIdParam && currentTeam && currentTeam._id === teamIdParam) {
      // Team is already selected correctly, clear the selecting state
      setTeamSelecting(false);
    }
  }, [teamIdParam, currentTeam, selectTeam]);

  useEffect(() => {
    // Don't redirect while auth or team is still loading or being selected from URL
    if (authLoading || teamLoading || teamSelecting) return;

    // If we have a teamId in URL but no currentTeam yet, wait for selectTeam to complete
    if (teamIdParam && !currentTeam) return;

    if (!currentTeam) {
      navigate('/teams');
      return;
    }
    fetchProjects();
    fetchTeamMembers();
  }, [currentTeam, authLoading, teamLoading, teamSelecting, teamIdParam, navigate]);

  useEffect(() => {
    if (selectedProject && currentTeam) {
      clearSprintData();
      fetchTasks(selectedProject._id);
      fetchProjectAssignees(selectedProject._id);
      loadSprintData(selectedProject._id);
    }
  }, [selectedProject, currentTeam, clearSprintData]);

  useEffect(() => {
    // Prevent stale filters from hiding items after project change
    setTaskFilter('all');
    setWorkTypeFilter('all');
    setActiveFilters([]);
    setSelectedSprintId('');
  }, [selectedProject?._id]);

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
  const [viewMode, setViewMode] = useState('board');
  const [boardSubView, setBoardSubView] = useState(() => localStorage.getItem('boardSubView') || 'board');
  const [activeFilters, setActiveFilters] = useState([]);
  const projectPreferenceKey = useMemo(() => {
    if (!currentTeam?._id || !user?._id) return null;
    return `last_selected_project_${user._id}_${currentTeam._id}`;
  }, [currentTeam, user]);

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

  const workflowStatuses = useMemo(() => {
    const statuses =
      selectedProject?.workflowStatuses ||
      selectedProject?.workflow?.workflowStatuses ||
      selectedProject?.workflow?.statuses;

    if (Array.isArray(statuses) && statuses.length > 0) {
      return [...statuses]
        .map((s) => {
          if (s.id === 'new') return { ...s, id: 'todo', label: 'To Do' };
          if (s.id === 'active') return { ...s, id: 'inprogress', label: 'In Progress' };
          if (s.id === 'resolved' || s.id === 'closed') {
            return { ...s, id: 'resolved', label: 'Completed/Closed' };
          }
          return s;
        })
        .filter((s) => s.id !== 'closed')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    return [
      { id: 'todo', label: 'To Do', category: 'todo', color: '#6B7280', order: 0 },
      { id: 'inprogress', label: 'In Progress', category: 'inprogress', color: '#3B82F6', order: 1 },
      { id: 'resolved', label: 'Completed/Closed', category: 'completed', color: '#10B981', order: 2 },
    ];
  }, [selectedProject]);

  const workItemTypes = useMemo(() => {
    if (Array.isArray(selectedProject?.workItemTypes) && selectedProject.workItemTypes.length > 0) {
      return selectedProject.workItemTypes;
    }
    return ['epic', 'feature', 'story', 'task', 'bug', 'subtask'];
  }, [selectedProject]);

  useEffect(() => {
    const persistedProjectId = projectPreferenceKey
      ? localStorage.getItem(projectPreferenceKey)
      : null;

    if (projectIdParam && projects.length > 0) {
      const match = projects.find((project) => project._id === projectIdParam);
      if (match && selectedProject?._id !== match._id) {
        setSelectedProject(match);
      }
      return;
    }

    if (!projectIdParam && persistedProjectId && filteredProjects.length > 0) {
      const persistedProject = filteredProjects.find((project) => project._id === persistedProjectId);
      if (persistedProject && selectedProject?._id !== persistedProject._id) {
        setSelectedProject(persistedProject);
        return;
      }
    }

    if (!selectedProject && filteredProjects.length > 0) {
      const persistedProject = persistedProjectId
        ? filteredProjects.find((project) => project._id === persistedProjectId)
        : null;
      setSelectedProject(persistedProject || filteredProjects[0]);
      return;
    }

    if (selectedProject && !filteredProjects.some(p => p._id === selectedProject._id)) {
      const persistedProject = persistedProjectId
        ? filteredProjects.find((project) => project._id === persistedProjectId)
        : null;
      setSelectedProject(persistedProject || filteredProjects[0] || null);
    }
  }, [filteredProjects, selectedProject, projectIdParam, projects, projectPreferenceKey]);

  useEffect(() => {
    if (!projectPreferenceKey || !selectedProject?._id) return;
    localStorage.setItem(projectPreferenceKey, selectedProject._id);
  }, [selectedProject, projectPreferenceKey]);

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

      if (projectPreferenceKey) {
        const persistedProjectId = localStorage.getItem(projectPreferenceKey);
        if (persistedProjectId === projectId) {
          localStorage.removeItem(projectPreferenceKey);
        }
      }

      if (selectedProject?._id === projectId) {
        setSelectedProject(projects.find(p => p._id !== projectId) || null);
      }

      toast.success('Project deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting project');
      throw error;
    }
  };

  const handleProjectSelect = (project) => {
    if (!project) return;
    setSelectedProject(project);
    if (currentTeam?._id) {
      navigate(`/teams/${currentTeam._id}/projects/${project._id}`);
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

  const handleTaskStatusChange = async (taskId, newStatus, newPosition, sourceStatus, sourceIndex, completionData = {}) => {
    if (!selectedProject || !currentTeam) return;

    try {
      const boardStatuses = workflowStatuses.map((s) => s.id);
      // Optimistic update without dropping tasks from unmatched columns
      setTasks((prevTasks) => {
        const updatedTasks = prevTasks.map((task) =>
          task._id === taskId ? { ...task, status: newStatus, position: newPosition ?? 0 } : task
        );

        const normalizeColumn = (status) => {
          const columnTasks = updatedTasks
            .filter((task) => task.status === status && task._id !== taskId)
            .sort((a, b) => a.position - b.position);
          if (status === newStatus && typeof newPosition === 'number') {
            const movedTask = updatedTasks.find((task) => task._id === taskId);
            if (movedTask) {
              columnTasks.splice(newPosition, 0, movedTask);
            }
          }
          return columnTasks.map((task, index) => ({ ...task, position: index }));
        };

        const normalizedByColumn = boardStatuses.flatMap((status) => normalizeColumn(status));
        const normalizedMap = new Map(normalizedByColumn.map((task) => [task._id, task]));
        return updatedTasks.map((task) => normalizedMap.get(task._id) || task);
      });

      const response = await taskService.updateTaskStatus(
        currentTeam._id,
        selectedProject._id,
        taskId,
        newStatus,
        newPosition,
        completionData
      );

      setTasks((prevTasks) => prevTasks.map((t) => (t._id === taskId ? response.data : t)));
    } catch (error) {
      toast.error('Error updating task status');
      console.error(error);
      // Revert on error
      fetchTasks(selectedProject._id);
    }
  };

  const handleInlineStatusChange = async (taskId, newStatus, completionData = {}) => {
    const currentTask = tasks.find((task) => task._id === taskId);
    if (!currentTask || !selectedProject || !currentTeam) return;

    const targetWorkflow = workflowStatuses.find((s) => s.id === newStatus);
    const isCompletedTarget =
      targetWorkflow?.category === 'completed' ||
      newStatus === 'completed' ||
      newStatus === 'resolved' ||
      newStatus === 'closed';

    if (isCompletedTarget && !completionData?.completionReason) {
      // Navigate to completion page instead of opening modal
      navigate(`/teams/${currentTeam._id}/projects/${selectedProject._id}/tasks/${taskId}/complete?targetStatus=${newStatus}`);
      return;
    }

    try {
      const response = await taskService.updateTaskStatus(
        currentTeam._id,
        selectedProject._id,
        taskId,
        newStatus,
        currentTask.position ?? 0,
        completionData
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === taskId ? response.data : task))
      );
      toast.success('Task status updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating task status');
    }
  };

  // Navigation callbacks (replace modal-based create/edit/view)
  const navigateToCreateTask = () => {
    if (!selectedProject || !currentTeam) return;
    const sprintQuery = selectedSprintId === 'backlog' ? 'none'
      : (selectedSprintId && selectedSprintId !== 'all' ? selectedSprintId : '');
    const query = sprintQuery ? `?sprint=${sprintQuery}` : '';
    navigate(`/teams/${currentTeam._id}/projects/${selectedProject._id}/tasks/new${query}`);
  };

  const navigateToTask = (taskId) => {
    if (!selectedProject || !currentTeam) return;
    navigate(`/teams/${currentTeam._id}/projects/${selectedProject._id}/tasks/${taskId}`);
  };

  const navigateToCompleteTask = (taskId, targetStatus) => {
    if (!selectedProject || !currentTeam) return;
    navigate(`/teams/${currentTeam._id}/projects/${selectedProject._id}/tasks/${taskId}/complete${targetStatus ? `?targetStatus=${targetStatus}` : ''}`);
  };

  const advancedFilteredTasks = useMemo(() => {
    return applyFilters(tasks, activeFilters);
  }, [tasks, activeFilters]);

  const getTaskSprintId = (task) => {
    if (!task?.sprint) return null;
    if (typeof task.sprint === 'string') return task.sprint;
    return task.sprint?._id || null;
  };

  useEffect(() => {
    if (!sprints.length) {
      setSelectedSprintId('all');
      return;
    }
    // If a specific sprint is already selected and still exists, keep it
    if (selectedSprintId && selectedSprintId !== '' && selectedSprintId !== 'all' && (selectedSprintId === 'backlog' || sprints.some((s) => s._id === selectedSprintId))) return;
    // Default to active sprint instead of 'all'
    const active = sprints.find((s) => s.status === 'active');
    setSelectedSprintId(active?._id || sprints[0]?._id || 'all');
  }, [sprints]);

  const sprintScopedTasks = useMemo(() => {
    if (!selectedSprintId || selectedSprintId === 'all') return advancedFilteredTasks;
    if (selectedSprintId === 'backlog') {
      return advancedFilteredTasks.filter((task) => !getTaskSprintId(task));
    }
    return advancedFilteredTasks.filter((task) => getTaskSprintId(task) === selectedSprintId);
  }, [advancedFilteredTasks, selectedSprintId]);

  const filteredTasks = useMemo(() => {
    let nextTasks = sprintScopedTasks;

    if (taskFilter === 'assigned') {
      nextTasks = nextTasks.filter(task => {
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
      nextTasks = nextTasks.filter((task) => {
        const normalizedStatus = String(task?.status || '').toLowerCase();
        return ['resolved', 'completed', 'closed', 'done'].includes(normalizedStatus);
      });
    }

    if (workTypeFilter !== 'all') {
      nextTasks = nextTasks.filter((task) => (task.workItemType || 'task') === workTypeFilter);
    }

    return nextTasks;
  }, [sprintScopedTasks, taskFilter, workTypeFilter, user]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
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

  const viewOptions = [
    { id: 'board', label: 'Board', icon: LayoutGrid },
    { id: 'hierarchy', label: 'Hierarchy', icon: GitBranch },
    // { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  ];

  const handleBoardSubViewChange = (subView) => {
    setBoardSubView(subView);
    localStorage.setItem('boardSubView', subView);
  };

  const workTypeSummary = useMemo(() => {
    const counts = {};
    filteredTasks.forEach((task) => {
      const key = task.workItemType || 'task';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [filteredTasks]);

  const projectCode = useMemo(() => {
    const raw = selectedProject?.name || 'PRJ';
    const words = String(raw).trim().split(/\s+/).filter(Boolean);
    let prefix = '';
    if (words.length > 1) {
      prefix = words.map((w) => w[0]).join('');
    } else {
      prefix = words[0]?.slice(0, 3) || 'PRJ';
    }
    return prefix.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'PRJ';
  }, [selectedProject?.name]);

  const taskCodeById = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return String(a?._id || '').localeCompare(String(b?._id || ''));
    });

    const map = {};
    sorted.forEach((task, index) => {
      map[task._id] = `${projectCode}-${index + 1}`;
    });
    return map;
  }, [tasks, projectCode]);

  const filteredTasksWithCode = useMemo(() => {
    return filteredTasks.map((task) => ({
      ...task,
      displayId: taskCodeById[task._id] || `${projectCode}-0`,
    }));
  }, [filteredTasks, taskCodeById, projectCode]);

  const isTaskCompleted = (task) => {
    const normalizedStatus = String(task?.status || '').toLowerCase();
    return ['resolved', 'completed', 'closed', 'done'].includes(normalizedStatus);
  };

  const projectMetrics = useMemo(() => {
    const activeSprint = sprints.find((s) => s.status === 'active');
    const activeSprintTasks = activeSprint
      ? tasks.filter((task) => getTaskSprintId(task) === activeSprint._id)
      : [];

    const total = activeSprintTasks.length;
    const completed = activeSprintTasks.filter(isTaskCompleted).length;
    const inProgress = activeSprintTasks.filter((task) => {
      const normalizedStatus = String(task?.status || '').toLowerCase();
      return ['inprogress', 'active'].includes(normalizedStatus);
    }).length;
    const backlogCount = tasks.filter((task) => !getTaskSprintId(task)).length;

    return {
      total,
      completed,
      inProgress,
      backlogCount,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks, sprints]);

  const projectHealth = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = filteredTasks.filter((task) => {
      if (isTaskCompleted(task)) return false;
      if (!task?.dueDate) return false;
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;
    const unassigned = filteredTasks.filter((task) => {
      const assigned = task?.assignedTo;
      if (!assigned) return true;
      if (typeof assigned === 'string') return !assigned;
      return !(assigned?._id || assigned?.id);
    }).length;
    const blocked = filteredTasks.filter((task) => {
      const normalizedStatus = String(task?.status || '').toLowerCase();
      return normalizedStatus === 'blocked';
    }).length;
    return { overdue, unassigned, blocked };
  }, [filteredTasks]);


  const currentTeamRole = useMemo(() => {
    const membership = teamMembers.find((member) => member?.user?._id === user?._id);
    return String(membership?.role || '').toLowerCase();
  }, [teamMembers, user]);

  const canCreateOrPlanProjects = useMemo(() => {
    const projectRole = String(selectedProject?.userRole || '').toLowerCase();
    if (isSystemAdmin?.() || isAdmin?.()) return true;
    if (['owner', 'manager', 'sme'].includes(projectRole)) return true;
    if (['admin', 'manager', 'sme'].includes(currentTeamRole)) return true;
    return false;
  }, [selectedProject, currentTeamRole, isSystemAdmin, isAdmin]);

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

  if (loading || authLoading || teamLoading || teamSelecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <ProjectSidebar
        projects={filteredProjects}
        selectedProject={selectedProject}
        onProjectSelect={handleProjectSelect}
        onProjectCreate={handleProjectCreate}
        onProjectUpdate={handleProjectUpdate}
        onProjectDelete={handleProjectDelete}
        currentUser={user}
        isAdmin={isAdmin()}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        canCreateProject={canCreateOrPlanProjects}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            {/* Project Header */}
            <div className="text-black border-b border-slate-800 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                    style={{ backgroundColor: selectedProject.color + '30' }}
                  >
                    <Folder
                      className="w-6 h-6"
                      style={{ color: selectedProject.color }}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-black">
                      {selectedProject.name}
                    </h1>
                    {selectedProject.description && (
                      <p className="text-sm mt-1">
                        {selectedProject.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selectedProject.teamLead && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/10 text-black border border-white/10">
                          <User className="h-3 w-3" />
                          Lead: {selectedProject.teamLead.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Download Reports Button - Only for admin/team lead/project manager */}
                  {canManageMembers() && (
                    <DownloadReportButton
                      label="Download"
                      variant="secondary"
                      options={[
                        {
                          key: 'project-overview',
                          label: 'Project Overview',
                          description: 'Project details and statistics',
                          icon: <Folder className="h-4 w-4" />,
                          action: async () => {
                            await reportService.downloadProjectReport(currentTeam._id, selectedProject._id);
                          }
                        },
                        {
                          key: 'all-tasks',
                          label: 'All Tasks',
                          description: 'All tasks in this project',
                          icon: <ClipboardList className="h-4 w-4" />,
                          action: async () => {
                            await reportService.downloadProjectTasks(currentTeam._id, selectedProject._id);
                          }
                        },
                        {
                          key: 'backlog-tasks',
                          label: 'Backlog Tasks',
                          description: 'Tasks not assigned to sprints',
                          icon: <ClipboardList className="h-4 w-4" />,
                          action: async () => {
                            await reportService.downloadProjectTasks(currentTeam._id, selectedProject._id, true);
                          }
                        },
                        ...(() => {
                          const sel = sprints.find((s) => s._id === selectedSprintId);
                          return sel ? [{
                            key: 'current-sprint',
                            label: `Sprint: ${sel.name}`,
                            description: 'Tasks in the selected sprint',
                            icon: <Calendar className="h-4 w-4" />,
                            action: async () => {
                              await reportService.downloadSprintTasks(currentTeam._id, selectedProject._id, sel._id);
                            }
                          }] : [];
                        })()
                      ]}
                    />
                  )}

                  {canManageMembers() && (
                    <button
                      onClick={() => setShowMembersModal(true)}
                      className="px-4 py-2 text-sm font-medium text-black bg-gray-200 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 border border-white/10"
                    >
                      <Users className="h-4 w-4" />
                      Manage Members
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sprint Selector Bar */}
            <SprintSelectorBar
              sprints={sprints}
              activeSprint={sprints.find((s) => s.status === 'active')}
              selectedSprintId={selectedSprintId}
              onSprintSelect={setSelectedSprintId}
              backlogCount={backlog.length}
              onManageSprints={() => navigate(`/teams/${currentTeam._id}/projects/${selectedProject._id}/sprints`)}
              onOpenSprintBoard={(sprintId) => navigate(`/teams/${currentTeam._id}/projects/${selectedProject._id}/sprints/${sprintId}`)}
              formatDate={formatDate}
              sprintLoading={sprintLoading}
            />

            {/* Controls Panel */}
            <div className="bg-slate-50 border-b border-gray-200 px-4 sm:px-8 py-3">
              {/* Metrics row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold text-gray-900">{projectMetrics.total}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200">
                  <span className="text-gray-500">Active</span>
                  <span className="font-bold text-gray-900">{projectMetrics.inProgress}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200">
                  <span className="text-gray-500">Done</span>
                  <span className="font-bold text-green-700">{projectMetrics.completed}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200">
                  <span className="text-gray-500">Backlog</span>
                  <span className="font-bold text-purple-700">{projectMetrics.backlogCount}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200">
                  <span className="text-gray-500">Completion</span>
                  <span className="font-bold text-gray-900">{projectMetrics.completionRate}%</span>
                </div>
              </div>

              {/* View switcher + filters */}
              <div className="flex flex-wrap items-center gap-2">
                {viewOptions.map((option) => {
                  const Icon = option.icon;
                  const active = viewMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setViewMode(option.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        active ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Issue type chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Types</span>
                {workItemTypes.map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setWorkTypeFilter((prev) => (prev === type ? 'all' : type))}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                      workTypeFilter === type
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="capitalize">{type === 'story' ? 'Story' : type}</span>
                    <span className="rounded bg-gray-100 px-1 py-0 text-[10px] font-semibold text-gray-500">
                      {workTypeSummary[type] || 0}
                    </span>
                  </button>
                ))}
                <span className="ml-1 text-[10px] text-gray-400">
                  {filteredTasks.length} items
                </span>
              </div>
                <div className='flex gap-2 mt-3 ml-[-10px]'>
              <div className="bg-gray-200" />

                {viewMode === 'board' && (
                  <div className="flex items-center gap-1 bg-gray-900 rounded-lg px-1.5 py-0.5">
                    <button
                      type="button"
                      onClick={() => handleBoardSubViewChange('board')}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        boardSubView === 'board' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      Board
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBoardSubViewChange('list')}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        boardSubView === 'list' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List className="w-3 h-3" />
                      List
                    </button>
                  </div>
                )}

                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg bg-white text-xs"
                >
                  <option value="all">All Tasks</option>
                  <option value="assigned">Assigned To Me</option>
                  <option value="completed">Completed</option>
                </select>

                <button
                  type="button"
                  onClick={() => { setTaskFilter('all'); setWorkTypeFilter('all'); setSelectedSprintId('all'); setActiveFilters([]); }}
                  className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Reset
                </button>
                </div>
              {/* Filter bar */}
              <FilterBar
                filters={activeFilters}
                onFiltersChange={setActiveFilters}
                assignees={projectAssignees}
                workflowStatuses={workflowStatuses}
              />
            </div>

            {/* Assign Team Lead Modal */}
            {showAssignModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
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
                  <div className="px-6 py-4 overflow-y-auto flex-1">
                    <p className="text-sm text-gray-600 mb-4">
                      Select a team member to assign as team lead for "{selectedProject.name}"
                    </p>
                    <div className="space-y-2">
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
                  <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
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
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
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

                  <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1">
                    <div>
                      <p className="text-sm text-gray-600">
                        Project: <span className="font-medium text-gray-900">{selectedProject.name}</span>
                      </p>
                    </div>

                    {isAdmin?.() && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="font-medium text-indigo-900">Team Lead</h4>
                            <p className="text-sm text-indigo-700 mt-1">
                              {selectedProject.teamLead
                                ? `Current: ${selectedProject.teamLead.name}`
                                : 'No team lead assigned'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedProject.teamLead && (
                              <button
                                onClick={handleRemoveTeamLead}
                                disabled={assigning}
                                className="px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Remove Team Lead
                              </button>
                            )}
                            <button
                              onClick={() => setShowAssignModal(true)}
                              disabled={assigning}
                              className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {selectedProject.teamLead ? 'Change Team Lead' : 'Assign Team Lead'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

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
                            const isSelf = pm.user?._id === user?._id;
                            const cannotRemove = isOwner || isSelf;
                            return (
                              <div key={pm._id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {pm.user?.name || 'Unknown'}{isSelf ? ' (you)' : ''}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {pm.user?.email || 'N/A'} • {pm.role}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRemoveProjectMember(pm.user?._id)}
                                  disabled={memberActionLoading || cannotRemove}
                                  className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  title={isOwner ? 'Cannot remove project owner' : isSelf ? 'Cannot remove yourself' : 'Remove member'}
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

                  <div className="px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
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

            <div className="pb-6 px-4 lg:px-5">
              {viewMode === 'board' && (
                <>
                  {boardSubView === 'board' ? (
                    <TrackingBoard
                      tasks={filteredTasksWithCode}
                      loading={tasksLoading}
                      onTaskCreate={handleTaskCreate}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDelete}
                      onTaskStatusChange={handleTaskStatusChange}
                      onInlineTaskCreate={async (data) => {
                        const sprintId = selectedSprintId && selectedSprintId !== 'all' && selectedSprintId !== 'backlog' ? selectedSprintId : undefined;
                        await handleTaskCreate({ ...data, sprint: sprintId || undefined });
                      }}
                      assignees={projectAssignees}
                      teamId={currentTeam?._id}
                      projectId={selectedProject?._id}
                      initialTaskId={taskIdParam}
                      sprintEndDate={sprints.find((s) => s._id === selectedSprintId)?.endDate}
                      workflowStatuses={workflowStatuses}
                      workItemTypes={workItemTypes}
                      parentTasks={tasks.filter((task) => task.workItemType !== 'subtask')}
                      onNavigateToCreate={navigateToCreateTask}
                      onNavigateToTask={navigateToTask}
                      onNavigateToComplete={navigateToCompleteTask}
                    />
                  ) : (
                    <ListView
                      tasks={filteredTasksWithCode}
                      onOpenTask={navigateToTask}
                      onEditTask={(task) => navigateToTask(task._id)}
                      onDeleteTask={handleTaskDelete}
                      onCreateTask={navigateToCreateTask}
                      onStatusChange={handleInlineStatusChange}
                      workflowStatuses={workflowStatuses}
                    />
                  )}
                </>
              )}

              {viewMode === 'hierarchy' && (
                <HierarchyView
                  tasks={filteredTasksWithCode}
                  onOpenTask={navigateToTask}
                  onEditTask={(task) => navigateToTask(task._id)}
                  onCreateTask={navigateToCreateTask}
                  workflowStatuses={workflowStatuses}
                />
              )}

{viewMode === 'calendar' && (
                <SprintCalendarView
                  tasks={filteredTasksWithCode}
                  sprintStartDate={
                    selectedSprintId && selectedSprintId !== 'all' && selectedSprintId !== 'backlog'
                      ? sprints.find((s) => s._id === selectedSprintId)?.startDate
                      : null
                  }
                  sprintEndDate={
                    selectedSprintId && selectedSprintId !== 'all' && selectedSprintId !== 'backlog'
                      ? sprints.find((s) => s._id === selectedSprintId)?.endDate
                      : null
                  }
                  workflowStatuses={workflowStatuses}
                  onOpenTask={navigateToTask}
                />
              )}

              {viewMode === 'analytics' && (
                <ProjectAnalytics teamId={currentTeam?._id} projectId={selectedProject?._id} />
              )}
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
