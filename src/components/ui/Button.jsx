import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-teal-600 hover:bg-teal-500 text-white shadow-sm focus:ring-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 dark:text-navy-950 font-semibold',
    secondary:
      'bg-navy-900 hover:bg-navy-800 text-white dark:bg-navy-800 dark:hover:bg-navy-700 dark:text-slate-100 focus:ring-navy-600',
    outline:
      'border border-slate-300 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 focus:ring-slate-400',
    ghost:
      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 focus:ring-slate-400',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500 shadow-sm',
    accent:
      'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-900/50',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2 min-h-[42px] gap-2',
    lg: 'text-base px-5 py-2.5 min-h-[48px] gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
