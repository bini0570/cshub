import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  Files,
  Users,
  History,
  Settings,
  ExternalLink,
  Shield,
  LogOut,
  FolderTree,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

export function AdminLayout() {
  const { profile, logout } = useAuth();

  const navItems = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Moderation Queue', to: '/admin/moderation', icon: FileCheck2 },
    { label: 'Content Manager', to: '/admin/content', icon: Files },
    { label: 'User Directory', to: '/admin/users', icon: Users },
    { label: 'Audit Logs', to: '/admin/audit', icon: History },
    { label: 'System Settings', to: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-navy-900 text-white shrink-0 border-r border-navy-800 flex flex-col">
        {/* Brand / Title */}
        <div className="p-5 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">
                CS<span className="text-teal-400">HUB</span> Admin
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Control Console
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-teal-500 text-navy-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Admin User info & Exit */}
        <div className="p-4 border-t border-navy-800 space-y-3 bg-navy-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
              {profile?.display_name ? profile.display_name.charAt(0) : 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                {profile?.display_name || 'Admin'}
              </p>
              <span className="text-[10px] text-teal-400 font-mono uppercase">
                {profile?.role || 'super_admin'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-navy-800/80 flex items-center justify-between text-xs">
            <Link
              to="/"
              className="text-slate-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
