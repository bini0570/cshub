import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center font-mono font-black text-2xl shadow-sm">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        The page you are looking for does not exist or has been moved to another location.
      </p>
      <div className="pt-2">
        <Link to="/">
          <Button variant="primary" size="md" icon={Home}>
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
