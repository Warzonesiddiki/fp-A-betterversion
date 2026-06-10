import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
  animation?: 'pulse' | 'shimmer' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
  animation = 'shimmer',
}) => {
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
      role="status"
      aria-label="Loading content"
      aria-live="polite"
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
      <span className="sr-only">Loading...</span>
    </div>
  );
};
