import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Sparkline } from './Sparkline';

export interface KPIValueProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  sparklineData?: number[];
  className?: string;
  status?: string;
  format?: string;
}

export const KPIValue: React.FC<KPIValueProps> = ({
  label,
  value,
  icon,
  change,
  changeLabel,
  trend,
  sparklineData,
  className,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // eslint-disable-line react-hooks/set-state-in-effect -- intentional: mount animation trigger
  }, []);

  const effectiveTrend =
    trend ||
    (change !== undefined ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : 'neutral');

  const getTrendColor = () => {
    if (effectiveTrend === 'up') return 'fin-positive bg-green-50';
    if (effectiveTrend === 'down') return 'fin-negative bg-red-50';
    return 'text-[var(--text-secondary)] bg-gray-50 dark:bg-gray-900';
  };

  const getTrendIcon = () => {
    if (effectiveTrend === 'up') return <ArrowUpRight className="h-3 w-3" />;
    if (effectiveTrend === 'down') return <ArrowDownRight className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <div
      className={cn(
        'flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm transition-all hover:shadow-md group',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[var(--text-secondary)]">{icon}</span>}
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-70 group-hover:opacity-100 transition-opacity">
            {label}
          </span>
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums',
              getTrendColor()
            )}
          >
            {getTrendIcon()}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div
        className={cn(
          'text-2xl font-black text-[var(--text-primary)] tabular-nums transition-all duration-700',
          isMounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        )}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {changeLabel && (
        <div className="mt-1 text-[10px] font-medium text-[var(--text-secondary)] opacity-60">
          {changeLabel}
        </div>
      )}

      {sparklineData && (
        <div className="mt-4 w-full h-10 -mx-1">
          <Sparkline
            data={sparklineData}
            color={
              effectiveTrend === 'up'
                ? '#16a34a'
                : effectiveTrend === 'down'
                  ? '#dc2626'
                  : '#2563eb'
            }
            showArea
          />
        </div>
      )}
    </div>
  );
};
