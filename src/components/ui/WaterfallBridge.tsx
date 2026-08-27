import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';

export interface WaterfallItem {
  label: string;
  value: number;
  type: 'increase' | 'decrease' | 'total';
  color?: string;
}

export interface WaterfallBridgeProps {
  items: WaterfallItem[];
  format?: (value: number) => string;
  className?: string;
}

interface ProcessedBridgeItem extends WaterfallItem {
  start: number;
  end: number;
}

const TONE_TOKENS: Record<WaterfallItem['type'], string> = {
  increase: 'var(--positive)',
  decrease: 'var(--negative)',
  total: 'var(--info)',
};

export const WaterfallBridge: React.FC<WaterfallBridgeProps> = ({
  items,
  format = (v) => v.toLocaleString(),
  className,
}) => {
  // Hooks must run unconditionally: compute before any early return so the
  // hook order is stable across empty/data/null state flips.
  const processedItems = useMemo<ProcessedBridgeItem[]>(
    () =>
      (items ?? []).reduce<ProcessedBridgeItem[]>((acc, item) => {
        const prevEnd = acc.length > 0 ? (acc[acc.length - 1]?.end ?? 0) : 0;
        const start = item.type === 'total' ? 0 : prevEnd;
        const end = item.type === 'total' ? item.value : start + item.value;
        acc.push({ ...item, start, end });
        return acc;
      }, []),
    [items]
  );

  if (processedItems.length === 0)
    return (
      <div
        className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300"
        role="region"
        aria-label="WaterfallBridge"
      >
        No data
      </div>
    );

  const allValues = processedItems.flatMap((i) => [i.start, i.end]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1; // Guard against zero range

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-2 h-48">
        {processedItems.map((item, i) => {
          const color = item.color ?? TONE_TOKENS[item.type];
          const bottom = ((Math.min(item.start, item.end) - minVal) / range) * 100;
          const height = (Math.abs(item.end - item.start) / range) * 100;

          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="relative w-full h-full">
                <div
                  className="absolute w-full rounded"
                  style={{
                    bottom: `${bottom}%`,
                    height: `${Math.max(height, 2)}%`,
                    backgroundColor: color,
                  }}
                />
                {/* Connector line to next bar */}
                {i < processedItems.length - 1 && (
                  <div
                    className="absolute w-full h-px bg-gray-300"
                    style={{ bottom: `${((item.end - minVal) / range) * 100}%` }}
                  />
                )}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-2 truncate w-full text-center">
                {item.label}
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color }}>
                {format(item.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
