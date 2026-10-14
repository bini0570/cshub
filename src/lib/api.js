/**
 * CS Hub Frontend API Client
 * Connects directly to the Railway Express Backend with graceful fallback to local storage.
 */

import {
  INITIAL_CATEGORIES,
  INITIAL_CONTENT,
  INITIAL_SUBMISSIONS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function getAuthHeaders() {
  const token = localStorage.getItem('cshub_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ==============================================================================
// LOCAL STORAGE REPOSITORY (Fallback when Railway API is not configured/offline)
// ==============================================================================
function getLocalItem(key, fallback) {
  try {
    const data = localStorage.getItem(`cshub_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem(key, data) {
  try {
    localStorage.setItem(`cshub_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local repository', err);
  }
}

// Seed mock store if empty
if (typeof window !== 'undefined' && !localStorage.getItem('cshub_categories')) {
  setLocalItem('categories', INITIAL_CATEGORIES);
  setLocalItem('content', INITIAL_CONTENT);
  setLocalItem('submissions', INITIAL_SUBMISSIONS);
  setLocalItem('users', INITIAL_USERS);
  setLocalItem('notifications', INITIAL_NOTIFICATIONS);
  setLocalItem('audit_logs', INITIAL_AUDIT_LOGS);
  setLocalItem('bookmarks', ['content-2']);
}

// ==============================================================================
// API SERVICE METHODS
// ==============================================================================

/**
 * Fetch all categories
 */
export async function getCategories() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('API error, falling back to local store:', err.message);
    }
  }
  return getLocalItem('categories', INITIAL_CATEGORIES);
}

/**
 * Fetch published content with filters
 */
export async function getPublishedContent({ type, categorySlug, search, isFeatured, limit } = {}) {
  if (API_BASE_URL) {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (categorySlug) params.append('categorySlug', categorySlug);
      if (search) params.append('search', search);
      if (isFeatured !== undefined) params.append('isFeatured', isFeatured);
      if (limit) params.append('limit', limit);

      const res = await fetch(`${API_BASE_URL}/api/content?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('API error, falling back to local store:', err.message);
    }
  }

  // Local fallback
  let list = getLocalItem('content', INITIAL_CONTENT).filter(
    (c) => c.status === 'published' && c.visibility === 'public'
  );

  if (type) list = list.filter((c) => c.content_type === type);
  if (isFeatured !== undefined) list = list.filter((c) => Boolean(c.is_featured) === Boolean(isFeatured));
  if (categorySlug) {
    const cats = getLocalItem('categories', INITIAL_CATEGORIES);
    const cat = cats.find((k) => k.slug === categorySlug);
    if (cat) list = list.filter((c) => c.category_id === cat.id);
  }
  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }
  if (limit) list = list.slice(0, limit);
  return list;
}

/**
 * Fetch single content record by slug
 */
export async function getContentBySlug(slug) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/content/${slug}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('API error, falling back to local store:', err.message);
    }
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  return all.find((c) => c.slug === slug) || null;
}

/**
 * Increment content view count
 */
export async function trackContentView(contentId) {
  if (API_BASE_URL) {
    try {
      await fetch(`${API_BASE_URL}/api/content/${contentId}/view`, { method: 'POST' });
      return;
    } catch (err) {
      // ignore
    }
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  const updated = all.map((c) => (c.id === contentId ? { ...c, view_count: (c.view_count || 0) + 1 } : c));
  setLocalItem('content', updated);
}

/**
 * Increment download count
 */
export async function trackContentDownload(contentId) {
  if (API_BASE_URL) {
    try {
      await fetch(`${API_BASE_URL}/api/content/${contentId}/download`, { method: 'POST' });
      return;
    } catch (err) {
      // ignore
    }
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  const updated = all.map((c) => (c.id === contentId ? { ...c, download_count: (c.download_count || 0) + 1 } : c));
  setLocalItem('content', updated);
}

/**
 * Fetch submissions for user or admin
 */
export async function getSubmissions({ userId, isAdmin = false } = {}) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('API error, falling back to local submissions:', err.message);
    }
  }

  const all = getLocalItem('submissions', INITIAL_SUBMISSIONS);
  if (isAdmin) return all;
  return all.filter((s) => s.submitter_id === userId);
}

/**
 * Create a new student submission
 */
export async function createSubmission(submissionData) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(submissionData),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('API error, falling back to local submission:', err.message);
    }
  }

  const all = getLocalItem('submissions', INITIAL_SUBMISSIONS);
  const newSub = {
    id: `sub-${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString(),
    ...submissionData,
  };
  setLocalItem('submissions', [newSub, ...all]);
  return newSub;
}

/**
 * Update submission review status (Admin only)
 */
export async function reviewSubmission(submissionId, { status, review_note, reviewer_name, publish = false }) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/review`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, review_note, publish }),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('API error, falling back to local review:', err.message);
    }
  }

  const all = getLocalItem('submissions', INITIAL_SUBMISSIONS);
  const updated = all.map((s) =>
    s.id === submissionId
      ? { ...s, status, review_note, reviewed_at: new Date().toISOString() }
      : s
  );
  setLocalItem('submissions', updated);
  return updated.find((s) => s.id === submissionId);
}

/**
 * Bookmarks management
 */
export async function getUserBookmarks(userId) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      // ignore
    }
  }

  const savedIds = getLocalItem('bookmarks', []);
  const allContent = getLocalItem('content', INITIAL_CONTENT);
  return allContent.filter((c) => savedIds.includes(c.id));
}

export async function toggleBookmark(userId, contentId) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookmarks/toggle`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content_id: contentId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.bookmarked;
      }
    } catch (err) {
      // ignore
    }
  }

  const savedIds = getLocalItem('bookmarks', []);
  let isBookmarked = false;
  let newIds;
  if (savedIds.includes(contentId)) {
    newIds = savedIds.filter((id) => id !== contentId);
    isBookmarked = false;
  } else {
    newIds = [...savedIds, contentId];
    isBookmarked = true;
  }
  setLocalItem('bookmarks', newIds);
  return isBookmarked;
}

/**
 * Admin Content Management
 */
export async function saveContent(contentRecord) {
  if (API_BASE_URL) {
    try {
      const url = contentRecord.id ? `${API_BASE_URL}/api/content/${contentRecord.id}` : `${API_BASE_URL}/api/content`;
      const method = contentRecord.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(contentRecord),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('API error, falling back to local store:', err.message);
    }
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  if (contentRecord.id) {
    const updated = all.map((c) =>
      c.id === contentRecord.id ? { ...c, ...contentRecord, updated_at: new Date().toISOString() } : c
    );
    setLocalItem('content', updated);
    return contentRecord;
  } else {
    const newContent = {
      ...contentRecord,
      id: `content-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_count: 0,
      download_count: 0,
    };
    setLocalItem('content', [newContent, ...all]);
    return newContent;
  }
}

export async function deleteContent(contentId) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/content/${contentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) return true;
    } catch (err) {
      // ignore
    }
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  setLocalItem('content', all.filter((c) => c.id !== contentId));
  return true;
}

/**
 * Admin Audit Logs
 */
export async function getAuditLogs() {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/audit-logs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      // ignore
    }
  }
  return getLocalItem('audit_logs', INITIAL_AUDIT_LOGS);
}

/**
 * Submit user report
 */
export async function submitReport({ content_id, user_id, reason, details }) {
  const reports = getLocalItem('reports', []);
  const newReport = {
    id: `rep-${Date.now()}`,
    content_id,
    user_id,
    reason,
    details,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  setLocalItem('reports', [newReport, ...reports]);
  return newReport;
}

export const isSupabaseConfigured = false;
export const supabase = null;
