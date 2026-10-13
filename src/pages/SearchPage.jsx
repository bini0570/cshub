import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Sparkles } from 'lucide-react';
import { getPublishedContent, getCategories } from '../lib/supabase';
import { ContentGrid } from '../features/content/ContentGrid';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Pagination } from '../components/common/Pagination';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || '';
  const categoryParam = searchParams.get('category') || '';
  const featuredParam = searchParams.get('featured') === 'true';

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadCats();
  }, []);

  useEffect(() => {
    async function performSearch() {
      try {
        setLoading(true);
        const data = await getPublishedContent({
          search: searchQuery || undefined,
          type: selectedType || undefined,
          categorySlug: selectedCategory || undefined,
          isFeatured: featuredParam ? true : undefined,
        });
        setResults(data || []);
        setCurrentPage(1);
      } catch (err) {
        console.error('Search query error:', err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();

    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedType) params.set('type', selectedType);
    if (selectedCategory) params.set('category', selectedCategory);
    if (featuredParam) params.set('featured', 'true');
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedType, selectedCategory, featuredParam, setSearchParams]);

  const paginatedResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const contentTypes = [
    { label: 'All Formats', value: '' },
    { label: 'Articles', value: 'article' },
    { label: 'Resources', value: 'resource' },
    { label: 'Tools', value: 'tool' },
    { label: 'Opportunities', value: 'opportunity' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Search' }]} />

      <div className="border-b border-slate-200 dark:border-navy-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          Search CS Hub Knowledge
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          Query all published notes, tutorials, cheat sheets, tools, and scholarships across all topics.
        </p>

        {/* Search Input Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, algorithms, courses, or tool names..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Content Type Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {contentTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedType === t.value
                    ? 'bg-navy-900 dark:bg-navy-800 text-white dark:text-teal-300 shadow-xs'
                    : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-800 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="ml-auto w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Meta */}
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Found <span className="font-bold text-slate-900 dark:text-slate-200">{results.length}</span> results
        {searchQuery ? ` for "${searchQuery}"` : ''}
      </div>

      {/* Grid */}
      <ContentGrid
        items={paginatedResults}
        loading={loading}
        emptyTitle="No results found"
        emptyDescription="We could not find anything matching your exact query and filters. Try broader terms or clearing category filters."
        onResetFilters={() => {
          setSearchQuery('');
          setSelectedType('');
          setSelectedCategory('');
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalItems={results.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
