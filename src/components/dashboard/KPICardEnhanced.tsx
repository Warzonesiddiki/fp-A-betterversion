import { memo } from 'react';
import { Sparkline } from '@/components/ui/Sparkline';
import { cn } from '@/utils/cn';

export type VarianceType = 'favorable' | 'unfavorable' | 'neutral';

export interface KPICardEnhancedProps {
  title: string;
  value: number;
  format?: 'currency' | 'percent' | 'number' | 'compact';
  sparklineData?: number[];
  variancePercent?: number;
  varianceAmount?: number;
  varianceType?: VarianceType;
  priorYearValue?: number;
  budgetValue?: number;
  target?: number;
  onDrillDown?: () => void;
  className?: string;
  loading?: boolean;
}

function formatValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'compact':
      if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    default:
      return value.toLocaleString();
  }
}

const varianceColors: Record<VarianceType, { bg: string; text: string; border: string }> = {
  favorable: {
    bg: 'bg-green-50 dark:bg-green-900/20 dark:bg-green-950',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  unfavorable: {
    bg: 'bg-red-50 dark:bg-red-900/20 dark:bg-red-950',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  neutral: {
    bg: 'bg-gray-50 dark:bg-gray-800 dark:bg-gray-900',
    text: 'text-[var(--text-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
};

const trendArrow: Record<VarianceType, string> = {
  favorable: '\u2191',
  unfavorable: '\u2193',
  neutral: '\u2192',
};

export const KPICardEnhanced = memo(function KPICardEnhanced({
  title,
  value,
  format = 'number',
  sparklineData,
  variancePercent,
  varianceAmount,
  varianceType = 'neutral',
  priorYearValue,
  budgetValue,
  target,
  onDrillDown,
  className,
  loading,
}: KPICardEnhancedProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4',
          className
        )}
      >
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-3" />
        <div className="h-7 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  const colors = varianceColors[varianceType];
  const sparklineColor =
    varianceType === 'favorable'
      ? '#16a34a'
      : varianceType === 'unfavorable'
        ? '#dc2626'
        : '#6b7280';

  const targetProgress = target ? Math.min(100, (value / target) * 100) : undefined;

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-all',
        onDrillDown && 'cursor-pointer hover:border-blue-400 hover:shadow-md',
        className
      )}
      onClick={onDrillDown}
      role={onDrillDown ? 'button' : undefined}
      tabIndex={onDrillDown ? 0 : undefined}
      onKeyDown={(e) => onDrillDown && e.key === 'Enter' && onDrillDown()}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </span>
        {variancePercent !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold',
              colors.bg,
              colors.text
            )}
          >
            {trendArrow[varianceType]} {Math.abs(variancePercent).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="text-2xl font-bold tabular-nums text-[var(--text-primary)] mb-1">
        {formatValue(value, format)}
      </div>

      {varianceAmount !== undefined && (
        <div className={cn('text-xs font-medium mb-2', colors.text)}>
          {varianceType === 'favorable' ? '+' : varianceType === 'unfavorable' ? '-' : ''}
          {formatValue(Math.abs(varianceAmount), format)} vs budget
        </div>
      )}

      {(priorYearValue !== undefined || budgetValue !== undefined) && (
        <div className="flex gap-3 text-xs text-[var(--text-muted)] mb-2">
          {priorYearValue !== undefined && (
            <span>
              PY: <span className="font-medium">{formatValue(priorYearValue, format)}</span>
            </span>
          )}
          {budgetValue !== undefined && (
            <span>
              Budget: <span className="font-medium">{formatValue(budgetValue, format)}</span>
            </span>
          )}
        </div>
      )}

      {targetProgress !== undefined && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-0.5">
            <span>Target progress</span>
            <span className="font-medium">{targetProgress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                targetProgress >= 100
                  ? 'bg-green-500'
                  : targetProgress >= 75
                    ? 'bg-blue-500'
                    : targetProgress >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
              )}
              style={{ width: `${Math.min(100, targetProgress)}%` }}
            />
          </div>
        </div>
      )}

      {sparklineData && sparklineData.length >= 2 && (
        <div className="mt-2 -mx-1">
          <Sparkline data={sparklineData} height={32} color={sparklineColor} showArea />
        </div>
      )}

      {onDrillDown && (
        <div className="mt-2 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to drill down →
        </div>
      )}
    </div>
  );
});
