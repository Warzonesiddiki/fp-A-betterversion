import React from 'react';
import { cn } from '@/utils/cn';

export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

export interface FunnelChartProps {
  stages: FunnelStage[];
  format?: (value: number) => string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (stage: FunnelStage) => void;
}

export const FunnelChart: React.FC<FunnelChartProps> = React.memo(({
  stages,
  format = (v) => v.toLocaleString(),
  className,
  loading = false,
  error,
  onClick,
}) => {
  if (loading) {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">{error}</div>
      </div>
    );
  }
  if (!stages || stages.length === 0)
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
        No data
      </div>
    );

  const maxValue = Math.max(...stages.map((s) => s.value));
  if (maxValue <= 0)
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
        No data
      </div>
    );

  const defaultColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {stages.map((stage, i) => {
        const width = (stage.value / maxValue) * 100;
        const conversionRate =
          i > 0 ? ((stage.value / stages[i - 1].value) * 100).toFixed(1) : null;

        return (
          <div
            key={i}
            className="w-full flex items-center gap-2 cursor-pointer"
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick ? () => onClick(stage) : undefined}
            onKeyDown={
              onClick
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onClick(stage);
                    }
                  }
                : undefined
            }
          >
            <div className="w-24 text-right text-sm text-[var(--text-secondary)] truncate">
              {stage.label}
            </div>
            <div className="flex-1 flex items-center">
              <div
                className="h-8 rounded transition-all duration-300"
                style={{
                  width: `${width}%`,
                  backgroundColor: stage.color ?? defaultColors[i % defaultColors.length],
                }}
              />
              <span className="ml-2 text-sm font-medium">{format(stage.value)}</span>
            </div>
            {conversionRate && (
              <div className="w-16 text-xs text-[var(--text-muted)]">{conversionRate}%</div>
            )}
          </div>
        );
      })}
    </div>
  );
});
