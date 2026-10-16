import React, { createContext, useContext, useEffect, useState } from 'react';

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

      // Verify token with backend
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
              // Ensure user has admin or moderator role
              if (['admin', 'super_admin', 'moderator'].includes(data.user.role)) {
                setUser(data.user);
                setProfile(data.user);
                setIsLoading(false);
                return;
              } else {
                localStorage.removeItem('cshub_token');
                localStorage.removeItem('cshub_current_user_id');
              }
            }
          } else {
            // Token expired or invalid
            localStorage.removeItem('cshub_token');
            localStorage.removeItem('cshub_current_user_id');
          }
        } catch (err) {
          console.warn('Backend admin auth verification error:', err.message);
        }
      }

      if (mounted) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Admin / Staff Login via Email & Password (Strict server verification)
   */
  const adminLogin = async (email, password) => {
    setIsLoading(true);
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!API_BASE_URL) {
      setIsLoading(false);
      throw new Error('API server is not configured.');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
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
  };

  const login = async (email, password) => {
    return adminLogin(email, password);
  };

  const logout = async () => {
    localStorage.removeItem('cshub_token');
    localStorage.removeItem('cshub_current_user_id');
    setUser(null);
    setProfile(null);
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
        logout,
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
    return {
      user: null,
      profile: null,
      isAdmin: false,
      isLoading: false,
      login: async () => {},
      adminLogin: async () => {},
      logout: () => {},
      isConfigured: false,
    };
  }
  return context;
}
