import { memo } from 'react';
import { cn } from '@/utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
};

/**
 * Standalone animated spinner indicator.
 * Respects prefers-reduced-motion via CSS (animation removed by the media query).
 */
export const Spinner = memo(function Spinner({
  size = 'md',
  className,
  label = 'Loading...',
}: SpinnerProps) {
  return (
    <div
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <div
        className={cn('rounded-full border-transparent animate-spin', sizeMap[size]!)}
        style={{
          borderTopColor: 'var(--accent-primary)',
          borderRightColor: 'var(--accent-primary)',
        }}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
});
