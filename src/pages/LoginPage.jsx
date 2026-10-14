import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, AlertCircle, Sparkles, Send, Shield, KeyRound, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/common/Logo';

export function LoginPage() {
  const { loginWithTelegramCode, adminLogin, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const initialCode = searchParams.get('code') || '';

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'cshub_bot';

  const [activeTab, setActiveTab] = useState('telegram'); // 'telegram' or 'admin'
  const [telegramCode, setTelegramCode] = useState(initialCode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-login if code is provided in URL
  useEffect(() => {
    if (initialCode && initialCode.length === 6) {
      handleTelegramLogin(initialCode);
    }
  }, [initialCode]);

  const handleTelegramLogin = async (codeToUse) => {
    const code = (codeToUse || telegramCode).trim();
    if (!code) {
      setErrorMsg('Please enter the 6-digit code sent by the Telegram Bot.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await loginWithTelegramCode(code);
      navigate(redirectUrl);
    } catch (err) {
      console.error('Telegram login error:', err);
      setErrorMsg(err.message || 'Invalid or expired code. Please request a new /code from the Telegram Bot.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await adminLogin(email, password);
      navigate('/admin');
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Logo size="lg" link={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Welcome to CS Hub
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Student materials, exam cheatsheets, and developer tools
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => { setActiveTab('telegram'); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition ${
              activeTab === 'telegram'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Student (Telegram)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition ${
              activeTab === 'admin'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin / Staff
          </button>
        </div>

        <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'telegram' ? (
            <div className="space-y-5">
              <div className="text-center p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-lg space-y-2">
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Students log in using a 6-digit code generated by our official Telegram Bot.
                </p>
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  <Send className="w-3 h-3" />
                  Open @{botUsername} to get your code
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 849201"
                  value={telegramCode}
                  onChange={(e) => setTelegramCode(e.target.value)}
                  className="w-full text-center tracking-widest text-xl font-mono py-2.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <Button
                type="button"
                onClick={() => handleTelegramLogin()}
                disabled={loading || telegramCode.length < 6}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Verifying Code...' : 'Sign In with Code'}
              </Button>

              <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                Not registered yet?{' '}
                <Link to="/register" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                  Register in Telegram
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Admin Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@cshub.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-2"
              >
                <Shield className="w-4 h-4" />
                {loading ? 'Signing in...' : 'Sign In as Administrator'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default LoginPage;
