import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Search, Trash2, Edit3, Pin, Newspaper, Calendar, User } from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  Link as CKLink,
  List,
  Table,
  TableToolbar,
  BlockQuote,
  Alignment,
  Font,
  Indent,
  IndentBlock,
  Image,
  ImageInsertViaUrl,
  ImageResize,
  MediaEmbed,
  HorizontalLine,
  Highlight,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import newsletterService from '../services/newsletterService';
import projectService from '../services/projectService';
import DeleteConfirmationModal from '../components/shared/DeleteConfirmationModal';

const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const EDITOR_CONFIG = {
  licenseKey: 'GPL',
  plugins: [
    Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
    Heading, CKLink, List, Table, TableToolbar, BlockQuote,
    Alignment, Font, Indent, IndentBlock, Image, ImageInsertViaUrl,
    ImageResize, MediaEmbed, HorizontalLine, Highlight,
  ],
  toolbar: {
    items: [
      'heading', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'fontSize', 'fontColor', 'highlight', '|',
      'alignment', '|',
      'bulletedList', 'numberedList', '|',
      'outdent', 'indent', '|',
      'link', 'insertImage', 'insertTable', 'blockQuote', 'mediaEmbed', 'horizontalLine', '|',
      'undo', 'redo',
    ],
    shouldNotGroupWhenFull: false,
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
    ],
  },
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
  },
  image: {
    resizeOptions: [
      { name: 'resizeImage:original', value: null, label: 'Original' },
      { name: 'resizeImage:50', value: '50', label: '50%' },
      { name: 'resizeImage:75', value: '75', label: '75%' },
    ],
  },
  placeholder: 'Write your newsletter content here...',
};

const Newsletters = () => {
  const { teamId: routeTeamId } = useParams();
  const { currentTeam, teamMembership } = useTeam();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    summary: '',
    project: '',
    isPinned: false,
    content: '',
  });

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

  useEffect(() => {
    loadAll();
  }, [teamId, search, projectFilter]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm({ title: '', summary: '', project: '', isPinned: false, content: '' });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', summary: '', project: '', isPinned: false, content: '' });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      summary: item.summary || '',
      project: item.project?._id || '',
      isPinned: !!item.isPinned,
      content: item.content || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!teamId) return;
    if (!form.title.trim() || !stripHtml(form.content)) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        project: form.project || null,
        isPinned: form.isPinned,
        content: form.content,
      };
      if (editing?._id) {
        await newsletterService.updateNewsletter(teamId, editing._id, payload);
        toast.success('Newsletter updated');
      } else {
        await newsletterService.createNewsletter(teamId, payload);
        toast.success('Newsletter created');
      }
      closeModal();
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving newsletter');
    } finally {
      setSaving(false);
    }
  };

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

  const canEditOrDelete = (item) => {
    const role = teamMembership?.role;
    if (role === 'admin' || role === 'Manager') return true;
    return item.createdBy?._id === user?._id;
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [items]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Newsletters</h1>
            <p className="text-sm text-gray-500">Team updates, project highlights, and announcements</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Newsletter
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search newsletters..."
            className="outline-none text-sm bg-transparent w-full"
          />
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white appearance-none"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>{project.name}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No newsletters yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first newsletter to share updates with the team</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sortedItems.map((item) => (
            <div
              key={item._id}
              className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow ${
                item.isPinned ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-200'
              }`}
            >
              {item.isPinned && (
                <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-1.5">
                  <Pin className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pinned</span>
                </div>
              )}
              <div className="p-5">
                <Link
                  to={`/teams/${teamId}/newsletters/${item._id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-blue-700 line-clamp-2 transition-colors"
                >
                  {item.title}
                </Link>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {item.project?.name && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                      {item.project.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">
                  {item.summary || stripHtml(item.content).slice(0, 180)}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                    </div>
                    <span className="text-xs text-gray-500">{item.createdBy?.name || 'Unknown'}</span>
                  </div>
                  {canEditOrDelete(item) && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.preventDefault(); openEdit(item); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); setDeleteTarget(item); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-xl border border-gray-200 shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Newsletter' : 'Create Newsletter'}
              </h2>
              <button onClick={closeModal} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Newsletter title"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Summary</label>
                <input
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief summary (shown on cards)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={500}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
                  <select
                    value={form.project}
                    onChange={(e) => setForm((prev) => ({ ...prev, project: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white appearance-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">General (No project)</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPinned}
                      onChange={(e) => setForm((prev) => ({ ...prev, isPinned: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Pin this newsletter to the top
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Content <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <CKEditor
                    editor={ClassicEditor}
                    config={EDITOR_CONFIG}
                    data={form.content}
                    onChange={(event, editor) => {
                      setForm((prev) => ({ ...prev, content: editor.getData() }));
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : editing ? 'Update Newsletter' : 'Publish Newsletter'}
              </button>
            </div>
          </div>
        </div>
      )}

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
