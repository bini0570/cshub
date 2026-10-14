/**
 * CS Hub — Backend Auth & Permissions Service
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_USERS } from '../data/mockData';

export const AuthService = {
  isConfigured: isSupabaseConfigured,

  async getSession() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) return data.session;
    }
    const savedUserId = localStorage.getItem('cshub_current_user_id') || 'user-admin-1';
    const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
    const user = users.find((u) => u.id === savedUserId) || users[0];
    return { user: { id: user.id, email: user.email }, profile: user };
  },

  checkIsAdmin(profile) {
    return Boolean(profile && (profile.role === 'admin' || profile.role === 'super_admin'));
  },
};

export default AuthService;
