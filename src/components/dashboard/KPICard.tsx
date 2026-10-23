import { memo } from 'react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import { formatPercent } from '@/utils/financialFormatting';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

function InlineSparkline({ data, color = '#3B82F6', height = 32 }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type KPICardVarianceType = 'favorable' | 'unfavorable' | 'neutral';

export interface KPICardProps {
  title: string;
  /**
   * Measured KPI value. `null`/`undefined` means "not measurable from the
   * posted data" — the card renders an em-dash (—) instead of inventing a
   * figure. Numeric values keep the existing currency/percent/number formats.
   */
  value?: number | null;
  format?: 'currency' | 'percent' | 'number';
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  onClick?: () => void;
  loading?: boolean;
  /** Variance badge: shows colored pill with variance amount */
  varianceBadge?: {
    amount: number;
    percent: number;
    type: KPICardVarianceType;
    label?: string;
  };
  /** Prior year value for comparison */
  priorYearValue?: number;
  /** Budget value for comparison */
  budgetValue?: number;
}

const varianceStyles: Record<KPICardVarianceType, { bg: string; text: string }> = {
  favorable: {
    bg: 'bg-green-50 dark:bg-green-900/20 dark:bg-green-900/30',
    text: 'text-green-700',
  },
  unfavorable: {
    bg: 'bg-red-50 dark:bg-red-900/20 dark:bg-red-900/30',
    text: 'text-red-700',
  },
  neutral: { bg: 'bg-[var(--bg-elevated)]', text: 'text-[var(--text-muted)]' },
};

const trendArrowSymbol: Record<string, string> = {
  up: '\u2191',
  down: '\u2193',
  neutral: '\u2192',
};

export const KPICard = memo(function KPICard({
  title,
  value,
  format = 'number',
  change,
  trend,
  sparklineData,
  onClick,
  loading,
  varianceBadge,
  priorYearValue,
  budgetValue,
}: KPICardProps) {
  const fmtCurrency = useCurrencyFormatter();
  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton variant="text" width="60%" height="0.75rem" className="mb-2" />
        <Skeleton variant="text" width="80%" height="1.75rem" className="mb-1" />
        <Skeleton variant="text" width="40%" height="0.75rem" />
      </Card>
    );
  }

  const formatted =
    value === null || value === undefined
      ? '—'
      : format === 'currency'
        ? fmtCurrency.custom({ decimals: 0 })(value)
        : format === 'percent'
          ? formatPercent(value, 1)
          : value.toLocaleString();

  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-[var(--text-muted)]';
  const trendArrow = trend ? trendArrowSymbol[trend] : trendArrowSymbol.neutral;

  return (
    <Card
      className={cn(
        'p-4',
        onClick &&
          'cursor-pointer hover:border-blue-500/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={onClick ? `${title}: ${formatted}` : undefined}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="text-xs text-[var(--text-muted)] truncate">{title}</div>
        {varianceBadge && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold',
              varianceStyles[varianceBadge.type].bg,
              varianceStyles[varianceBadge.type].text
            )}
          >
            {
              trendArrowSymbol[
                varianceBadge.type === 'favorable'
                  ? 'up'
                  : varianceBadge.type === 'unfavorable'
                    ? 'down'
                    : 'neutral'
              ]
            }{' '}
            {formatPercent(Math.abs(varianceBadge.percent), 1)}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums">{formatted}</div>

      {varianceBadge && (
        <div className={cn('text-xs font-medium mt-0.5', varianceStyles[varianceBadge.type].text)}>
          {varianceBadge.type === 'favorable'
            ? '+'
            : varianceBadge.type === 'unfavorable'
              ? '-'
              : ''}
          {format === 'currency'
            ? fmtCurrency.custom({ decimals: 0 })(Math.abs(varianceBadge.amount))
            : Math.abs(varianceBadge.amount).toLocaleString()}{' '}
          {varianceBadge.label ?? 'vs budget'}
        </div>
      )}

      {(priorYearValue !== undefined || budgetValue !== undefined) && (
        <div className="flex gap-3 text-xs text-[var(--text-muted)] mt-1">
          {priorYearValue !== undefined && (
            <span>
              PY:{' '}
              <span className="font-medium">
                {format === 'currency'
                  ? fmtCurrency.custom({ minDecimals: 0 })(priorYearValue)
                  : priorYearValue.toLocaleString()}
              </span>
            </span>
          )}
          {budgetValue !== undefined && (
            <span>
              Budget:{' '}
              <span className="font-medium">
                {format === 'currency'
                  ? fmtCurrency.custom({ minDecimals: 0 })(budgetValue)
                  : budgetValue.toLocaleString()}
              </span>
            </span>
          )}
        </div>
      )}

      {change !== undefined && !varianceBadge && (
        <div className={'flex items-center gap-1 text-xs mt-1 ' + trendColor}>
          <span>{trendArrow}</span>
          <span>
            {change >= 0 ? '+' : ''}
            {formatPercent(change, 1)} vs prior
          </span>
        </div>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-2">
          <InlineSparkline
            data={sparklineData}
            color={trend === 'up' ? '#10B981' : trend === 'down' ? '#F43F5E' : '#94A3B8'}
          />
        </div>
      )}
    </Card>
  );
});
