import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toggleBookmark } from '../../lib/supabase';

export function BookmarkButton({ contentId, className = '', onToggle }) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check initial state from local storage or context
    const bookmarks = JSON.parse(localStorage.getItem('cshub_bookmarks') || '[]');
    setIsBookmarked(bookmarks.includes(contentId));
  }, [contentId]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      setIsUpdating(true);
      const newState = await toggleBookmark(user.id, contentId);
      setIsBookmarked(newState);
      if (onToggle) onToggle(newState);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isUpdating}
      className={`p-2 rounded-lg transition-colors border select-none ${
        isBookmarked
          ? 'bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/60 dark:border-teal-800 dark:text-teal-400'
          : 'bg-white/80 dark:bg-navy-900/80 border-slate-200 dark:border-navy-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
      } ${className}`}
      title={isBookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
    >
      <Bookmark
        className={`w-4 h-4 transition-transform active:scale-125 ${
          isBookmarked ? 'fill-teal-600 dark:fill-teal-400' : ''
        }`}
      />
    </button>
  );
}
