import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'none';
  /**
   * Opt-in assistive-tech announcement for this loading region (W-A11Y-002 M5).
   *
   * By default Skeleton is fully decorative: bars are `aria-hidden="true"` and
   * nothing is announced, so pages rendering many skeletons no longer flood
   * screen readers with one "Loading…" live region per skeleton instance.
   *
   * When a non-empty `srLabel` is passed, exactly ONE visually-hidden polite
   * status region (`role="status"` + `aria-live="polite"`) is rendered for the
   * whole group — announced once on mount, not once per pulse or per bar:
   *
   * @example
   * // Whole-region announcement, once:
   * <Skeleton count={6} variant="rectangular" height="40px" srLabel="Loading report…" />
   */
  srLabel?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
  animation = 'shimmer',
  srLabel,
}) => {
  const hasSrLabel = typeof srLabel === 'string' && srLabel.length > 0;
  const baseClasses = cn(
    'bg-gray-200 dark:bg-gray-700',
    animation === 'pulse' && 'animate-pulse',
    animation === 'shimmer' && 'relative overflow-hidden'
  );

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    card: 'rounded-lg',
  };

  const defaultDimensions: Record<string, { width: string; height: string }> = {
    text: { width: '100%', height: '1rem' },
    circular: { width: '2.5rem', height: '2.5rem' },
    rectangular: { width: '100%', height: '100%' },
    card: { width: '100%', height: '6rem' },
  };

  const style = {
    width: width || defaultDimensions[variant]!.width,
    height: height || defaultDimensions[variant]!.height,
  };

  return (
    <div
      className="flex flex-col gap-2 w-full"
      // Decorative by default (W-A11Y-002 M5): nothing is announced unless an
      // srLabel opts in, so the whole subtree stays out of the a11y tree.
      aria-hidden={hasSrLabel ? undefined : true}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClasses, variantClasses[variant]!, className)}
          style={style}
          aria-hidden="true"
        >
          {animation === 'shimmer' && (
            <div
              className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"
              aria-hidden="true"
            />
          )}
        </div>
      ))}
      {hasSrLabel && (
        <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {srLabel}
        </span>
      )}
    </div>
  );
};
