import { memo } from 'react';
import { cn } from '@/utils/cn';

export type TrafficLightStatus = 'green' | 'yellow' | 'red' | 'gray';

export interface TrafficLightProps {
  label: string;
  value: number;
  status: TrafficLightStatus;
  description?: string;
  format?: 'currency' | 'percent' | 'number' | 'compact';
  className?: string;
}

export interface TrafficLightBatchProps {
  items: Array<{
    label: string;
    value: number;
    format?: 'currency' | 'percent' | 'number' | 'compact';
  }>;
  thresholds: {
    green: { min?: number; max?: number };
    yellow: { min?: number; max?: number };
  };
  direction?: 'higher-is-better' | 'lower-is-better';
  className?: string;
}

const statusConfig: Record<
  TrafficLightStatus,
  { bg: string; dot: string; text: string; glow: string }
> = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-200',
    dot: 'bg-green-500',
    text: 'text-green-700',
    glow: 'shadow-green-200/50',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700',
    glow: 'shadow-yellow-200/50',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-700',
    glow: 'shadow-red-200/50',
  },
  gray: {
    bg: 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]',
    dot: 'bg-[var(--text-muted)]',
    text: 'text-[var(--text-secondary)]',
    glow: '',
  },
};

function formatNum(value: number, format: string): string {
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

export const TrafficLightIndicator = memo(function TrafficLightIndicator({
  label,
  value,
  status,
  description,
  format = 'number',
  className,
}: TrafficLightProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2 transition-all',
        config.bg,
        config.glow && `shadow-sm ${config.glow}`,
        className
      )}
    >
      <div className={cn('h-3 w-3 rounded-full shrink-0', config.dot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{label}</span>
          <span className={cn('text-sm font-bold tabular-nums', config.text)}>
            {formatNum(value, format)}
          </span>
        </div>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{description}</p>
        )}
      </div>
    </div>
  );
});

export const TrafficLightBatch = memo(function TrafficLightBatch({
  items,
  thresholds,
  direction = 'higher-is-better',
  className,
}: TrafficLightBatchProps) {
  function getStatus(value: number): TrafficLightStatus {
    if (direction === 'higher-is-better') {
      if (thresholds.green.min !== undefined && value >= thresholds.green.min) return 'green';
      if (thresholds.yellow.min !== undefined && value >= thresholds.yellow.min) return 'yellow';
      return 'red';
    } else {
      if (thresholds.green.max !== undefined && value <= thresholds.green.max) return 'green';
      if (thresholds.yellow.max !== undefined && value <= thresholds.yellow.max) return 'yellow';
      return 'red';
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, idx) => (
        <TrafficLightIndicator
          key={idx}
          label={item.label}
          value={item.value}
          format={item.format}
          status={getStatus(item.value)}
        />
      ))}
    </div>
  );
});
