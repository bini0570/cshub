import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="mt-3 text-xs text-slate-500">Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="mt-3 text-xs text-slate-500">Verifying administrator clearance...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Administrator Privileges Required
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 mb-6">
          Access to this management endpoint is strictly restricted to verified platform administrators.
          Your current account does not have sufficient security credentials.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Return to Platform Homepage
        </Button>
      </div>
    );
  }

  return children;
}
