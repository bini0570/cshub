import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Edit,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSubmissions } from '../lib/supabase';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea } from '../components/ui/Input';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatRelativeTime, STATUS_STYLES } from '../utils/formatters';

export function MySubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSub, setEditingSub] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', external_url: '' });

  const loadSubmissions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getSubmissions({ userId: user.id });
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to load user submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  const handleOpenEdit = (sub) => {
    setEditingSub(sub);
    setEditForm({
      title: sub.title,
      description: sub.description,
      external_url: sub.external_url || '',
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingSub) return;

    // Update in local store
    const all = JSON.parse(localStorage.getItem('cshub_submissions') || '[]');
    const updated = all.map((s) =>
      s.id === editingSub.id
        ? {
            ...s,
            title: editForm.title,
            description: editForm.description,
            external_url: editForm.external_url,
            status: 'pending', // Re-enter pending review upon update
            updated_at: new Date().toISOString(),
          }
        : s
    );
    localStorage.setItem('cshub_submissions', JSON.stringify(updated));
    setEditingSub(null);
    loadSubmissions();
  };

  const getStatusBadge = (status) => {
    const config = STATUS_STYLES[status] || STATUS_STYLES.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'My Submissions' }]} />

      <div className="border-b border-slate-200 dark:border-navy-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Submission Queue & Statuses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track peer-review milestones, reviewer feedback notes, and publish statuses for your contributed materials.
          </p>
        </div>

        <Link to="/submit">
          <Button variant="primary" size="sm" icon={Plus}>
            New Submission
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading submission history...
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState
          title="No materials submitted yet"
          description="Have lecture slides, cheat sheets, or articles to share? Submit your first educational material to help fellow students."
          actionLabel="Submit Material Now"
          onAction={() => (window.location.href = '/submit')}
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <Card key={sub.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(sub.status)}
                    <Badge variant="navy" size="sm" className="capitalize">
                      {sub.content_type}
                    </Badge>
                    {sub.category_name && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        • {sub.category_name}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {sub.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    {sub.description}
                  </p>

                  {/* Attached Files & Links */}
                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    {sub.files && sub.files.length > 0 && (
                      <span className="p-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-teal-500" />
                        {sub.files[0].name}
                      </span>
                    )}
                    {sub.external_url && (
                      <a
                        href={sub.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-teal-600 dark:text-teal-400 text-[11px] flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> External Link
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Action / Timestamp */}
                <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">
                    Submitted {formatRelativeTime(sub.created_at)}
                  </span>

                  {(sub.status === 'pending' || sub.status === 'changes_requested') && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleOpenEdit(sub)}
                    >
                      Update
                    </Button>
                  )}
                </div>
              </div>

              {/* Review Note / Editorial Feedback */}
              {sub.review_note && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-navy-800/80 bg-slate-50 dark:bg-navy-950/40 p-4 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Editorial Review Feedback ({formatDate(sub.reviewed_at)})
                      </span>
                      <p className="text-slate-600 dark:text-slate-300">{sub.review_note}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal (Changes Requested) */}
      <Modal
        isOpen={Boolean(editingSub)}
        onClose={() => setEditingSub(null)}
        title="Update Submission Details"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Title"
            required
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />

          <Textarea
            label="Description"
            required
            rows={4}
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
          />

          <Input
            label="External URL"
            value={editForm.external_url}
            onChange={(e) => setEditForm({ ...editForm, external_url: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditingSub(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Re-submit for Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
