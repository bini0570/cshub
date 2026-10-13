import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCategories, saveContent } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { RichTextViewer } from '../../components/common/RichTextViewer';
import { generateSlug } from '../../utils/validators';

export function AdminContentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    body: '',
    content_type: 'article',
    category_id: '',
    status: 'published',
    visibility: 'public',
    is_featured: false,
    thumbnail_path: '',
    external_url: '',
    contributor_name: profile?.display_name || 'CS Hub Editorial',
    tags: '',
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const cats = await getCategories();
        setCategories(cats || []);

        if (isEditing) {
          const all = JSON.parse(localStorage.getItem('cshub_content') || '[]');
          const item = all.find((c) => c.id === id);
          if (item) {
            setFormData({
              ...item,
              tags: item.tags ? item.tags.join(', ') : '',
            });
          }
        } else if (cats && cats.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: cats[0].id }));
        }
      } catch (err) {
        console.error('Failed to load editor data:', err);
      }
    }
    loadData();
  }, [id, isEditing]);

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      // Auto-generate slug only if not editing or slug was derived
      slug: !isEditing ? generateSlug(title) : prev.slug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title.trim() || !formData.slug.trim()) {
      setErrorMsg('Title and slug are required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        id: isEditing ? id : undefined,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
      };

      await saveContent(payload);
      navigate('/admin/content');
    } catch (err) {
      console.error('Failed to save content:', err);
      setErrorMsg(err.message || 'Failed to save content record.');
    } finally {
      setSaving(false);
    }
  };

  const contentTypeOptions = [
    { value: 'article', label: 'Technical Article / Guide' },
    { value: 'resource', label: 'Downloadable Resource (Cheatsheet, Slides)' },
    { value: 'tool', label: 'Developer Tool / AI Utility' },
    { value: 'opportunity', label: 'Internship, Scholarship, or Hackathon' },
    { value: 'announcement', label: 'Platform Announcement' },
  ];

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-navy-800">
        <Link
          to="/admin/content"
          className="text-xs font-semibold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Content Manager
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
            icon={previewMode ? Edit3 : Eye}
          >
            {previewMode ? 'Back to Editor' : 'Preview HTML'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={saving}
            icon={Save}
          >
            {isEditing ? 'Update Record' : 'Publish Content'}
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {isEditing ? 'Edit Content Record' : 'Create New Educational Material'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ensure articles follow CS Hub academic accuracy standards and include code snippets or download references.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {previewMode ? (
        <Card className="p-8 space-y-6">
          <div className="border-b border-slate-100 dark:border-navy-800 pb-4">
            <span className="text-xs uppercase font-bold text-teal-600 dark:text-teal-400">
              Live Preview
            </span>
            <h2 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
              {formData.title || 'Untitled Post'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{formData.description}</p>
          </div>
          <RichTextViewer content={formData.body || '<p>No content entered yet.</p>'} />
        </Card>
      ) : (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Content Format"
                required
                options={contentTypeOptions}
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              />

              <Select
                label="Category"
                required
                options={categoryOptions}
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              />
            </div>

            <Input
              label="Title"
              required
              placeholder="e.g. Distributed Consensus in Go: Raft Algorithm Implementation"
              value={formData.title}
              onChange={handleTitleChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="URL Slug"
                required
                placeholder="distributed-consensus-go-raft"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                helperText="Unique permanent URL address identifier."
              />

              <Input
                label="Contributor / Author Attribution"
                placeholder="CS Hub Editorial Team"
                value={formData.contributor_name}
                onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
              />
            </div>

            <Textarea
              label="Short Description & Metadata Summary"
              required
              rows={3}
              placeholder="Brief summary displayed on social cards and listing grids..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Article Body (HTML / Markdown format)
              </label>
              <textarea
                rows={12}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="<h2>Introduction</h2><p>Explain key concepts, algorithms, and code examples...</p>"
                className="w-full font-mono text-xs rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950/60 p-4 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Rendered with DOMPurify sanitization. Supports standard tags: &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;pre&gt;&lt;code&gt;, &lt;ul&gt;, &lt;li&gt;.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cover Image Thumbnail URL"
                placeholder="https://images.unsplash.com/photo-..."
                value={formData.thumbnail_path}
                onChange={(e) => setFormData({ ...formData, thumbnail_path: e.target.value })}
              />

              <Input
                label="External Resource / Official Link (Optional)"
                placeholder="https://github.com/..."
                value={formData.external_url}
                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
              />
            </div>

            <Input
              label="Tags (Comma separated)"
              placeholder="Algorithms, Systems, Go, Open Source"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Select
                label="Publication Status"
                options={[
                  { value: 'published', label: 'Published (Publicly Viewable)' },
                  { value: 'draft', label: 'Draft (Saved Privately)' },
                  { value: 'archived', label: 'Archived' },
                ]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Feature on Homepage Hero Section
                  </span>
                </label>
              </div>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
