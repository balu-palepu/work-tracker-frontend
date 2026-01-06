import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ProjectSidebar from '../components/ProjectSidebar';
import TrackingBoard from '../components/TrackingBoard';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import { Folder } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject._id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjects();
      setProjects(response.data);
      
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

  const fetchTasks = async (projectId) => {
    try {
      setTasksLoading(true);
      const response = await taskService.getProjectTasks(projectId);
      setTasks(response.data);
    } catch (error) {
      toast.error('Error fetching tasks');
      console.error(error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleProjectCreate = async (projectData) => {
    try {
      const response = await projectService.createProject(projectData);
      setProjects([response.data, ...projects]);
      setSelectedProject(response.data);
      toast.success('Project created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating project');
      throw error;
    }
  };

  const handleProjectUpdate = async (projectId, projectData) => {
    try {
      const response = await projectService.updateProject(projectId, projectData);
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
    try {
      await projectService.deleteProject(projectId);
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
    if (!selectedProject) return;
    
    try {
      const response = await taskService.createTask(selectedProject._id, taskData);
      setTasks([...tasks, response.data]);
      toast.success('Task created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating task');
      throw error;
    }
  };

  const handleTaskUpdate = async (taskId, taskData) => {
    if (!selectedProject) return;
    
    try {
      const response = await taskService.updateTask(selectedProject._id, taskId, taskData);
      setTasks(tasks.map(t => t._id === taskId ? response.data : t));
      toast.success('Task updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating task');
      throw error;
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!selectedProject) return;
    
    try {
      await taskService.deleteTask(selectedProject._id, taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting task');
      throw error;
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus, newPosition) => {
    if (!selectedProject) return;
    
    try {
      const response = await taskService.updateTaskStatus(
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
        projects={projects}
        selectedProject={selectedProject}
        onProjectSelect={setSelectedProject}
        onProjectCreate={handleProjectCreate}
        onProjectUpdate={handleProjectUpdate}
        onProjectDelete={handleProjectDelete}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedProject ? (
          <>
            {/* Project Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
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
                </div>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden">
              <TrackingBoard
                tasks={tasks}
                loading={tasksLoading}
                onTaskCreate={handleTaskCreate}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
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
    </div>
  );
};

export default Projects;