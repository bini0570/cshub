import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminRoute } from './features/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';

// Admin Pages
import {
  AdminDashboard as AdminDashboardPage,
  AdminModeration as AdminModerationPage,
  AdminContentManager as AdminContentPage,
  AdminContentEditor as AdminContentEditorPage,
  AdminUsers as AdminUsersPage,
  AdminAuditLogs as AdminAuditLogsPage,
  AdminSettings as AdminSettingsPage,
} from './admin';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Portal at /admin and root / */}
            <Route
              path="/"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="moderation" element={<AdminModerationPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="content/new" element={<AdminContentEditorPage />} />
              <Route path="content/:id/edit" element={<AdminContentEditorPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="audit" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Also support /admin/* explicitly */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="moderation" element={<AdminModerationPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="content/new" element={<AdminContentEditorPage />} />
              <Route path="content/:id/edit" element={<AdminContentEditorPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="audit" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
