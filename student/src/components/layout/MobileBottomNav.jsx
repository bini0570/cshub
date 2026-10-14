import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Search, Bookmark, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function MobileBottomNav({ onOpenSearch }) {
  const { user } = useAuth();

  const navItems = [
    { label: 'Home', icon: Home, to: '/' },
    { label: 'Resources', icon: Compass, to: '/resources' },
    { label: 'Search', icon: Search, isAction: true, onClick: onOpenSearch },
    { label: 'Saved', icon: Bookmark, to: '/bookmarks' },
    { label: 'Account', icon: User, to: user ? '/profile' : '/login' },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-t border-slate-200 dark:border-navy-800 pb-safe">
      <div className="grid grid-cols-5 h-14">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          if (item.isAction) {
            return (
              <button
                key={idx}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={idx}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center transition-colors ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
