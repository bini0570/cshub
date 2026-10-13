import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/common/Logo';

export function LoginPage() {
  const { login, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(email, password);
      navigate(redirectUrl);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (role === 'admin') {
        await login('admin@cshub.dev', 'admin-password');
      } else {
        await login('jordan@student.university.edu', 'student-password');
      }
      navigate(redirectUrl);
    } catch (err) {
      console.error(err);
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
            Sign in to CS Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your saved bookmarks, submission queue, and community profile.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              required
              autoFocus
              placeholder="student@example.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950/60 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              icon={LogIn}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins for immediate testing */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-navy-800 space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block text-center">
              Quick Role Exploration
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 transition-colors text-center"
              >
                Log in as Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 transition-colors text-center"
              >
                Log in as Student
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              Register as student
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
