import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor, Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
  Heading, Link as CKLink, List, Table, TableToolbar, BlockQuote,
  Alignment, Font, Indent, IndentBlock,
  Image, ImageInsert, ImageInsertViaUrl, ImageResize, ImageUpload,
  Base64UploadAdapter, MediaEmbed, HorizontalLine, Highlight, FileRepository,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { useTeam } from '../context/TeamContext';
import newsletterService from '../services/newsletterService';
import projectService from '../services/projectService';

const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const EDITOR_CONFIG = {
  licenseKey: 'GPL',
  plugins: [
    Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
    Heading, CKLink, List, Table, TableToolbar, BlockQuote,
    Alignment, Font, Indent, IndentBlock,
    FileRepository, Base64UploadAdapter,
    Image, ImageInsert, ImageInsertViaUrl, ImageResize, ImageUpload,
    MediaEmbed, HorizontalLine, Highlight,
  ],
  toolbar: {
    items: [
      'heading', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'bulletedList', 'numberedList', '|',
      'alignment', '|',
      'link', 'uploadImage', 'insertImage', 'insertTable', 'blockQuote', 'mediaEmbed', 'horizontalLine', '|',
      'highlight', '|', 'fontSize', 'fontColor', '|',
      'undo', 'redo',
    ],
  },
  image: {
    toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'toggleImageCaption', 'imageTextAlternative', '|', 'resizeImage'],
  },
  placeholder: 'Write your newsletter content here…',
};

const NewsletterFormPage = () => {
  const { teamId, newsletterId } = useParams();
  const navigate = useNavigate();
  const { currentTeam } = useTeam();
  const tid = teamId || currentTeam?._id;
  const isEdit = !!newsletterId;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', summary: '', project: '', isPinned: false, content: '',
  });

  useEffect(() => {
    const init = async () => {
      if (!tid) return;
      try {
        const [projRes] = await Promise.all([projectService.getProjects(tid)]);
        setProjects(projRes.data || []);

        if (isEdit) {
          const newsRes = await newsletterService.getNewsletter(tid, newsletterId);
          const item = newsRes.data;
          setForm({
            title: item.title || '',
            summary: item.summary || '',
            project: item.project?._id || '',
            isPinned: !!item.isPinned,
            content: item.content || '',
          });
        }
      } catch (err) {
        toast.error('Error loading data');
        navigate(`/teams/${tid}/newsletters`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tid, newsletterId]);

  const handleSave = async () => {
    if (!tid) return;
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
      if (isEdit) {
        await newsletterService.updateNewsletter(tid, newsletterId, payload);
        toast.success('Newsletter updated');
      } else {
        await newsletterService.createNewsletter(tid, payload);
        toast.success('Newsletter published');
      }
      navigate(`/teams/${tid}/newsletters`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving newsletter');
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
            onClick={() => navigate(`/teams/${tid}/newsletters`)}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Edit Newsletter' : 'New Newsletter'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEdit ? 'Update your newsletter' : 'Create a new team newsletter'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Newsletter title"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Summary</label>
              <input
                value={form.summary}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Brief summary shown on cards"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
                <select
                  value={form.project}
                  onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">General (No project)</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={(e) => setForm((p) => ({ ...p, isPinned: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                  />
                  Pin to top
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Content <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                You can paste or drag images directly into the editor, or use the upload button in the toolbar.
              </p>
              <div className="border border-gray-300 rounded-xl overflow-hidden">
                <CKEditor
                  editor={ClassicEditor}
                  config={EDITOR_CONFIG}
                  data={form.content}
                  onChange={(event, editor) => setForm((p) => ({ ...p, content: editor.getData() }))}
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => navigate(`/teams/${tid}/newsletters`)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Update Newsletter' : 'Publish Newsletter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterFormPage;
