import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sliders, Bell, Shield, KeyRound, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function SettingsPage() {
  const { user, profile } = useAuth();
  const [notifyOnReview, setNotifyOnReview] = useState(true);
  const [notifyOnDigest, setNotifyOnDigest] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = () => {
    setSavedMsg('Settings saved successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: 'Settings' }]} />

      <div className="border-b border-slate-200 dark:border-navy-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Account & Notification Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure security preferences and in-app editorial review notifications.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Notifications Preferences */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-navy-800">
          <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Editorial Notifications
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnReview}
              onChange={(e) => setNotifyOnReview(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Submission Status Alerts
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Notify me when a reviewer approves, rejects, or requests changes on my materials.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnDigest}
              onChange={(e) => setNotifyOnDigest(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Monthly Technical Resource Digest
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Receive a monthly curated list of trending tutorials and internship openings.
              </p>
            </div>
          </label>
        </div>
      </Card>

      {/* Account Security */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-navy-800">
          <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Authentication & Security
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Authenticated Email
              </span>
              <span className="text-slate-500 font-mono">{user?.email}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              Verified
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Account Role
              </span>
              <span className="text-slate-500 capitalize">{profile?.role || 'student'}</span>
            </div>
            <span className="text-slate-400 text-[11px]">Protected by RLS</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" size="md" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
