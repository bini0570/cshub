import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, Search } from 'lucide-react';
import { getPublishedContent, getCategories } from '../lib/supabase';
import { ContentGrid } from '../features/content/ContentGrid';
import { CategoryFilter } from '../features/content/CategoryFilter';
import { Pagination } from '../components/common/Pagination';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

export function OpportunitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
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
    async function fetchOpps() {
      try {
        setLoading(true);
        const data = await getPublishedContent({
          type: 'opportunity',
          categorySlug: selectedCategory || undefined,
          search: searchQuery || undefined,
        });
        setOpportunities(data || []);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOpps();

    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params, { replace: true });
  }, [selectedCategory, searchQuery, setSearchParams]);

  const paginatedItems = opportunities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Opportunities & Internships' }]} />

      <div className="border-b border-slate-200 dark:border-navy-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Student Opportunities
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Tech internships, open-source stipends (GSoC), research fellowships, hackathons, and student grants.
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
              placeholder="Search internships, hackathons, or fellowships..."
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
        emptyTitle="No opportunities found"
        emptyDescription="No active student opportunities matched your search. Check back soon for fresh openings."
        onResetFilters={() => {
          setSelectedCategory('');
          setSearchQuery('');
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalItems={opportunities.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
