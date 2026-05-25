import React from 'react';
import { cn } from '@/utils/cn';

export interface BulletChartProps {
  actual: number;
  target: number;
  ranges?: { min: number; max: number; color: string }[];
  label?: string;
  format?: (value: number) => string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: () => void;
}

export const BulletChart: React.FC<BulletChartProps> = ({
  actual,
  target,
  ranges = [
    { min: 0, max: 0.6, color: '#fecaca' },
    { min: 0.6, max: 0.8, color: '#fef3c7' },
    { min: 0.8, max: 1.2, color: '#d1fae5' },
  ],
  label,
  format = (v) => v.toLocaleString(),
  className,
  loading = false,
  error,
  onClick,
}) => {
  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center h-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center h-12 text-red-500 text-sm">{error}</div>
      </div>
    );
  }
  if (isNaN(actual) || isNaN(target))
    return <div className="flex items-center justify-center h-12 text-slate-400">Invalid data</div>;

  const max = Math.max(actual, target, ...ranges.map((r) => r.max)) * 1.1 || 1;

  return (
    <div
      className={cn('w-full cursor-pointer', className)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded">
        {/* Qualitative ranges */}
        {ranges.map((range, i) => (
          <div
            key={i}
            className="absolute h-full rounded"
            style={{
              left: `${(range.min / max) * 100}%`,
              width: `${((range.max - range.min) / max) * 100}%`,
              backgroundColor: range.color,
            }}
          />
        ))}
        {/* Actual bar */}
        <div
          className="absolute h-full bg-gray-800 rounded"
          style={{ width: `${(actual / max) * 100}%` }}
        />
        {/* Target marker */}
        <div
          className="absolute h-full w-1 bg-black"
          style={{ left: `${(target / max) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
        <span>{format(actual)}</span>
        <span>Target: {format(target)}</span>
      </div>
    </div>
  );
};
