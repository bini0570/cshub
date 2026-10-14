import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute, AdminRoute } from './features/auth/ProtectedRoute';

// Student Portal
import {
  StudentHomePage as HomePage,
  StudentResourcesPage as ResourcesPage,
  StudentResourceDetailPage as ResourceDetailPage,
  StudentArticlesPage as ArticlesPage,
  StudentArticleDetailPage as ArticleDetailPage,
  StudentToolsPage as ToolsPage,
  StudentToolDetailPage as ToolDetailPage,
  StudentOpportunitiesPage as OpportunitiesPage,
  StudentOpportunityDetailPage as OpportunityDetailPage,
  StudentSubmitPage as SubmitPage,
  StudentSubmissionsPage as MySubmissionsPage,
  StudentBookmarksPage as BookmarksPage,
  StudentProfilePage as ProfilePage,
} from './student';

import { SearchPage } from './pages/SearchPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Portal
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
            {/* Public and Student App Routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/resources/:slug" element={<ResourceDetailPage />} />
              <Route path="/articles" element={<ArticlesPage />} />
              <Route path="/articles/:slug" element={<ArticleDetailPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/tools/:slug" element={<ToolDetailPage />} />
              <Route path="/opportunities" element={<OpportunitiesPage />} />
              <Route path="/opportunities/:slug" element={<OpportunityDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Student Account Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookmarks"
                element={
                  <ProtectedRoute>
                    <BookmarksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submit"
                element={
                  <ProtectedRoute>
                    <SubmitPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-submissions"
                element={
                  <ProtectedRoute>
                    <MySubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Protected Admin Routes */}
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
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
