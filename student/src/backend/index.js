/**
 * CS Hub Backend Services & Data Layer
 * Provides unified API methods for the Student Frontend and Admin Management Portal.
 * Operates with rich in-memory / local storage persistence and optional Supabase backend.
 */

import {
  INITIAL_CATEGORIES,
  INITIAL_CONTENT,
  INITIAL_SUBMISSIONS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  MOCK_QUIZ_QUESTIONS,
} from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Local storage key helpers
function getStore(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`cshub_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStore(key, value) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`cshub_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to persist cshub_${key}`, err);
  }
}

// Ensure database tables are seeded in local storage
if (typeof window !== 'undefined' && !localStorage.getItem('cshub_seeded')) {
  setStore('categories', INITIAL_CATEGORIES);
  setStore('content', INITIAL_CONTENT);
  setStore('submissions', INITIAL_SUBMISSIONS);
  setStore('users', INITIAL_USERS);
  setStore('notifications', INITIAL_NOTIFICATIONS);
  setStore('audit_logs', INITIAL_AUDIT_LOGS);
  setStore('bookmarks', ['content-2']);
  setStore('quiz_questions', MOCK_QUIZ_QUESTIONS);
  localStorage.setItem('cshub_seeded', 'true');
}

export const BackendService = {
  // --- Content & Resource Operations ---
  async getCategories() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (!error && data) return data;
    }
    return getStore('categories', INITIAL_CATEGORIES);
  },

  async getContentList({ type, categorySlug, search, isFeatured, limit } = {}) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('content')
        .select(`*, categories:content_categories(category:categories(*)), content_files(*)`)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('published_at', { ascending: false });

      if (type) query = query.eq('content_type', type);
      if (isFeatured !== undefined) query = query.eq('is_featured', isFeatured);
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (!error && data) {
        let results = data;
        if (search) {
          const q = search.toLowerCase();
          results = results.filter(
            (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
          );
        }
        return results;
      }
    }

    let items = getStore('content', INITIAL_CONTENT).filter(
      (c) => c.status === 'published' && c.visibility === 'public'
    );

    if (type) items = items.filter((c) => c.content_type === type);
    if (isFeatured !== undefined) items = items.filter((c) => Boolean(c.is_featured) === Boolean(isFeatured));
    if (categorySlug) {
      const cats = getStore('categories', INITIAL_CATEGORIES);
      const cat = cats.find((k) => k.slug === categorySlug);
      if (cat) items = items.filter((c) => c.category_id === cat.id);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    if (limit) items = items.slice(0, limit);
    return items;
  },

  async getContentBySlug(slug) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('content')
        .select(`*, categories:content_categories(category:categories(*)), content_files(*)`)
        .eq('slug', slug)
        .single();
      if (!error && data) return data;
    }
    const all = getStore('content', INITIAL_CONTENT);
    return all.find((c) => c.slug === slug) || null;
  },

  async saveContent(contentRecord) {
    if (isSupabaseConfigured && supabase) {
      if (contentRecord.id) {
        const { data, error } = await supabase
          .from('content')
          .update(contentRecord)
          .eq('id', contentRecord.id)
          .select()
          .single();
        if (!error && data) return data;
      } else {
        const { data, error } = await supabase
          .from('content')
          .insert([contentRecord])
          .select()
          .single();
        if (!error && data) return data;
      }
    }

    const all = getStore('content', INITIAL_CONTENT);
    if (contentRecord.id) {
      const updated = all.map((c) =>
        c.id === contentRecord.id ? { ...c, ...contentRecord, updated_at: new Date().toISOString() } : c
      );
      setStore('content', updated);
      return contentRecord;
    } else {
      const newEntry = {
        ...contentRecord,
        id: `content-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        view_count: 0,
        download_count: 0,
      };
      setStore('content', [newEntry, ...all]);
      return newEntry;
    }
  },

  async deleteContent(id) {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('content').delete().eq('id', id);
    }
    const all = getStore('content', INITIAL_CONTENT);
    setStore('content', all.filter((c) => c.id !== id));
    return true;
  },

  // --- Student Submissions & Moderation ---
  async getSubmissions({ userId, isAdmin = false } = {}) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('submissions').select(`*, submission_files(*)`).order('created_at', { ascending: false });
      if (!isAdmin && userId) {
        query = query.eq('submitter_id', userId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    }

    const all = getStore('submissions', INITIAL_SUBMISSIONS);
    if (isAdmin) return all;
    return all.filter((s) => s.submitter_id === userId);
  },

  async createSubmission(payload) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('submissions').insert([payload]).select().single();
      if (!error && data) return data;
    }

    const all = getStore('submissions', INITIAL_SUBMISSIONS);
    const newSub = {
      id: `sub-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      ...payload,
    };
    setStore('submissions', [newSub, ...all]);
    return newSub;
  },

  async reviewSubmission(id, { status, review_note, reviewer_id, reviewer_name }) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status,
          review_note,
          reviewer_id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }

    const all = getStore('submissions', INITIAL_SUBMISSIONS);
    const updated = all.map((s) =>
      s.id === id ? { ...s, status, review_note, reviewer_id, reviewed_at: new Date().toISOString() } : s
    );
    setStore('submissions', updated);

    // Record audit log
    const logs = getStore('audit_logs', INITIAL_AUDIT_LOGS);
    const newLog = {
      id: `log-${Date.now()}`,
      admin_name: reviewer_name || 'Administrator',
      action: `SUBMISSION_${status.toUpperCase()}`,
      target_type: 'submission',
      target_id: id,
      details: { status, review_note },
      created_at: new Date().toISOString(),
    };
    setStore('audit_logs', [newLog, ...logs]);

    return updated.find((s) => s.id === id);
  },

  // --- Users & Audit Logs ---
  async getUsers() {
    return getStore('users', INITIAL_USERS);
  },

  async updateUserRole(userId, newRole) {
    const users = getStore('users', INITIAL_USERS);
    const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
    setStore('users', updated);
    return updated.find((u) => u.id === userId);
  },

  async getAuditLogs() {
    return getStore('audit_logs', INITIAL_AUDIT_LOGS);
  },

  // --- Quiz & Study Tools ---
  async getQuizQuestions() {
    return getStore('quiz_questions', MOCK_QUIZ_QUESTIONS);
  },
};

export default BackendService;
