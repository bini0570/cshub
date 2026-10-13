import React from 'react';
import { Link } from 'react-router-dom';

export function Logo({ size = 'md', link = true, showSubtitle = true }) {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const content = (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Geometric Emblem */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 dark:from-navy-800 dark:to-navy-900 border border-teal-500/30 flex items-center justify-center shadow-sm text-teal-400 font-mono font-bold tracking-tighter group-hover:border-teal-400 transition-colors`}
      >
        <span className="text-teal-400">&lt;</span>
        <span className="text-white text-xs">/</span>
        <span className="text-teal-300">&gt;</span>
      </div>

      {/* Brand Wordmark */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight text-slate-900 dark:text-white ${textSizes[size]}`}>
            CS<span className="text-teal-600 dark:text-teal-400">HUB</span>
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-300 rounded border border-teal-500/20">
            Platform
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
            Student Tech Knowledge
          </span>
        )}
      </div>
    </div>
  );

  if (!link) return content;

  return (
    <Link to="/" className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg">
      {content}
    </Link>
  );
}
