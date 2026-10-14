import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Send,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCategories, createSubmission } from '../lib/supabase';
import { validateFile, MAX_FILE_SIZE_BYTES } from '../utils/validators';
import { formatBytes } from '../utils/formatters';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Card } from '../components/ui/Card';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function SubmitPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'resource',
    category_id: '',
    external_url: '',
    tags: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successSubmission, setSuccessSubmission] = useState(null);

  useEffect(() => {
    async function loadCats() {
      try {
        const list = await getCategories();
        setCategories(list || []);
        if (list && list.length > 0) {
          setFormData((prev) => ({ ...prev, category_id: list[0].id }));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCats();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error);
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Please provide a title and detailed description.');
      return;
    }

    if (!selectedFile && !formData.external_url.trim()) {
      setFormError('Please either upload a resource file or supply an external resource link.');
      return;
    }

    try {
      setSubmitting(true);

      const filesMeta = selectedFile
        ? [
            {
              name: selectedFile.name,
              size: selectedFile.size,
              mime: selectedFile.type || 'application/octet-stream',
            },
          ]
        : [];

      const submissionPayload = {
        submitter_id: user.id,
        submitter_name: profile?.display_name || user.email.split('@')[0],
        submitter_email: user.email,
        title: formData.title.trim(),
        description: formData.description.trim(),
        content_type: formData.content_type,
        category_id: formData.category_id || null,
        external_url: formData.external_url.trim() || null,
        files: filesMeta,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      const result = await createSubmission(submissionPayload);
      setSuccessSubmission(result);
    } catch (err) {
      console.error('Failed to submit material:', err);
      setFormError(err.message || 'Submission failed. Please check your data and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const contentTypeOptions = [
    { value: 'resource', label: 'Downloadable Resource (Cheatsheet, Slides, Notes)' },
    { value: 'article', label: 'Technical Article or Tutorial' },
    { value: 'tool', label: 'Developer Tool or AI Utility' },
    { value: 'opportunity', label: 'Internship, Hackathon, or Scholarship' },
  ];

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  if (successSubmission) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Submission Received for Peer Review!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            &quot;<span className="font-semibold text-slate-800 dark:text-slate-100">{successSubmission.title}</span>&quot; has been placed in the moderation queue with status <span className="font-semibold text-amber-600 dark:text-amber-400">Pending Review</span>.
          </p>
        </div>

        <Card className="p-6 text-left max-w-lg mx-auto bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-navy-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Steps</h3>
          <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <span>Your files remain private in a protected staging bucket during review.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <span>An editorial admin will review the content against accuracy standards.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
              <span>You will receive an in-app notification when a decision or edit request is made.</span>
            </li>
          </ul>
        </Card>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link to="/my-submissions">
            <Button variant="primary" size="md">
              View Submission Status
            </Button>
          </Link>
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setSuccessSubmission(null);
              setFormData({
                title: '',
                description: '',
                content_type: 'resource',
                category_id: categories[0]?.id || '',
                external_url: '',
                tags: '',
              });
              setSelectedFile(null);
            }}
          >
            Submit Another Material
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: 'Submit Material' }]} />

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Submit Educational Material
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Share your computer science notes, algorithm implementations, cheatsheets, or favorite
          developer utilities with the community.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

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
            label="Material Title"
            required
            placeholder="e.g. Distributed Consensus in Go: Raft Algorithm Implementation"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <Textarea
            label="Summary & Key Concepts"
            required
            rows={4}
            placeholder="Provide a comprehensive explanation of what this material covers, target audience, and key prerequisites..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="External URL / Repository (Optional)"
            placeholder="https://github.com/username/project or https://colab.research.google.com"
            value={formData.external_url}
            onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
            helperText="Link to GitHub repository, Colab notebook, or official tool site."
          />

          <Input
            label="Tags (Comma separated)"
            placeholder="Algorithms, Go, Raft, Distributed Systems"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />

          {/* Secure File Upload Zone */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Upload Document or Resource File (Max 20 MB)
            </label>

            <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50 dark:bg-navy-950/40">
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-left">
                  <div className="flex items-center gap-3 truncate pr-3">
                    <FileText className="w-6 h-6 text-teal-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatBytes(selectedFile.size)} • {selectedFile.type || 'file'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <UploadCloud className="w-10 h-10 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Click to select file or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Allowed: PDF, DOCX, PPTX, Images (PNG, JPG, WebP), TXT, Markdown, ZIP
                  </p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="mt-3 text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-950/60 dark:file:text-teal-300 hover:file:bg-teal-100 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {fileError && <p className="text-xs text-rose-600 font-medium">{fileError}</p>}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-500" /> Moderation & Storage Policy
            </span>
            <p>
              Submissions are initially stored in a private Supabase bucket. They are not publicly
              accessible until an administrator reviews and approves the educational content.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={submitting}
            icon={Send}
            className="w-full sm:w-auto"
          >
            Submit for Editorial Review
          </Button>
        </form>
      </Card>
    </div>
  );
}
