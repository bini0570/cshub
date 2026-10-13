import React, { useState, useEffect } from 'react';
import { Bookmark, Search, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserBookmarks } from '../lib/supabase';
import { ContentGrid } from '../features/content/ContentGrid';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserBookmarks(user.id);
      setBookmarks(data || []);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [user]);

  const filtered = selectedType
    ? bookmarks.filter((b) => b.content_type === selectedType)
    : bookmarks;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Saved Bookmarks' }]} />

      <div className="border-b border-slate-200 dark:border-navy-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Bookmark className="w-5 h-5 fill-teal-600 dark:fill-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              My Saved Bookmarks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Personal library of articles, cheatsheets, and developer tools you have saved.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['', 'resource', 'article', 'tool', 'opportunity'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                selectedType === type
                  ? 'bg-navy-900 dark:bg-navy-800 text-white dark:text-teal-300'
                  : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-800 hover:bg-slate-100 dark:hover:bg-navy-800'
              }`}
            >
              {type || 'All'}
            </button>
          ))}
        </div>
      </div>

      <ContentGrid
        items={filtered}
        loading={loading}
        emptyTitle="No bookmarks saved yet"
        emptyDescription="When browsing guides, tutorials, or tools, click the bookmark icon to save them here for quick access."
        onResetFilters={selectedType ? () => setSelectedType('') : undefined}
      />
    </div>
  );
}
