import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'CS Hub',
    tagline: 'The Independent Content Platform for Computer Science Students',
    contactEmail: 'editorial@cshub.dev',
    maxUploadSizeBytes: 20971520, // 20MB
    allowSubmissions: true,
    allowRegistrations: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('cshub_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="border-b border-slate-200 dark:border-navy-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-teal-500" />
          Global Platform Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Adjust platform branding, storage thresholds, and feature gates.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Platform settings updated successfully!</span>
        </div>
      )}

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Platform Name"
            required
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
          />

          <Input
            label="Platform Tagline"
            required
            value={settings.tagline}
            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
          />

          <Input
            label="Editorial Contact Email"
            type="email"
            required
            value={settings.contactEmail}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
          />

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Storage & Upload Limits
            </label>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Maximum File Size (Per Upload)
                </span>
                <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                  20 MB (20,971,520 bytes)
                </span>
              </div>
              <p className="text-slate-500">
                Enforced by Supabase Storage RLS bucket policies.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Platform Feature Controls
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900">
              <input
                type="checkbox"
                checked={settings.allowSubmissions}
                onChange={(e) => setSettings({ ...settings, allowSubmissions: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Allow Student Material Submissions
                </span>
                <p className="text-[11px] text-slate-500">
                  When enabled, registered users can submit guides and study files for review.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900">
              <input
                type="checkbox"
                checked={settings.allowRegistrations}
                onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Allow Public Student Registrations
                </span>
                <p className="text-[11px] text-slate-500">
                  When enabled, any visitor can register a student account.
                </p>
              </div>
            </label>
          </div>

          <Button type="submit" variant="primary" size="md" icon={Save}>
            Save Platform Settings
          </Button>
        </form>
      </Card>
    </div>
  );
}
