import React from 'react';
import { ContentCard } from './ContentCard';
import { ContentCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function ContentGrid({
  items = [],
  loading = false,
  emptyTitle,
  emptyDescription,
  onResetFilters,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ContentCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || 'No items found'}
        description={emptyDescription || 'There are no published materials matching your current filters.'}
        actionLabel={onResetFilters ? 'Clear Filters' : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} />
      ))}
    </div>
  );
}
