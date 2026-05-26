import { memo } from 'react';
import { GaugeChart as BaseGaugeChart } from '@/components/charts/GaugeChart';
import { cn } from '@/utils/cn';

export interface DashboardGaugeProps {
  /** Current metric value */
  value: number;
  /** Gauge minimum */
  min?: number;
  /** Gauge maximum */
  max?: number;
  /** Target value — drives color logic */
  target?: number;
  /** Title shown above gauge */
  title: string;
  /** Subtitle or period label */
  subtitle?: string;
  /** Format the value text */
  formatValue?: (v: number) => string;
  /** Gauge diameter in px */
  size?: number;
  /** Additional class on wrapper */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

function defaultFormat(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `${v.toFixed(1)}%`;
}

export const DashboardGauge = memo(function DashboardGauge({
  value,
  min = 0,
  max = 100,
  target,
  title,
  subtitle,
  formatValue = defaultFormat,
  size = 160,
  className,
  onClick,
}: DashboardGaugeProps) {
  const ratio = target !== undefined ? value / target : undefined;

  const statusLabel =
    ratio !== undefined
      ? ratio >= 1
        ? 'On Target'
        : ratio >= 0.8
          ? 'Near Target'
          : 'Below Target'
      : undefined;

  const statusColor =
    ratio !== undefined
      ? ratio >= 1
        ? 'text-green-600 dark:text-green-400'
        : ratio >= 0.8
          ? 'text-yellow-600 dark:text-yellow-400'
          : 'text-red-600 dark:text-red-400'
      : undefined;

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col items-center',
        onClick && 'cursor-pointer hover:border-blue-400 hover:shadow-md transition-all',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">
        {title}
      </div>

      <BaseGaugeChart
        value={value}
        min={min}
        max={max}
        target={target}
        formatValue={formatValue}
        size={size}
        ariaLabel={`${title}: ${formatValue(value)}`}
      />

      {statusLabel && (
        <div className={cn('text-xs font-semibold mt-1', statusColor)}>{statusLabel}</div>
      )}

      {subtitle && <div className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</div>}

      {target !== undefined && (
        <div className="text-xs text-[var(--text-muted)] mt-1">
          Target: <span className="font-medium">{formatValue(target)}</span>
        </div>
      )}
    </div>
  );
});
