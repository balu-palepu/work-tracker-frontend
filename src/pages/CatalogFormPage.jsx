import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, BookOpen, Play, ExternalLink, Tag, FileText,
} from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor, Essentials, Paragraph, Bold, Italic, Underline,
  Heading, Link as CKLink, List, Table, TableToolbar, BlockQuote,
  Alignment, Font, HorizontalLine, Image, ImageInsert,
  ImageInsertViaUrl, ImageResize, ImageUpload, Base64UploadAdapter, FileRepository,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { useTeam } from '../context/TeamContext';
import projectCatalogService from '../services/projectCatalogService';
import projectService from '../services/projectService';

const STATUS_OPTIONS = ['Active', 'Planning', 'On Hold', 'Completed', 'Archived'];

const EDITOR_CONFIG = {
  licenseKey: 'GPL',
  plugins: [
    Essentials, Paragraph, Bold, Italic, Underline, Heading, CKLink,
    List, Table, TableToolbar, BlockQuote, Alignment, Font, HorizontalLine,
    FileRepository, Base64UploadAdapter, Image, ImageInsert,
    ImageInsertViaUrl, ImageResize, ImageUpload,
  ],
  toolbar: {
    items: [
      'heading', '|', 'bold', 'italic', 'underline', '|',
      'bulletedList', 'numberedList', '|',
      'link', 'uploadImage', 'insertImage', 'insertTable', 'blockQuote', 'horizontalLine', '|',
      'undo', 'redo',
    ],
  },
  image: {
    toolbar: ['imageStyle:inline', 'imageStyle:block', '|', 'toggleImageCaption', 'imageTextAlternative', '|', 'resizeImage'],
  },
  placeholder: 'Describe the project — goals, architecture, team, timeline…',
};

const CatalogFormPage = () => {
  const { teamId, catalogId } = useParams();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const tid = teamId || currentTeam?._id;
  const isEdit = !!catalogId;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    tagline: '',
    status: 'Active',
    linkedProject: '',
    tags: '',
    demoUrl: '',
    repoUrl: '',
    onePager: '',
  });

  useEffect(() => {
    const init = async () => {
      if (!tid) return;
      try {
        const [projRes] = await Promise.all([projectService.getProjects(tid)]);
        setProjects(projRes.data || []);

        if (isEdit) {
          const res = await projectCatalogService.getCatalogEntry(tid, catalogId);
          const e = res.data;
          setForm({
            title: e.title || '',
            tagline: e.tagline || '',
            status: e.status || 'Active',
            linkedProject: e.linkedProject?._id || '',
            tags: (e.tags || []).join(', '),
            demoUrl: e.demoUrl || '',
            repoUrl: e.repoUrl || '',
            onePager: e.onePager || '',
          });
        }
      } catch (err) {
        toast.error('Error loading data');
        navigate(`/teams/${tid}/catalog`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tid, catalogId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    setSaving(true);
    try {
      const data = {
        ...form,
        tags,
        linkedProject: form.linkedProject || null,
        demoUrl: form.demoUrl.trim() || null,
        repoUrl: form.repoUrl.trim() || null,
      };
      if (isEdit) {
        await projectCatalogService.updateCatalogEntry(tid, catalogId, data);
        toast.success('Entry updated');
        navigate(`/teams/${tid}/catalog/${catalogId}`);
      } else {
        const res = await projectCatalogService.createCatalogEntry(tid, data);
        toast.success('Added to catalog');
        navigate(`/teams/${tid}/catalog/${res.data?._id || ''}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(isEdit ? `/teams/${tid}/catalog/${catalogId}` : `/teams/${tid}/catalog`)}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Catalog Entry' : 'Add to Project Catalog'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEdit ? 'Update project information' : 'Add a new project to the catalog'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

            {/* One-pager */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                One-Pager
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Architecture, team, timeline, etc. Supports images.
              </p>
              <div className="border border-gray-300 rounded-xl overflow-hidden">
                <CKEditor
                  editor={ClassicEditor}
                  config={EDITOR_CONFIG}
                  data={form.onePager}
                  onChange={(event, editor) => setForm((p) => ({ ...p, onePager: editor.getData() }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => navigate(isEdit ? `/teams/${tid}/catalog/${catalogId}` : `/teams/${tid}/catalog`)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Update Entry' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CatalogFormPage;
