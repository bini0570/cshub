/**
 * CS Hub — Admin Module
 * Contains all Administrator views, dashboard metrics, moderation queue,
 * content management, user management, and security audit logs.
 */

export { AdminLayout } from './components/AdminLayout';
export {
  AdminDashboardPage,
  AdminDashboardPage as AdminDashboard,
  AdminModerationPage,
  AdminModerationPage as AdminModeration,
  AdminContentPage,
  AdminContentPage as AdminContentManager,
  AdminContentEditorPage,
  AdminContentEditorPage as AdminContentEditor,
  AdminUsersPage,
  AdminUsersPage as AdminUsers,
  AdminAuditLogsPage,
  AdminAuditLogsPage as AdminAuditLogs,
  AdminSettingsPage,
  AdminSettingsPage as AdminSettings,
} from './pages';
