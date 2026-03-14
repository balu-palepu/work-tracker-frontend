import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BookOpen, Plus, Search, Edit3, Trash2, ExternalLink, X,
  Globe, FileText, Tag, Clock, User, Link as LinkIcon,
  Play, Layers,
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import projectCatalogService from '../services/projectCatalogService';
import projectService from '../services/projectService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const STATUS_OPTIONS = ['Active', 'Planning', 'On Hold', 'Completed', 'Archived'];
const STATUS_COLORS = {
  Active: 'bg-emerald-100 text-emerald-700',
  Planning: 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-amber-100 text-amber-700',
  Completed: 'bg-gray-100 text-gray-700',
  Archived: 'bg-red-100 text-red-700',
};

// Detail Drawer / Modal
const CatalogDetailModal = ({ entry, onClose, onEdit, onDelete, canEdit }) => {
  if (!entry) return null;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-end overflow-hidden backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white h-full w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-600'}`}>
                  {entry.status}
                </span>
                {entry.linkedProject?.name && (
                  <span className="text-xs text-gray-400">· {entry.linkedProject.name}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{entry.title}</h2>
              {entry.tagline && <p className="text-sm text-gray-500 mt-1">{entry.tagline}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 flex-shrink-0">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Tags */}
          {entry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {entry.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 mt-3">
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

        {/* One-pager content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {entry.onePager ? (
            <div
              className="prose prose-sm max-w-none ck-content"
              dangerouslySetInnerHTML={{ __html: entry.onePager }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">No one-pager added yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <User className="w-3 h-3" />
            {entry.createdBy?.name || 'Unknown'} · {formatDate(entry.createdAt)}
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={() => { onClose(); onEdit(entry); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-white font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => { onClose(); onDelete(entry); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
};

// Catalog card
const CatalogCard = ({ entry, onClick, onEdit, onDelete, canEdit }) => (
  <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all flex flex-col">
    {/* Top */}
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-600'}`}>
            {entry.status}
          </span>
          {entry.linkedProject?.name && (
            <span className="text-xs text-gray-400 truncate">
              <Layers className="w-3 h-3 inline mr-1" />
              {entry.linkedProject.name}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-gray-900 leading-snug">{entry.title}</h3>
        {entry.tagline && (
          <p className="text-sm text-gray-500 mt-1 leading-snug">{entry.tagline}</p>
        )}
      </div>
      {canEdit && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
            className="p-1.5 rounded-lg hover:bg-gray-100"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(entry); }}
            className="p-1.5 rounded-lg hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      )}
    </div>

    {/* Tags */}
    {entry.tags?.length > 0 && (
      <div className="flex flex-wrap gap-1.5 mb-4">
        {entry.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-xs">
            {tag}
          </span>
        ))}
        {entry.tags.length > 4 && (
          <span className="text-xs text-gray-400">+{entry.tags.length - 4}</span>
        )}
      </div>
    )}

    {/* Action buttons */}
    <div className="mt-auto pt-3 border-t border-gray-100 flex flex-wrap gap-2">
      {entry.demoUrl && (
        <a
          href={entry.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Play className="w-3 h-3" />
          Demo
        </a>
      )}
      {entry.repoUrl && (
        <a
          href={entry.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Repo
        </a>
      )}
      <button
        onClick={() => onClick(entry)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
      >
        <FileText className="w-3 h-3" />
        View One Pager
      </button>
    </div>
  </div>
);

// Create / Edit Modal
const CatalogFormModal = ({ entry, projects, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    title: entry?.title || '',
    tagline: entry?.tagline || '',
    status: entry?.status || 'Active',
    linkedProject: entry?.linkedProject?._id || '',
    tags: (entry?.tags || []).join(', '),
    demoUrl: entry?.demoUrl || '',
    repoUrl: entry?.repoUrl || '',
    onePager: entry?.onePager || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    onSave({
      ...form,
      tags,
      linkedProject: form.linkedProject || null,
      demoUrl: form.demoUrl.trim() || null,
      repoUrl: form.repoUrl.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white w-full max-w-8xl rounded-2xl shadow-2xl my-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {entry ? 'Edit Catalog Entry' : 'Add to Project Catalog'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Customer Portal Redesign"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                maxLength={200}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
              <input
                value={form.tagline}
                onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                placeholder="One-line description"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                maxLength={300}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Linked Project</label>
              <select
                value={form.linkedProject}
                onChange={(e) => setForm((p) => ({ ...p, linkedProject: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-gray-900"
              >
                <option value="">None</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Play className="w-3.5 h-3.5 inline mr-1" />
                Demo URL
              </label>
              <input
                value={form.demoUrl}
                onChange={(e) => setForm((p) => ({ ...p, demoUrl: e.target.value }))}
                placeholder="https://demo.example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <ExternalLink className="w-3.5 h-3.5 inline mr-1" />
                Repository URL
              </label>
              <input
                value={form.repoUrl}
                onChange={(e) => setForm((p) => ({ ...p, repoUrl: e.target.value }))}
                placeholder="https://github.com/org/repo"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="React, Node.js, AWS, Q2-2025"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* One-pager editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-3.5 h-3.5 inline mr-1" />
              One-Pager
            </label>
            <p className="text-xs text-gray-400 mb-2">Architecture, team, timeline, etc. Supports images.</p>
            <div className="border border-gray-300 rounded-xl overflow-hidden">
              <CKEditor
                editor={ClassicEditor}
                config={EDITOR_CONFIG}
                data={form.onePager}
                onChange={(event, editor) => setForm((p) => ({ ...p, onePager: editor.getData() }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm disabled:opacity-50">
              {saving ? 'Saving…' : entry ? 'Update Entry' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Page
const ProjectCatalog = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { currentTeam, isAdmin, teamMembership } = useTeam();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tid = teamId || currentTeam?._id;
  const canEdit = isAdmin() || teamMembership?.role === 'Manager';

  const load = async () => {
    if (!tid) return;
    setLoading(true);
    try {
      const [catRes, projRes] = await Promise.all([
        projectCatalogService.getCatalog(tid),
        projectService.getProjects(tid),
      ]);
      setEntries(catRes.data || []);
      setProjects(projRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tid]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await projectCatalogService.deleteCatalogEntry(tid, deleteTarget._id);
      toast.success('Entry removed');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting entry');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (statusFilter && e.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.title?.toLowerCase().includes(q) ||
          e.tagline?.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [entries, search, statusFilter]);

  // Stats
  const bystatus = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = entries.filter((e) => e.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Catalog</h1>
              <p className="text-sm text-gray-500">One-pager docs, demo links, and project info</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => navigate(`/teams/${tid}/catalog/new`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          )}
        </div>

        {/* Status strip */}
        <div className="flex flex-wrap gap-3 mb-6">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                statusFilter === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{s}</span>
              {bystatus[s] > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {bystatus[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-2xl p-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, tagline, or tags…"
              className="outline-none text-sm bg-transparent w-full"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-20 text-center">
            <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">No projects in catalog</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || statusFilter ? 'Try clearing filters' : 'Add your first project to the catalog'}
            </p>
            {canEdit && !search && !statusFilter && (
              <button
                onClick={() => navigate(`/teams/${tid}/catalog/new`)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((entry) => (
              <CatalogCard
                key={entry._id}
                entry={entry}
                onClick={(e) => navigate(`/teams/${tid}/catalog/${e._id}`)}
                onEdit={(e) => navigate(`/teams/${tid}/catalog/${e._id}/edit`)}
                onDelete={setDeleteTarget}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.title || ''}
        itemType="catalog entry"
        loading={isDeleting}
      />
    </div>
  );
};

export default ProjectCatalog;
