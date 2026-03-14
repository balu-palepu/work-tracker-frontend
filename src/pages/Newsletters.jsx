import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Plus, Search, Pin, Newspaper, X, Tag,
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import newsletterService from '../services/newsletterService';
import projectService from '../services/projectService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const NewsletterRow = ({ item, index, onNavigate, onEdit, onDelete, canEdit, canDelete }) => {
  const preview = item.summary || stripHtml(item.content).slice(0, 160);

  return (
    <div
      onClick={() => onNavigate(item)}
      className={`group flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer ${item.isPinned ? 'bg-amber-50/40' : ''}`}
    >
      {/* Index number */}
      <span className="flex-shrink-0 w-6 text-right text-sm text-gray-400 pt-0.5 select-none">{index}.</span>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          {item.isPinned && (
            <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 mt-1" />
          )}
          <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug">
            {item.title}
          </span>
          {item.project?.name && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-semibold flex-shrink-0">
              <Tag className="w-2 h-2" />
              {item.project.name}
            </span>
          )}
        </div>

        {preview && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{preview}</p>
        )}

        {/* Subline */}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
          <span>{timeAgo(item.createdAt)}</span>
          <span>·</span>
          <span>by {item.createdBy?.name || 'Unknown'}</span>
          {(canEdit(item) || canDelete(item)) && (
            <>
              <span>·</span>
              {canEdit(item) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  className="hover:text-blue-600 transition-colors"
                >
                  edit
                </button>
              )}
              {canEdit(item) && canDelete(item) && <span>/</span>}
              {canDelete(item) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                  className="hover:text-red-600 transition-colors"
                >
                  delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 self-center text-gray-300 group-hover:text-blue-500 transition-colors pl-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

const Newsletters = () => {
  const { teamId: routeTeamId } = useParams();
  const { currentTeam, teamMembership } = useTeam();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const teamId = routeTeamId || currentTeam?._id;

  const loadAll = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [newsRes, projectsRes] = await Promise.all([
        newsletterService.getNewsletters(teamId, { search, projectId: projectFilter || undefined, limit: 100 }),
        projectService.getProjects(teamId),
      ]);
      setItems(newsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error loading newsletters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [teamId, search, projectFilter]);

  const openCreate = () => navigate(`/teams/${teamId}/newsletters/new`);
  const openEdit = (item) => navigate(`/teams/${teamId}/newsletters/${item._id}/edit`);

  const handleDelete = async () => {
    if (!teamId || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await newsletterService.deleteNewsletter(teamId, deleteTarget._id);
      toast.success('Newsletter deleted');
      setDeleteTarget(null);
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting newsletter');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdminOrManager = teamMembership?.role === 'admin' || teamMembership?.role === 'Manager';
  const isCreator = (item) => item.createdBy?._id === user?._id;
  const canEdit = (item) => isAdminOrManager || isCreator(item);
  const canDelete = (item) => isAdminOrManager || isCreator(item);
  const handleNavigate = (item) => navigate(`/teams/${teamId}/newsletters/${item._id}`);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [items]);

  const hasFilters = search || projectFilter;

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Newsletters</h1>
              <p className="text-xs text-gray-500">Team updates &amp; announcements</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search newsletters…"
              className="outline-none text-sm bg-transparent w-full"
            />
            {search && (
              <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" /></button>
            )}
          </div>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
          >
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
            <Newspaper className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No newsletters {hasFilters ? 'match your filters' : 'yet'}</p>
            {!hasFilters && (
              <button onClick={openCreate} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                <Plus className="w-3.5 h-3.5" />
                Create Newsletter
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {sortedItems.map((item, i) => (
              <NewsletterRow
                key={item._id}
                item={item}
                index={i + 1}
                onNavigate={handleNavigate}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">{sortedItems.length} newsletter{sortedItems.length !== 1 ? 's' : ''}</p>
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.title || ''}
        itemType="newsletter"
        loading={isDeleting}
      />
    </div>
  );
};

export default Newsletters;
