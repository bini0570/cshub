import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  User,
  LogOut,
  Bookmark,
  Send,
  Shield,
  FileText,
  Sliders,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../common/Logo';
import { Button } from '../ui/Button';

export function Navbar({ onOpenSearch }) {
  const { user, profile, isAdmin, logout, switchMockUser, isConfigured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Resources', href: '/resources' },
    { label: 'Articles', href: '/articles' },
    { label: 'Tools', href: '/tools' },
    { label: 'Opportunities', href: '/opportunities' },
    { label: 'About', href: '/about' },
  ];

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-navy-800 bg-white/90 dark:bg-navy-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Portal Switcher */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <Logo size="md" />

            {/* Direct Portal Toggle */}
            <div className="hidden lg:flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-xs font-semibold">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded-md transition-all ${
                    isActive
                      ? 'bg-white dark:bg-navy-800 text-teal-600 dark:text-teal-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`
                }
              >
                🎓 Student Hub
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-2.5 py-1 rounded-md transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`
                }
              >
                🛡️ Admin
              </NavLink>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-950/40 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions (Search, Theme, Auth, Submit) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-900 hover:bg-slate-200 dark:hover:bg-navy-800 border border-slate-200 dark:border-navy-700/80 text-xs transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-700 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Submit Material Button */}
            <Link to="/submit" className="hidden sm:inline-flex">
              <Button variant="accent" size="sm" icon={Send}>
                Submit
              </Button>
            </Link>

            {/* User Dropdown / Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors focus:outline-none"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase">
                    {profile?.display_name ? profile.display_name.charAt(0) : 'U'}
                  </div>
                  <span className="hidden xl:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {profile?.display_name || user.email}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {profile?.display_name || 'Student Member'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {profile?.role || 'Student'}
                      </span>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-navy-800"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile & Info</span>
                      </Link>
                      <Link
                        to="/bookmarks"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>My Bookmarks</span>
                      </Link>
                      <Link
                        to="/my-submissions"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                      >
                        <FileText className="w-4 h-4" />
                        <span>My Submissions</span>
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-800"
                      >
                        <Sliders className="w-4 h-4" />
                        <span>Account Settings</span>
                      </Link>
                    </div>

                    {/* Developer Mock Role Switcher (Visible when using local preview mode) */}
                    {!isConfigured && (
                      <div className="px-4 py-2 border-t border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40">
                        <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                          Preview Role Switcher
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => switchMockUser('user-admin-1')}
                            className={`px-2 py-0.5 text-[10px] rounded border ${
                              isAdmin
                                ? 'bg-teal-600 text-white font-bold border-teal-600'
                                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700'
                            }`}
                          >
                            Admin
                          </button>
                          <button
                            type="button"
                            onClick={() => switchMockUser('user-student-1')}
                            className={`px-2 py-0.5 text-[10px] rounded border ${
                              !isAdmin
                                ? 'bg-teal-600 text-white font-bold border-teal-600'
                                : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700'
                            }`}
                          >
                            Student
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-navy-800 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:inline-flex">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex flex-col gap-2">
            <Link to="/submit" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full" icon={Send}>
                Submit Materials
              </Button>
            </Link>

            {!user && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="md" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
