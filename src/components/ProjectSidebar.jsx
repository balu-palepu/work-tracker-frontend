import React, { useState } from 'react';
import { Plus, Folder, Edit2, Trash2 } from 'lucide-react';
import ProjectModal from './ProjectModal';
import DeleteConfirmationModal from './shared/DeleteConfirmationModal';

const ProjectSidebar = ({
  projects,
  selectedProject,
  onProjectSelect,
  onProjectCreate,
  onProjectUpdate,
  onProjectDelete,
  currentUser,
  isAdmin = false,
  roleFilter,
  onRoleFilterChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, project: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const openDeleteModal = (project, e) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, project });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onProjectDelete(deleteModal.project._id);
      setDeleteModal({ isOpen: false, project: null });
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
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

  // Check if current user can delete a project (creator or admin only)
  const canDeleteProject = (project) => {
    if (isAdmin) return true;
    const createdById = project.createdBy?._id || project.createdBy;
    return createdById === currentUser?._id;
  };

  // Check if current user can edit a project (admin, team lead, manager, owner, or SME only - NOT regular members/contributors)
  const canEditProject = (project) => {
    if (isAdmin) return true;
    const userId = currentUser?._id;
    const createdById = project.createdBy?._id || project.createdBy;
    const teamLeadId = project.teamLead?._id || project.teamLead;
    const role = project.userRole;

    // Owner/creator can edit
    if (createdById && userId && createdById === userId) return true;
    // Team lead can edit
    if (teamLeadId && userId && teamLeadId === userId) return true;
    // Manager role can edit
    if (role === 'owner' || role === 'manager') return true;
    // SME/viewer can edit
    if (role === 'viewer' || role === 'sme') return true;
    // Contributors (regular members) cannot edit
    return false;
  };

  const getRoleBadge = (project) => {
    const userId = currentUser?._id;
    const createdById = project.createdBy?._id || project.createdBy;
    const teamLeadId = project.teamLead?._id || project.teamLead;
    const role = project.userRole;

    let label = '';
    if (role === 'owner' || createdById === userId) {
      label = 'Lead';
    } else if (teamLeadId && teamLeadId === userId) {
      label = 'Lead';
    } else if (role === 'manager') {
      label = 'Lead';
    } else if (role === 'viewer' || role === 'sme') {
      label = 'Viewer';
    } else if (role === 'contributor') {
      label = 'Contributor';
    } else if (role) {
      label = role;
    }

    if (!label) return null;

    const isGreen = ['Lead'].includes(label);
    const classes = isGreen
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-orange-100 text-orange-800 border-orange-200';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${classes}`}>
        {label}
      </span>
    );
  };

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Projects</h2>
          </div>
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
          <div className="mt-3">
            <select
              value={roleFilter}
              onChange={(e) => onRoleFilterChange?.(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="lead">Lead</option>
              <option value="contributor">Contributor</option>
              <option value="sme">SME</option>
            </select>
          </div>
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

                <div className="absolute top-3 right-3">
                  {getRoleBadge(project)}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEditProject(project) && (
                    <button
                      onClick={(e) => handleEdit(project, e)}
                      className="p-1.5 bg-white rounded hover:bg-blue-50 text-gray-600 hover:text-blue-600 shadow-sm"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canDeleteProject(project) && (
                    <button
                      onClick={(e) => openDeleteModal(project, e)}
                      className="p-1.5 bg-white rounded hover:bg-red-50 text-gray-600 hover:text-red-600 shadow-sm"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, project: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.project?.name || ''}
        itemType="project"
        loading={isDeleting}
      />
    </>
  );
};

export default ProjectSidebar;
