import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramUnregistered, setTelegramUnregistered] = useState(false);

  // Initialize auth session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // 0. Telegram Mini App Native Profile Detection
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
      if (tg) {
        try {
          tg.ready();
          tg.expand();
        } catch (e) {}

        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          // Immediately show real Telegram student profile
          const immediateProfile = {
            id: `student-${tgUser.id}`,
            telegram_id: tgUser.id,
            telegram_username: tgUser.username || null,
            full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username || 'Student',
            role: 'student',
            status: 'active',
            photo_url: tgUser.photo_url || null,
          };
          if (mounted) {
            setUser(immediateProfile);
            setProfile(immediateProfile);
          }
        }

        // Authenticate with backend database if initData is present
        if (tg.initData && API_BASE_URL) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/auth/telegram-webapp-auth`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData: tg.initData }),
            });
            const data = await res.json();
            if (res.ok && data.user) {
              localStorage.setItem('cshub_token', data.token);
              localStorage.setItem('cshub_current_user_id', data.user.id);
              if (mounted) {
                setUser(data.user);
                setProfile(data.user);
                setIsLoading(false);
                return;
              }
            } else if (data.registered === false || res.status === 403) {
              if (mounted) {
                setTelegramUnregistered(true);
                setIsLoading(false);
                return;
              }
            }
          } catch (tgErr) {
            console.warn('Telegram WebApp backend auth attempt error:', tgErr.message);
          }
        }

        if (tgUser && mounted) {
          setIsLoading(false);
          return;
        }
      }

      // 1. Web session validation via JWT token
      const token = localStorage.getItem('cshub_token');
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
            // Token expired or revoked
            localStorage.removeItem('cshub_token');
            localStorage.removeItem('cshub_current_user_id');
          }
        } catch (err) {
          console.warn('Backend auth verification error:', err.message);
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
   * Log in with a 6-digit Telegram Verification Code
   */
  const loginWithTelegramCode = async (code) => {
    setIsLoading(true);
    if (!API_BASE_URL) {
      setIsLoading(false);
      throw new Error('API server is not configured.');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/telegram-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: String(code).trim() }),
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
  };

  /**
   * Admin / Staff Login via Email & Password
   */
  const adminLogin = async (email, password) => {
    setIsLoading(true);
    if (!API_BASE_URL) {
      setIsLoading(false);
      throw new Error('API server is not configured.');
    }

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
        loginWithTelegramCode,
        logout,
        isConfigured: Boolean(API_BASE_URL),
        telegramUnregistered,
        isTelegramWebApp: typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData),
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
      loginWithTelegramCode: async () => {},
      logout: () => {},
      isConfigured: false,
      telegramUnregistered: false,
      isTelegramWebApp: typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData),
    };
  }
  return context;
}
