import React, { useState } from 'react';
import { Plus, Folder, Edit2, Trash2 } from 'lucide-react';
import ProjectModal from './ProjectModal';

const ProjectSidebar = ({
  projects,
  selectedProject,
  onProjectSelect,
  onProjectCreate,
  onProjectUpdate,
  onProjectDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const handleCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (project, e) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${project.name}"? All tasks will be deleted.`)) {
      try {
        await onProjectDelete(project._id);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleSubmit = async (projectData) => {
    try {
      if (editingProject) {
        await onProjectUpdate(editingProject._id, projectData);
      } else {
        await onProjectCreate(projectData);
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Projects</h2>
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No projects yet</p>
              <p className="text-xs mt-1">Create your first project to get started</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project._id}
                onClick={() => onProjectSelect(project)}
                className={`
                  group relative p-4 rounded-lg cursor-pointer transition-all
                  ${selectedProject?._id === project._id
                    ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: project.color + '20' }}
                  >
                    <Folder
                      className="w-5 h-5"
                      style={{ color: project.color }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEdit(project, e)}
                    className="p-1.5 bg-white rounded hover:bg-blue-50 text-gray-600 hover:text-blue-600 shadow-sm"
                    title="Edit project"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(project, e)}
                    className="p-1.5 bg-white rounded hover:bg-red-50 text-gray-600 hover:text-red-600 shadow-sm"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingProject}
      />
    </>
  );
};

export default ProjectSidebar;