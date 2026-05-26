import React from 'react';
import { cn } from '@/utils/cn';

export interface BoxPlotData {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
}

export interface BoxPlotChartProps {
  data: BoxPlotData[];
  format?: (value: number) => string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (item: BoxPlotData) => void;
}

export const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
  data,
  format = (v) => v.toLocaleString(),
  className,
  loading = false,
  error,
  onClick,
}) => {
  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">{error}</div>
      </div>
    );
  }
  if (!data || data.length === 0)
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
        No data
      </div>
    );

  const allValues = data.flatMap((d) => [d.min, d.max, ...(d.outliers ?? [])]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1; // Guard against zero range

  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-4 h-64">
        {data.map((item, i) => {
          const color = defaultColors[i % defaultColors.length];
          const scale = (v: number) => ((v - minVal) / range) * 100;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center cursor-pointer"
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
              onClick={onClick ? () => onClick(item) : undefined}
              onKeyDown={
                onClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick(item);
                      }
                    }
                  : undefined
              }
            >
              {/* Box */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Whiskers */}
                <div
                  className="absolute w-px bg-gray-400"
                  style={{
                    bottom: `${scale(item.min)}%`,
                    height: `${scale(item.max) - scale(item.min)}%`,
                  }}
                />
                {/* Box */}
                <div
                  className="absolute w-12 rounded border-2"
                  style={{
                    bottom: `${scale(item.q1)}%`,
                    height: `${scale(item.q3) - scale(item.q1)}%`,
                    borderColor: color,
                    backgroundColor: `${color}20`,
                  }}
                />
                {/* Median line */}
                <div
                  className="absolute w-12 h-0.5"
                  style={{
                    bottom: `${scale(item.median)}%`,
                    backgroundColor: color,
                  }}
                />
                {/* Outliers */}
                {item.outliers?.map((outlier, oi) => (
                  <div
                    key={oi}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      bottom: `${scale(outlier)}%`,
                      backgroundColor: color,
                      opacity: 0.6,
                    }}
                  />
                ))}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-2 truncate w-full text-center">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
        <span>{format(minVal)}</span>
        <span>{format(maxVal)}</span>
      </div>
    </div>
  );
};
