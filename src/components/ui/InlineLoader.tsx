import { memo } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/utils/cn';

export type InlineLoaderVariant = 'skeleton' | 'spinner' | 'none';

export interface InlineLoaderProps {
  /** Loading state */
  loading: boolean;
  /** Visual variant */
  variant?: InlineLoaderVariant;
  /** Skeleton count (only when variant='skeleton') */
  count?: number;
  /** Skeleton height (only when variant='skeleton') */
  height?: string;
  /** Skeleton width (only when variant='skeleton') */
  width?: string;
  /** Additional spinner label */
  label?: string;
  /** Additional class name */
  className?: string;
  children: React.ReactNode;
}

/**
 * Inline loading wrapper that shows skeleton or spinner while loading.
 * Respects prefers-reduced-motion.
 * Use for any content area that has a loading state.
 *
 * @example
 * <InlineLoader loading={isLoading} variant="skeleton" count={3}>
 *   <ActualContent />
 * </InlineLoader>
 */
export const InlineLoader = memo(function InlineLoader({
  loading,
  variant = 'skeleton',
  count = 3,
  height,
  width,
  label = 'Loading content...',
  className,
  children,
}: InlineLoaderProps) {
  const reducedMotion = useReducedMotion();

  if (!loading) {
    return <>{children}</>;
  }

  if (variant === 'none') {
    return <>{children}</>;
  }

  if (variant === 'spinner') {
    return (
      <div
        className={cn('flex items-center justify-center py-8', className)}
        role="status"
        aria-busy="true"
        aria-label={label}
      >
        <Spinner size="md" label={label} />
      </div>
    );
  }

  // skeleton variant (default)
  return (
    <div className={cn('w-full', className)} role="status" aria-busy="true" aria-label={label}>
      <Skeleton
        count={count}
        height={height}
        width={width}
        animation={reducedMotion ? 'none' : 'shimmer'}
      />
    </div>
  );
});
