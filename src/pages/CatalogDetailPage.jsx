import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Edit3, Trash2, Play, ExternalLink, FileText, User, Tag, Layers,
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import projectCatalogService from '../services/projectCatalogService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const STATUS_COLORS = {
  Active: 'bg-emerald-100 text-emerald-700',
  Planning: 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-amber-100 text-amber-700',
  Completed: 'bg-gray-100 text-gray-700',
  Archived: 'bg-red-100 text-red-700',
};

const CatalogDetailPage = () => {
  const { teamId, catalogId } = useParams();
  const navigate = useNavigate();
  const { currentTeam, isAdmin, teamMembership } = useTeam();
  const { user } = useAuth();
  const tid = teamId || currentTeam?._id;

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = isAdmin() || teamMembership?.role === 'Manager';

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const load = async () => {
      if (!tid || !catalogId) return;
      try {
        const res = await projectCatalogService.getCatalogEntry(tid, catalogId);
        setEntry(res.data);
      } catch (err) {
        toast.error('Error loading catalog entry');
        navigate(`/teams/${tid}/catalog`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tid, catalogId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await projectCatalogService.deleteCatalogEntry(tid, catalogId);
      toast.success('Entry removed');
      navigate(`/teams/${tid}/catalog`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting entry');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back + actions bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(`/teams/${tid}/catalog`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/teams/${tid}/catalog/${catalogId}/edit`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-white font-medium bg-white shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(entry)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header section */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-600'}`}>
                {entry.status}
              </span>
              {entry.linkedProject?.name && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {entry.linkedProject.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{entry.title}</h1>
            {entry.tagline && <p className="text-base text-gray-500">{entry.tagline}</p>}

            {/* Tags */}
            {entry.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {entry.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-3 mt-4">
              {entry.demoUrl && (
                <a
                  href={entry.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Live Demo
                </a>
              )}
              {entry.repoUrl && (
                <a
                  href={entry.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Repository
                </a>
              )}
            </div>
          </div>

          {/* One-pager */}
          <div className="px-8 py-6">
            {entry.onePager ? (
              <div
                className="prose prose-sm max-w-none ck-content"
                dangerouslySetInnerHTML={{ __html: entry.onePager }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No one-pager added yet</p>
                {canEdit && (
                  <button
                    onClick={() => navigate(`/teams/${tid}/catalog/${catalogId}/edit`)}
                    className="mt-3 text-sm text-gray-600 underline hover:text-gray-900"
                  >
                    Add one-pager
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 flex items-center gap-1.5">
            <User className="w-3 h-3" />
            {entry.createdBy?.name || 'Unknown'} · {formatDate(entry.createdAt)}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={entry?.title || ''}
        itemType="catalog entry"
        loading={isDeleting}
      />
    </div>
  );
};

export default CatalogDetailPage;
