import React from 'react';

export function CategoryFilter({
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  className = '',
}) {
  return (
    <div className={`overflow-x-auto pb-2 scrollbar-none flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => onSelectCategory('')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors select-none ${
          !selectedCategory
            ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-navy-950 shadow-xs'
            : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
        }`}
      >
        All Categories
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.slug;
        return (
          <button
            key={cat.id || cat.slug}
            type="button"
            onClick={() => onSelectCategory(cat.slug)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors select-none ${
              isSelected
                ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-navy-950 shadow-xs'
                : 'bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
