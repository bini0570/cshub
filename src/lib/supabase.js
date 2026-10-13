import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_CATEGORIES,
  INITIAL_CONTENT,
  INITIAL_SUBMISSIONS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Live Supabase Client (if credentials provided)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// ==============================================================================
// LOCAL STORAGE REPOSITORY (Fallback for zero-config demonstration / development)
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

// Initialize mock store if not present
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
// DATABASE SERVICE ABSTRACTIONS
// ==============================================================================

/**
 * Fetch all categories
 */
export async function getCategories() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  }
  return getLocalItem('categories', INITIAL_CATEGORIES);
}

/**
 * Fetch published content with optional filtering by type, category, or search
 */
export async function getPublishedContent({ type, categorySlug, search, isFeatured, limit } = {}) {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('content')
      .select(`
        *,
        categories:content_categories(category:categories(*)),
        content_files(*)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false });

    if (type) query = query.eq('content_type', type);
    if (isFeatured !== undefined) query = query.eq('is_featured', isFeatured);
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    let results = data || [];
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    return results;
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
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        categories:content_categories(category:categories(*)),
        content_files(*)
      `)
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  return all.find((c) => c.slug === slug) || null;
}

/**
 * Increment content view count
 */
export async function trackContentView(contentId) {
  if (isSupabaseConfigured) {
    await supabase.rpc('increment_view_count', { row_id: contentId }).catch(() => {
      // Fallback update if RPC not defined
      supabase.from('content').update({ view_count: supabase.raw('view_count + 1') }).eq('id', contentId);
    });
    return;
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  const updated = all.map((c) => (c.id === contentId ? { ...c, view_count: (c.view_count || 0) + 1 } : c));
  setLocalItem('content', updated);
}

/**
 * Increment download count
 */
export async function trackContentDownload(contentId) {
  if (isSupabaseConfigured) {
    await supabase.from('content').update({ download_count: supabase.raw('download_count + 1') }).eq('id', contentId);
    return;
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  const updated = all.map((c) => (c.id === contentId ? { ...c, download_count: (c.download_count || 0) + 1 } : c));
  setLocalItem('content', updated);
}

/**
 * Fetch submissions for user or admin
 */
export async function getSubmissions({ userId, isAdmin = false } = {}) {
  if (isSupabaseConfigured) {
    let query = supabase.from('submissions').select(`*, submission_files(*)`).order('created_at', { ascending: false });
    if (!isAdmin && userId) {
      query = query.eq('submitter_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  const all = getLocalItem('submissions', INITIAL_SUBMISSIONS);
  if (isAdmin) return all;
  return all.filter((s) => s.submitter_id === userId);
}

/**
 * Create a new student submission
 */
export async function createSubmission(submissionData) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('submissions').insert([submissionData]).select().single();
    if (error) throw error;
    return data;
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
export async function reviewSubmission(submissionId, { status, review_note, reviewer_id, reviewer_name }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status,
        review_note,
        reviewer_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const all = getLocalItem('submissions', INITIAL_SUBMISSIONS);
  const updated = all.map((s) =>
    s.id === submissionId
      ? {
          ...s,
          status,
          review_note,
          reviewer_id,
          reviewed_at: new Date().toISOString(),
        }
      : s
  );
  setLocalItem('submissions', updated);

  // Add audit log
  const auditLogs = getLocalItem('audit_logs', INITIAL_AUDIT_LOGS);
  const newLog = {
    id: `log-${Date.now()}`,
    admin_name: reviewer_name || 'Administrator',
    action: `SUBMISSION_${status.toUpperCase()}`,
    target_type: 'submission',
    target_id: submissionId,
    details: { status, review_note },
    created_at: new Date().toISOString(),
  };
  setLocalItem('audit_logs', [newLog, ...auditLogs]);

  return updated.find((s) => s.id === submissionId);
}

/**
 * Bookmarks management
 */
export async function getUserBookmarks(userId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('content_id, content:content(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data?.map((b) => b.content) || [];
  }

  const savedIds = getLocalItem('bookmarks', []);
  const allContent = getLocalItem('content', INITIAL_CONTENT);
  return allContent.filter((c) => savedIds.includes(c.id));
}

export async function toggleBookmark(userId, contentId) {
  if (isSupabaseConfigured) {
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();

    if (existing) {
      await supabase.from('bookmarks').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('bookmarks').insert([{ user_id: userId, content_id: contentId }]);
      return true;
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
  if (isSupabaseConfigured) {
    if (contentRecord.id) {
      const { data, error } = await supabase
        .from('content')
        .update(contentRecord)
        .eq('id', contentRecord.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('content')
        .insert([contentRecord])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  if (contentRecord.id) {
    const updated = all.map((c) => (c.id === contentRecord.id ? { ...c, ...contentRecord, updated_at: new Date().toISOString() } : c));
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
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('content').delete().eq('id', contentId);
    if (error) throw error;
    return true;
  }

  const all = getLocalItem('content', INITIAL_CONTENT);
  setLocalItem('content', all.filter((c) => c.id !== contentId));
  return true;
}

/**
 * Admin Audit Logs
 */
export async function getAuditLogs() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data;
  }
  return getLocalItem('audit_logs', INITIAL_AUDIT_LOGS);
}

/**
 * Submit user report or correction
 */
export async function submitReport({ content_id, user_id, reason, details }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from('reports').insert([{ content_id, user_id, reason, details }]);
    if (error) throw error;
    return data;
  }
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
