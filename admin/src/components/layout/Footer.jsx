import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, MessageSquare, ShieldCheck, Mail, Heart } from 'lucide-react';
import { Logo } from '../common/Logo';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 text-slate-600 dark:text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              An independent content platform built for Computer Science students, software
              engineers, and tech learners. Sharing open notes, study cheatsheets, and career opportunities.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-0.5">
                Independent Platform Notice
              </span>
              CS Hub is not an official university website, LMS, or course registration portal. We
              do not host grades or academic enrollments.
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4">
              Explore Content
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/resources" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Resource Library
                </Link>
              </li>
              <li>
                <Link to="/articles" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Articles & Guides
                </Link>
              </li>
              <li>
                <Link to="/tools" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Developer Tools
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Jobs & Internships
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Global Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Hub */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4">
              Community & Hub
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/submit" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Submit Materials
                </Link>
              </li>
              <li>
                <Link to="/my-submissions" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Submission Queue
                </Link>
              </li>
              <li>
                <Link to="/bookmarks" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Saved Bookmarks
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  About CS Hub
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  Contact & Corrections
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4">
              Community Connect
            </h4>
            <div className="flex items-center space-x-3 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-100 dark:bg-navy-900 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="GitHub Repository"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-100 dark:bg-navy-900 hover:text-teal-500 transition-colors"
                aria-label="Twitter Community"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <Link
                to="/contact"
                className="p-2 rounded-lg bg-slate-100 dark:bg-navy-900 hover:text-teal-500 transition-colors"
                aria-label="Contact Email"
              >
                <Mail className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-normal">
              Empowering students through peer knowledge, open source, and accessible engineering.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 dark:border-navy-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CS Hub — Built for Computer Science Learners.</p>
          <div className="flex items-center space-x-6">
            <Link to="/about" className="hover:underline">
              Terms & Privacy
            </Link>
            <Link to="/contact" className="hover:underline">
              Report an Issue
            </Link>
            <span className="flex items-center gap-1 text-slate-400">
              Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for students
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
