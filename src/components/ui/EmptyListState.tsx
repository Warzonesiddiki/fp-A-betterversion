import { memo } from 'react';
import { cn } from '@/utils/cn';
import { Inbox } from 'lucide-react';

export interface EmptyListStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty list state — shown when a list/table has 0 items.
 * Uses role="region" with aria-label for landmark semantics.
 *
 * @example
 * {items.length === 0 && (
 *   <EmptyListState
 *     title="No items yet"
 *     description="Get started by creating your first item."
 *     action={<Button onClick={handleCreate}>Create</Button>}
 *   />
 * )}
 */
export const EmptyListState = memo(function EmptyListState({
  title = 'No data available',
  description = 'There are no items to display yet.',
  action,
  className,
}: EmptyListStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
      role="region"
      aria-label={title}
    >
      <div className="mb-4">
        <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
});
