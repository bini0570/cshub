import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_USERS } from '../data/mockData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
        } finally {
          if (mounted) setIsLoading(false);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
          }
          setIsLoading(false);
        });

        return () => subscription.unsubscribe();
      } else {
        // Fallback / Demonstration Mode: Check localStorage for simulated active user
        const savedMockUserId = localStorage.getItem('cshub_current_user_id');
        const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
        const found = users.find((u) => u.id === (savedMockUserId || 'user-admin-1')) || users[0];
        
        if (found && mounted) {
          setUser({ id: found.id, email: found.email });
          setProfile(found);
        }
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  async function fetchProfile(userId) {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  }

  // Login handler
  const login = async (email, password) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsLoading(false);
        throw error;
      }
      setUser(data.user);
      await fetchProfile(data.user.id);
      setIsLoading(false);
      return data.user;
    }

    // Mock Login
    const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setUser({ id: matched.id, email: matched.email });
      setProfile(matched);
      localStorage.setItem('cshub_current_user_id', matched.id);
      setIsLoading(false);
      return matched;
    }
    // New mock student if unknown
    const newMockUser = {
      id: `user-${Date.now()}`,
      email,
      display_name: email.split('@')[0],
      role: 'student',
      status: 'active',
      avatar_url: '',
      created_at: new Date().toISOString(),
    };
    const updatedUsers = [...users, newMockUser];
    localStorage.setItem('cshub_users', JSON.stringify(updatedUsers));
    localStorage.setItem('cshub_current_user_id', newMockUser.id);
    setUser({ id: newMockUser.id, email: newMockUser.email });
    setProfile(newMockUser);
    setIsLoading(false);
    return newMockUser;
  };

  // Register handler
  const register = async (email, password, displayName) => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });
      if (error) {
        setIsLoading(false);
        throw error;
      }
      setIsLoading(false);
      return data.user;
    }

    // Mock Register
    const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      display_name: displayName || email.split('@')[0],
      role: 'student',
      status: 'active',
      avatar_url: '',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('cshub_users', JSON.stringify([...users, newUser]));
    localStorage.setItem('cshub_current_user_id', newUser.id);
    setUser({ id: newUser.id, email: newUser.email });
    setProfile(newUser);
    setIsLoading(false);
    return newUser;
  };

  // Logout handler
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('cshub_current_user_id');
    setUser(null);
    setProfile(null);
  };

  // Password reset request
  const resetPassword = async (email) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return true;
    }
    // Mock simulation
    return true;
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (isSupabaseConfigured && supabase && user) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    }

    if (profile) {
      const updated = { ...profile, ...updates };
      setProfile(updated);
      const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
      const newUsers = users.map((u) => (u.id === profile.id ? updated : u));
      localStorage.setItem('cshub_users', JSON.stringify(newUsers));
      return updated;
    }
  };

  // Developer quick-switch for previewing roles (Admin vs Student)
  const switchMockUser = (userId) => {
    const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
    const target = users.find((u) => u.id === userId);
    if (target) {
      localStorage.setItem('cshub_current_user_id', target.id);
      setUser({ id: target.id, email: target.email });
      setProfile(target);
    }
  };

  const isAdmin = Boolean(profile && (profile.role === 'admin' || profile.role === 'super_admin'));

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        switchMockUser,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
