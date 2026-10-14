import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, Download, Wrench, Briefcase, Bell, ArrowRight } from 'lucide-react';
import { getPublishedContent } from '../../lib/supabase';
import { Badge } from '../../components/ui/Badge';

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const items = await getPublishedContent({ search: query });
          setResults(items.slice(0, 8));
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true); // open trigger
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'article':
        return FileText;
      case 'resource':
        return Download;
      case 'tool':
        return Wrench;
      case 'opportunity':
        return Briefcase;
      default:
        return Bell;
    }
  };

  const getTypeRoute = (type, slug) => {
    switch (type) {
      case 'article':
        return `/articles/${slug}`;
      case 'resource':
        return `/resources/${slug}`;
      case 'tool':
        return `/tools/${slug}`;
      case 'opportunity':
        return `/opportunities/${slug}`;
      default:
        return `/articles/${slug}`;
    }
  };

  const handleSelect = (item) => {
    navigate(getTypeRoute(item.content_type, item.slug));
    onClose();
  };

  const handleFullSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:p-6 sm:pt-24">
        <div
          className="relative w-full max-w-2xl transform rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-2xl transition-all overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <form onSubmit={handleFullSearch} className="flex items-center px-4 border-b border-slate-200 dark:border-navy-800">
            <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tutorials, interview guides, tools, cheat sheets..."
              className="w-full bg-transparent py-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-navy-800 rounded border border-slate-200 dark:border-navy-700">
              ESC
            </kbd>
          </form>

          {/* Results list */}
          <div className="max-h-96 overflow-y-auto p-2">
            {loading && (
              <div className="p-8 text-center text-xs text-slate-500">
                Searching CS Hub database...
              </div>
            )}

            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No matching content found for &quot;<span className="font-semibold text-slate-700 dark:text-slate-300">{query}</span>&quot;.
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-1">
                {results.map((item) => {
                  const Icon = getTypeIcon(item.content_type);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full text-left p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-800/80 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-start gap-3 min-w-0 pr-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="teal" size="sm" className="capitalize">
                          {item.content_type}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && query.trim().length < 2 && (
              <div className="p-6 text-center text-xs text-slate-400">
                Type at least 2 characters to search across articles, cheat sheets, tools, and internships.
              </div>
            )}
          </div>

          {/* Footer */}
          {results.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-navy-950/60 border-t border-slate-200 dark:border-navy-800 flex justify-between items-center text-xs text-slate-500">
              <span>Press enter to view all search results</span>
              <button
                type="button"
                onClick={handleFullSearch}
                className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                View all results →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
