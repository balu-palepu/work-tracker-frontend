import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronsLeft, Pin, Calendar, User, Trash2 } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import newsletterService from '../services/newsletterService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const NewsletterDetail = () => {
  const { teamId: routeTeamId, newsletterId } = useParams();
  const navigate = useNavigate();
  const { currentTeam, teamMembership } = useTeam();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const teamId = routeTeamId || currentTeam?._id;

  useEffect(() => {
    const load = async () => {
      if (!teamId || !newsletterId) return;
      setLoading(true);
      try {
        const response = await newsletterService.getNewsletter(teamId, newsletterId);
        setItem(response.data || null);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error loading newsletter');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, newsletterId]);

  const canManage = () => {
    const role = teamMembership?.role;
    if (role === 'admin' || role === 'Manager') return true;
    return item?.createdBy?._id === user?._id;
  };

  const handleDelete = async () => {
    if (!teamId || !item) return;
    setIsDeleting(true);
    try {
      await newsletterService.deleteNewsletter(teamId, item._id);
      toast.success('Newsletter deleted');
      navigate(`/teams/${teamId}/newsletters`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting newsletter');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto py-20 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-8xl mx-auto py-20 text-center">
        <p className="text-gray-500 font-medium">Newsletter not found</p>
        <Link to={`/teams/${teamId}/newsletters`} className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">
          Back to Newsletters
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/teams/${teamId}/newsletters`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronsLeft className="w-4 h-4 mr-1" />
          Back to Newsletters
        </Link>
        {canManage() && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>

      {/* Article */}
      <article className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          {item.isPinned && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-3">
              <Pin className="w-3 h-3" />
              Pinned
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{item.title}</h1>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span className="font-medium text-gray-700">{item.createdBy?.name || 'Unknown'}</span>
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {item.project?.name && (
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                {item.project.name}
              </span>
            )}
          </div>

          {item.summary && (
            <p className="text-gray-600 mt-4 leading-relaxed">{item.summary}</p>
          )}
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <div
            className="newsletter-content"
            dangerouslySetInnerHTML={{ __html: item.content || '' }}
          />
        </div>

        {/* Footer */}
        {item.updatedAt && item.updatedAt !== item.createdAt && (
          <div className="px-8 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            Last updated {new Date(item.updatedAt).toLocaleString()}
            {item.updatedBy?.name && ` by ${item.updatedBy.name}`}
          </div>
        )}
      </article>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={item?.title || ''}
        itemType="newsletter"
        loading={isDeleting}
      />
    </div>
  );
};

export default NewsletterDetail;
