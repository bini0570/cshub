import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, MessageSquare, Flag, CheckCircle, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitReport } from '../lib/supabase';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Card } from '../components/ui/Card';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function ContactPage() {
  const [searchParams] = useSearchParams();
  const reportSlug = searchParams.get('report') || '';
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    subject: reportSlug ? `Content Correction: ${reportSlug}` : '',
    email: user?.email || '',
    category: reportSlug ? 'correction' : 'general',
    details: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const reportReasons = [
    { value: 'correction', label: 'Content Correction or Code Fix' },
    { value: 'broken_download', label: 'Broken Download or Link' },
    { value: 'attribution', label: 'Attribution or Copyright Notice' },
    { value: 'outdated', label: 'Outdated Technical Information' },
    { value: 'general', label: 'General Feedback or Feature Request' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.details.trim()) {
      setErrorMsg('Please provide a description of your inquiry or report.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      await submitReport({
        content_id: reportSlug || null,
        user_id: user?.id || null,
        reason: `${formData.category}: ${formData.subject}`,
        details: `${formData.details} (Contact: ${formData.email || 'Anonymous'})`,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit contact report:', err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: 'Contact & Corrections' }]} />

      <div className="space-y-3">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Contact Editorial Team & Report Corrections
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Found an error in an algorithm tutorial? Have an updated version of a cheat sheet? Or want to
          give general feedback? We welcome contributions and corrections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="p-6 space-y-4 md:col-span-1 bg-slate-50 dark:bg-navy-900">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Direct Communication
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For general inquiries or partnerships:
            </p>
            <p className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400 pt-1">
              editorial@cshub.dev
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-navy-800 space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Resolution Turnaround
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Technical errata and broken link tickets are typically reviewed within 24 to 48 hours.
            </p>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="p-6 md:col-span-2">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Report Received Successfully
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Thank you for contributing to the accuracy of CS Hub! Our review team has recorded your
                ticket and will investigate shortly.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    subject: '',
                    email: user?.email || '',
                    category: 'general',
                    details: '',
                  });
                }}
              >
                Send Another Note
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Topic or Reason"
                required
                options={reportReasons}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />

              <Input
                label="Subject or Page Reference"
                required
                placeholder="e.g. Broken link on Raft consensus tutorial"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />

              <Input
                label="Your Email (Optional, for updates)"
                type="email"
                placeholder="student@example.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                helperText="We will only use this to send you resolution updates on your ticket."
              />

              <Textarea
                label="Detailed Description"
                required
                rows={5}
                placeholder="Describe the issue, requested update, or feedback in detail..."
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              />

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                icon={Send}
                className="w-full sm:w-auto"
              >
                Submit Message / Correction
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
