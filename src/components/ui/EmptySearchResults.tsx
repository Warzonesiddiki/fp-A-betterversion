import { memo } from 'react';
import { cn } from '@/utils/cn';
import { SearchX } from 'lucide-react';

export interface EmptySearchResultsProps {
  query?: string;
  title?: string;
  description?: string;
  suggestions?: string[];
  className?: string;
}

/**
 * Empty search results — shown when a search yields no matches.
 * Uses role="region" with aria-label for landmark semantics.
 *
 * @example
 * {searchResults.length === 0 && searchQuery && (
 *   <EmptySearchResults query={searchQuery} />
 * )}
 */
export const EmptySearchResults = memo(function EmptySearchResults({
  query,
  title = 'No results found',
  description,
  suggestions,
  className,
}: EmptySearchResultsProps) {
  const desc =
    description ||
    (query
      ? `No results match "${query}". Try adjusting your search terms.`
      : "Try entering a search term to find what you're looking for.");

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className="mb-4">
        <SearchX className="h-12 w-12 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">{desc}</p>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-[var(--text-muted)] mb-2">Suggestions:</p>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
