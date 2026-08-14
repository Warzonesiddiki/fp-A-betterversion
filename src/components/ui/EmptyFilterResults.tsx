import { memo } from 'react';
import { cn } from '@/utils/cn';
import { FilterX } from 'lucide-react';

export interface EmptyFilterResultsProps {
  activeFilterCount?: number;
  title?: string;
  description?: string;
  onClearFilters?: () => void;
  clearLabel?: string;
  className?: string;
}

/**
 * Empty filter results — shown when active filters produce no matches.
 * Uses role="region" with aria-label for landmark semantics.
 *
 * @example
 * {filteredItems.length === 0 && filtersActive && (
 *   <EmptyFilterResults
 *     activeFilterCount={activeFilterCount}
 *     onClearFilters={clearFilters}
 *   />
 * )}
 */
export const EmptyFilterResults = memo(function EmptyFilterResults({
  activeFilterCount,
  title = 'No matching results',
  description,
  onClearFilters,
  clearLabel = 'Clear all filters',
  className,
}: EmptyFilterResultsProps) {
  const desc =
    description ||
    (activeFilterCount && activeFilterCount > 0
      ? `No items match the current filter${
          activeFilterCount > 1 ? 's' : ''
        }. Try adjusting or clearing them.`
      : 'No items match the current filters. Try adjusting your criteria.');

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className="mb-4">
        <FilterX className="h-12 w-12 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">{desc}</p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
        >
          <FilterX className="h-4 w-4" />
          {clearLabel}
        </button>
      )}
    </div>
  );
});
