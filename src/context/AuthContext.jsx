import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_USERS } from '../data/mockData';

const AuthContext = createContext();
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const token = localStorage.getItem('cshub_token');

      // 1. If we have a JWT token and Railway API is configured, verify session
      if (token && API_BASE_URL) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (mounted && data.user) {
              setUser(data.user);
              setProfile(data.user);
              setIsLoading(false);
              return;
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem('cshub_token');
          }
        } catch (err) {
          console.warn('Could not connect to Railway auth API, checking local session:', err.message);
        }
      }

      // 2. Local fallback session
      const savedMockUserId = localStorage.getItem('cshub_current_user_id');
      const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
      const found = users.find((u) => u.id === (savedMockUserId || 'user-admin-1')) || users[0];

      if (found && mounted) {
        setUser({ id: found.id, email: found.email, full_name: found.full_name || found.display_name });
        setProfile(found);
      }
      if (mounted) setIsLoading(false);
    }

    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Log in with a 6-digit Telegram Verification Code
   */
  const loginWithTelegramCode = async (code) => {
    setIsLoading(true);
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/telegram-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Verification code invalid or expired');
        }

        localStorage.setItem('cshub_token', data.token);
        localStorage.setItem('cshub_current_user_id', data.user.id);
        setUser(data.user);
        setProfile(data.user);
        setIsLoading(false);
        return data.user;
      } catch (err) {
        setIsLoading(false);
        throw err;
      }
    }

    // Local simulated verification code fallback
    const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
    const student = users.find((u) => u.role === 'student') || users[0];
    setUser({ id: student.id, email: student.email });
    setProfile(student);
    localStorage.setItem('cshub_current_user_id', student.id);
    setIsLoading(false);
    return student;
  };

  /**
   * Admin / Staff Login via Email & Password
   */
  const adminLogin = async (email, password) => {
    setIsLoading(true);
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Admin credentials incorrect');
        }

        localStorage.setItem('cshub_token', data.token);
        localStorage.setItem('cshub_current_user_id', data.user.id);
        setUser(data.user);
        setProfile(data.user);
        setIsLoading(false);
        return data.user;
      } catch (err) {
        setIsLoading(false);
        throw err;
      }
    }

    // Local fallback for admin login
    const users = JSON.parse(localStorage.getItem('cshub_users') || JSON.stringify(INITIAL_USERS));
    const adminUser = users.find((u) => u.role === 'admin' || u.role === 'super_admin') || users[0];
    setUser({ id: adminUser.id, email: adminUser.email });
    setProfile(adminUser);
    localStorage.setItem('cshub_current_user_id', adminUser.id);
    setIsLoading(false);
    return adminUser;
  };

  // General login wrapper
  const login = async (email, password) => {
    return adminLogin(email, password);
  };

  // Register handler
  const register = async (email, password, displayName) => {
    setIsLoading(true);
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
    localStorage.removeItem('cshub_token');
    localStorage.removeItem('cshub_current_user_id');
    setUser(null);
    setProfile(null);
  };

  // Password reset request
  const resetPassword = async (email) => {
    return true;
  };

  // Update profile
  const updateProfile = async (updates) => {
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

  const isAdmin = Boolean(profile && (profile.role === 'admin' || profile.role === 'super_admin' || profile.role === 'moderator'));

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isLoading,
        login,
        adminLogin,
        loginWithTelegramCode,
        register,
        logout,
        resetPassword,
        updateProfile,
        switchMockUser,
        isConfigured: Boolean(API_BASE_URL),
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
