import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Github, Globe, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Card } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../utils/formatters';

export function ProfilePage() {
  const { user, profile, updateProfile, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    github_username: profile?.github_username || '',
    website_url: profile?.website_url || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.display_name.trim()) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      await updateProfile(formData);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: 'User Profile' }]} />

      {/* Header Profile Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-r from-navy-900 to-navy-950 text-white border-navy-800">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-3xl font-extrabold uppercase shadow-lg border-2 border-teal-400">
            {profile?.display_name ? profile.display_name.charAt(0) : 'U'}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{profile?.display_name || 'Student Member'}</h1>
              <Badge variant="teal" size="sm" className="uppercase font-bold tracking-wider">
                {profile?.role || 'student'}
              </Badge>
              {isAdmin && (
                <Badge variant="amber" size="sm" className="font-bold">
                  Admin Access Granted
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <p className="text-xs text-slate-400">
              Member since {formatDate(profile?.created_at || new Date())}
            </p>
          </div>
        </div>
      </Card>

      {/* Profile Edit Form */}
      <Card className="p-6 sm:p-8">
        <div className="border-b border-slate-100 dark:border-navy-800 pb-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Profile Details & Public Attribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize how your contributor name and bio appear when publishing guides and resources.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Display Name"
            required
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            helperText="Appears on all materials and submissions you contribute."
          />

          <Textarea
            label="Bio or Student Focus"
            rows={3}
            placeholder="e.g. 3rd year CS student at University. Focused on Distributed Systems, Rust, and Operating Systems."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GitHub Username"
              icon={Github}
              placeholder="e.g. octocat"
              value={formData.github_username}
              onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
            />

            <Input
              label="Portfolio / Website URL"
              icon={Globe}
              placeholder="https://yourportfolio.dev"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            />
          </div>

          {/* Security Notice on Role Escalation */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-xs text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-teal-500" /> Security Boundary
            </span>
            <p>
              Account roles are enforced at the database layer through PostgreSQL Row Level Security (RLS).
              Role elevation requires administrator verification.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            icon={Save}
            className="w-full sm:w-auto"
          >
            Save Profile Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
