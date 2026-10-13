import React from 'react';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 rounded-xl shadow-sm overflow-hidden ${
        hover
          ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-navy-700 transition-all duration-200'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`p-5 border-b border-slate-100 dark:border-navy-800/80 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-4 bg-slate-50/60 dark:bg-navy-950/40 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
