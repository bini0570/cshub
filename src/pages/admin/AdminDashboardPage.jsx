import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileCheck2,
  Files,
  Eye,
  Download,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getPublishedContent, getSubmissions, getAuditLogs } from '../../lib/supabase';
import { formatDate, formatRelativeTime, STATUS_STYLES } from '../../utils/formatters';

export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    usersCount: 0,
    publishedCount: 0,
    pendingSubmissionsCount: 0,
    totalViews: 0,
    totalDownloads: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [popularContent, setPopularContent] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardMetrics() {
      try {
        setLoading(true);
        const [contentList, allSubmissions, auditLogs] = await Promise.all([
          getPublishedContent(),
          getSubmissions({ isAdmin: true }),
          getAuditLogs(),
        ]);

        const rawUsers = JSON.parse(localStorage.getItem('cshub_users') || '[]');
        const totalViews = (contentList || []).reduce((acc, c) => acc + (c.view_count || 0), 0);
        const totalDownloads = (contentList || []).reduce((acc, c) => acc + (c.download_count || 0), 0);
        const pendingCount = (allSubmissions || []).filter((s) => s.status === 'pending').length;

        // Popular content sorted by views + downloads
        const popular = [...(contentList || [])]
          .sort((a, b) => (b.view_count + b.download_count) - (a.view_count + a.download_count))
          .slice(0, 5);

        setStats({
          usersCount: rawUsers.length,
          publishedCount: (contentList || []).length,
          pendingSubmissionsCount: pendingCount,
          totalViews,
          totalDownloads,
        });

        setRecentSubmissions((allSubmissions || []).slice(0, 5));
        setPopularContent(popular);
        setRecentLogs((auditLogs || []).slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardMetrics();
  }, []);

  const statCards = [
    {
      label: 'Registered Students & Users',
      value: stats.usersCount,
      icon: Users,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      label: 'Published Educational Materials',
      value: stats.publishedCount,
      icon: Files,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/50',
    },
    {
      label: 'Pending Submissions',
      value: stats.pendingSubmissionsCount,
      icon: FileCheck2,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50',
      actionLink: '/admin/moderation',
    },
    {
      label: 'Total Resource Views',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      label: 'Total Material Downloads',
      value: stats.totalDownloads.toLocaleString(),
      icon: Download,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Platform Administration & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time statistics sourced directly from the CS Hub PostgreSQL database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/content/new">
            <Button variant="primary" size="sm">
              Create New Content
            </Button>
          </Link>
          <Link to="/admin/moderation">
            <Button variant="outline" size="sm">
              Review Queue ({stats.pendingSubmissionsCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {c.label}
                </span>
                <div className={`p-2 rounded-lg ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {loading ? '—' : c.value}
                </span>
                {c.actionLink && stats.pendingSubmissionsCount > 0 && (
                  <Link
                    to={c.actionLink}
                    className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline mt-1"
                  >
                    Action required →
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Split: Moderation Queue Preview & Popular Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Submissions */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-500" />
                Recent Student Submissions
              </h2>
              <Link to="/admin/moderation" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                View all queue
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-navy-800 mt-2">
              {recentSubmissions.length === 0 ? (
                <p className="py-6 text-xs text-slate-400 text-center">No submissions yet.</p>
              ) : (
                recentSubmissions.map((sub) => {
                  const style = STATUS_STYLES[sub.status] || STATUS_STYLES.pending;
                  return (
                    <div key={sub.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {sub.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          By {sub.submitter_name || 'Student'} • {formatRelativeTime(sub.created_at)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${style.bg} ${style.text} ${style.border}`}
                      >
                        {style.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 mt-4">
            <Link to="/admin/moderation">
              <Button variant="outline" size="sm" className="w-full">
                Open Full Moderation Queue
              </Button>
            </Link>
          </div>
        </Card>

        {/* Most Popular Content */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-500" />
                Most Popular Published Content
              </h2>
              <Link to="/admin/content" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                Manage all
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-navy-800 mt-2">
              {popularContent.length === 0 ? (
                <p className="py-6 text-xs text-slate-400 text-center">No content tracked.</p>
              ) : (
                popularContent.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {item.content_type} • {item.category_name || 'General'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.view_count || 0}
                      </span>
                      {item.download_count > 0 && (
                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
                          <Download className="w-3 h-3" />
                          {item.download_count}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 mt-4">
            <Link to="/admin/content">
              <Button variant="outline" size="sm" className="w-full">
                Go to Content Manager
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Administrative Actions Audit */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-800 mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            Recent Administrative Actions (Audit Log)
          </h2>
          <Link to="/admin/audit" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
            View full audit logs
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-navy-800">
                <th className="py-2.5 font-semibold">Timestamp</th>
                <th className="py-2.5 font-semibold">Administrator</th>
                <th className="py-2.5 font-semibold">Action</th>
                <th className="py-2.5 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {recentLogs.map((log) => (
                <tr key={log.id} className="text-slate-600 dark:text-slate-300">
                  <td className="py-2.5 font-mono text-[11px]">{formatDate(log.created_at)}</td>
                  <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                    {log.admin_name || 'System Admin'}
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-[10px] font-mono font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 truncate max-w-xs text-slate-500">
                    {log.target_type}: {log.target_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
