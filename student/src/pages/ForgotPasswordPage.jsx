import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/common/Logo';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setErrorMsg('');
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to dispatch password recovery email. Please check your address.');
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
            Reset Your Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your registered student email to receive a secure recovery link.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Check Your Inbox
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                If an account exists for <strong className="text-slate-700 dark:text-slate-200">{email}</strong>,
                we have dispatched a password reset link.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" size="sm" icon={ArrowLeft}>
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Input
                label="Registered Email Address"
                type="email"
                required
                autoFocus
                placeholder="student@example.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                icon={KeyRound}
                className="w-full mt-2"
              >
                Send Recovery Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
