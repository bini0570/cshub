import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  FileText,
  ExternalLink,
  ShieldCheck,
  User,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSubmissions, reviewSubmission, saveContent } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { generateSlug } from '../../utils/validators';
import { formatDate, formatRelativeTime, formatBytes, STATUS_STYLES } from '../../utils/formatters';

export function AdminModerationPage() {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  // Review modal state
  const [reviewModalSub, setReviewModalSub] = useState(null);
  const [decision, setDecision] = useState(''); // 'approved', 'rejected', 'changes_requested'
  const [reviewNote, setReviewNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getSubmissions({ isAdmin: true });
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to load moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const openDecisionModal = (sub, chosenDecision) => {
    setReviewModalSub(sub);
    setDecision(chosenDecision);
    setReviewNote(sub.review_note || '');
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!reviewModalSub || !decision) return;

    try {
      setIsProcessing(true);
      await reviewSubmission(reviewModalSub.id, {
        status: decision,
        review_note: reviewNote,
        reviewer_id: profile?.id || 'admin',
        reviewer_name: profile?.display_name || 'Admin Reviewer',
      });

      // If approved, automatically create a published/draft content record
      if (decision === 'approved') {
        const slug = generateSlug(reviewModalSub.title);
        await saveContent({
          title: reviewModalSub.title,
          slug,
          description: reviewModalSub.description,
          body: `<p>${reviewModalSub.description}</p>`,
          content_type: reviewModalSub.content_type,
          category_id: reviewModalSub.category_id,
          external_url: reviewModalSub.external_url,
          contributor_name: reviewModalSub.submitter_name,
          author_id: reviewModalSub.submitter_id,
          status: 'published',
          visibility: 'public',
          published_at: new Date().toISOString(),
          file_info: reviewModalSub.files?.[0] || null,
        });
      }

      setReviewModalSub(null);
      await loadSubmissions();
    } catch (err) {
      console.error('Error recording review decision:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (activeTab === 'all') return true;
    return s.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-navy-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileCheck2 className="w-7 h-7 text-teal-500" />
            Submission Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review student uploads, check security formats, request revisions, and publish approved materials.
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-navy-900 p-1.5 rounded-xl border border-slate-200 dark:border-navy-800 overflow-x-auto">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'changes_requested', label: 'Changes Requested' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All' },
          ].map((tab) => {
            const count = submissions.filter((s) => (tab.id === 'all' ? true : s.status === tab.id)).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-navy-900 text-white dark:bg-teal-500 dark:text-navy-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-navy-700/80 text-slate-700 dark:text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Moderation List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Loading moderation queue...
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">No submissions in this filter.</p>
          <p className="text-xs text-slate-400 mt-1">Everything in this queue has been processed.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const style = STATUS_STYLES[sub.status] || STATUS_STYLES.pending;
            return (
              <Card key={sub.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Metadata & Submitter Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${style.bg} ${style.text} ${style.border}`}
                      >
                        {style.label}
                      </span>
                      <Badge variant="teal" size="sm" className="capitalize">
                        {sub.content_type}
                      </Badge>
                      {sub.category_name && (
                        <span className="text-xs text-slate-500 font-medium">
                          • {sub.category_name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {sub.title}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {sub.description}
                    </p>

                    {/* Submitter & Time Info */}
                    <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-teal-500" />
                        {sub.submitter_name || 'Student Submitter'} ({sub.submitter_email})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Submitted {formatDate(sub.created_at)} ({formatRelativeTime(sub.created_at)})
                      </span>
                    </div>

                    {/* Attached Private Files & URLs */}
                    <div className="pt-2 flex flex-wrap gap-2 text-xs">
                      {sub.files && sub.files.length > 0 && (
                        <div className="p-2 px-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-500" />
                          <span className="font-mono text-slate-800 dark:text-slate-200">
                            {sub.files[0].name}
                          </span>
                          <span className="text-slate-400">
                            ({formatBytes(sub.files[0].size)})
                          </span>
                        </div>
                      )}
                      {sub.external_url && (
                        <a
                          href={sub.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 px-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open Submitter URL
                        </a>
                      )}
                    </div>

                    {/* Review Note Display if reviewed */}
                    {sub.review_note && (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                          Editorial Feedback Note:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400">{sub.review_note}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => openDecisionModal(sub, 'approved')}
                    >
                      Approve & Publish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={AlertTriangle}
                      onClick={() => openDecisionModal(sub, 'changes_requested')}
                    >
                      Request Changes
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => openDecisionModal(sub, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={Boolean(reviewModalSub)}
        onClose={() => setReviewModalSub(null)}
        title={`Confirm Decision: ${decision.replace('_', ' ').toUpperCase()}`}
      >
        <form onSubmit={handleConfirmDecision} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-xs space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Target Material:
            </span>
            <p className="text-slate-600 dark:text-slate-300">{reviewModalSub?.title}</p>
          </div>

          <Textarea
            label={
              decision === 'changes_requested'
                ? 'Revision Instructions (Sent to Student)'
                : 'Reviewer Note or Rationale'
            }
            required={decision === 'changes_requested'}
            rows={4}
            placeholder={
              decision === 'approved'
                ? 'Optional approval comments or editorial corrections note...'
                : 'Explain what code or content adjustments the student must make...'
            }
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            helperText="This feedback will be visible to the student in their submission queue."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setReviewModalSub(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decision === 'rejected' ? 'danger' : 'primary'}
              isLoading={isProcessing}
            >
              Confirm Decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
