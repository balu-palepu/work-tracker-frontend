import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTeam } from './TeamContext';
import sprintService from '../services/sprintService';

const SprintContext = createContext();

export const useSprint = () => {
  const context = useContext(SprintContext);
  if (!context) {
    throw new Error('useSprint must be used within a SprintProvider');
  }
  return context;
};

export const SprintProvider = ({ children }) => {
  const { currentTeam } = useTeam();
  const [currentSprint, setCurrentSprint] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [burndownData, setBurndownData] = useState(null);

  // Load sprints for a project
  const loadSprints = useCallback(async (projectId) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.getSprints(currentTeam._id, projectId);
      setSprints(response.data);

      // Set active sprint as current if exists
      const activeSprint = response.data.find(s => s.status === 'active');
      if (activeSprint) {
        setCurrentSprint(activeSprint);
      }

      return response.data;
    } catch (error) {
      console.error('Error loading sprints:', error);
      throw error;
    }
  }, [currentTeam]);

  // Load sprint details
  const loadSprint = useCallback(async (projectId, sprintId) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.getSprint(currentTeam._id, projectId, sprintId);
      setCurrentSprint(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading sprint:', error);
      throw error;
    }
  }, [currentTeam]);

  // Create sprint
  const createSprint = useCallback(async (projectId, sprintData) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.createSprint(currentTeam._id, projectId, sprintData);
      setSprints(prev => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      console.error('Error creating sprint:', error);
      throw error;
    }
  }, [currentTeam]);

  // Update sprint
  const updateSprint = useCallback(async (projectId, sprintId, sprintData) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.updateSprint(currentTeam._id, projectId, sprintId, sprintData);
      setSprints(prev => prev.map(s => s._id === sprintId ? response.data : s));

      if (currentSprint?._id === sprintId) {
        setCurrentSprint(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Error updating sprint:', error);
      throw error;
    }
  }, [currentTeam, currentSprint]);

  // Delete sprint
  const deleteSprint = useCallback(async (projectId, sprintId) => {
    if (!currentTeam) return;

    try {
      await sprintService.deleteSprint(currentTeam._id, projectId, sprintId);
      setSprints(prev => prev.filter(s => s._id !== sprintId));

      if (currentSprint?._id === sprintId) {
        setCurrentSprint(null);
      }
    } catch (error) {
      console.error('Error deleting sprint:', error);
      throw error;
    }
  }, [currentTeam, currentSprint]);

  // Start sprint
  const startSprint = useCallback(async (projectId, sprintId) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.startSprint(currentTeam._id, projectId, sprintId);
      setSprints(prev => prev.map(s => s._id === sprintId ? response.data : s));
      setCurrentSprint(response.data);
      return response.data;
    } catch (error) {
      console.error('Error starting sprint:', error);
      throw error;
    }
  }, [currentTeam]);

  // Complete sprint
  const completeSprint = useCallback(async (projectId, sprintId, data) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.completeSprint(currentTeam._id, projectId, sprintId, data);
      setSprints(prev => prev.map(s => s._id === sprintId ? response.data : s));
      setCurrentSprint(null);
      return response.data;
    } catch (error) {
      console.error('Error completing sprint:', error);
      throw error;
    }
  }, [currentTeam]);

  // Cancel sprint
  const cancelSprint = useCallback(async (projectId, sprintId) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.cancelSprint(currentTeam._id, projectId, sprintId);
      setSprints(prev => prev.map(s => s._id === sprintId ? response.data : s));

      if (currentSprint?._id === sprintId) {
        setCurrentSprint(null);
      }

      return response.data;
    } catch (error) {
      console.error('Error cancelling sprint:', error);
      throw error;
    }
  }, [currentTeam, currentSprint]);

  // Load burndown data
  const loadBurndownData = useCallback(async (projectId, sprintId) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.getBurndownData(currentTeam._id, projectId, sprintId);
      setBurndownData(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading burndown data:', error);
      throw error;
    }
  }, [currentTeam]);

  // Submit retrospective
  const submitRetrospective = useCallback(async (projectId, sprintId, retroData) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.submitRetrospective(currentTeam._id, projectId, sprintId, retroData);
      setSprints(prev => prev.map(s => s._id === sprintId ? response.data : s));

      if (currentSprint?._id === sprintId) {
        setCurrentSprint(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Error submitting retrospective:', error);
      throw error;
    }
  }, [currentTeam, currentSprint]);

  // Load backlog
  const loadBacklog = useCallback(async (projectId) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.getBacklog(currentTeam._id, projectId);
      setBacklog(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading backlog:', error);
      throw error;
    }
  }, [currentTeam]);

  // Add tasks to sprint
  const addTasksToSprint = useCallback(async (projectId, sprintId, taskIds) => {
    if (!currentTeam) return;

    try {
      const response = await sprintService.addTasksToSprint(currentTeam._id, projectId, sprintId, taskIds);
      // Reload sprint and backlog
      await loadSprint(projectId, sprintId);
      await loadBacklog(projectId);
      return response.data;
    } catch (error) {
      console.error('Error adding tasks to sprint:', error);
      throw error;
    }
  }, [currentTeam, loadSprint, loadBacklog]);

  // Remove task from sprint
  const removeTaskFromSprint = useCallback(async (projectId, sprintId, taskId) => {
    if (!currentTeam) return;

    try {
      await sprintService.removeTaskFromSprint(currentTeam._id, projectId, sprintId, taskId);
      // Reload sprint and backlog
      await loadSprint(projectId, sprintId);
      await loadBacklog(projectId);
    } catch (error) {
      console.error('Error removing task from sprint:', error);
      throw error;
    }
  }, [currentTeam, loadSprint, loadBacklog]);

  // Clear sprint data (when changing projects)
  const clearSprintData = useCallback(() => {
    setCurrentSprint(null);
    setSprints([]);
    setBacklog([]);
    setBurndownData(null);
  }, []);

  const value = {
    currentSprint,
    sprints,
    backlog,
    burndownData,
    loadSprints,
    loadSprint,
    createSprint,
    updateSprint,
    deleteSprint,
    startSprint,
    completeSprint,
    cancelSprint,
    loadBurndownData,
    submitRetrospective,
    loadBacklog,
    addTasksToSprint,
    removeTaskFromSprint,
    clearSprintData
  };

  return (
    <SprintContext.Provider value={value}>
      {children}
    </SprintContext.Provider>
  );
};
