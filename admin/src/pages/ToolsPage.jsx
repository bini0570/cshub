import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wrench, Search } from 'lucide-react';
import { getPublishedContent, getCategories } from '../lib/supabase';
import { ContentGrid } from '../features/content/ContentGrid';
import { CategoryFilter } from '../features/content/CategoryFilter';
import { Pagination } from '../components/common/Pagination';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    async function init() {
      try {
        const cats = await getCategories();
        setCategories(cats || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchTools() {
      try {
        setLoading(true);
        const data = await getPublishedContent({
          type: 'tool',
          categorySlug: selectedCategory || undefined,
          search: searchQuery || undefined,
        });
        setTools(data || []);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to load tools:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTools();

    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params, { replace: true });
  }, [selectedCategory, searchQuery, setSearchParams]);

  const paginatedItems = tools.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Developer Tools' }]} />

      <div className="border-b border-slate-200 dark:border-navy-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Developer Tools Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Curated software utilities, AI developer assistants, whiteboard tools, and productivity instruments.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools by name, utility, or tech..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </div>

      <ContentGrid
        items={paginatedItems}
        loading={loading}
        emptyTitle="No tools found"
        emptyDescription="No developer tools matched your search. Check back soon or submit a tool you love."
        onResetFilters={() => {
          setSelectedCategory('');
          setSearchQuery('');
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalItems={tools.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
