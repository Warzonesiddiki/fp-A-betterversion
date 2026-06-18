import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { cn } from '@/utils/cn';

export interface WaterfallItem {
  label: string;
  value: number;
  isTotal?: boolean;
  color?: string;
}

export interface WaterfallChartProps {
  data: WaterfallItem[];
  height?: number;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (item: WaterfallItem) => void;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  data,
  height = 300,
  title,
  className,
  loading = false,
  error,
  onClick,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
          className
        )}
      >
        <div className="flex items-center justify-center h-48 text-red-600 text-sm">{error}</div>
      </div>
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const result: Array<Record<string, unknown>> = [];
    let cumulative = 0;
    data.forEach((item: WaterfallItem) => {
      const start = cumulative;
      if (item.isTotal) {
        cumulative = item.value as number;
        result.push({
          ...item,
          displayValue: item.value,
          base: 0,
          raw: item.value,
        });
      } else {
        cumulative += item.value as number;
        result.push({
          ...item,
          displayValue: Math.abs(item.value as number),
          base: (item.value as number) > 0 ? start : cumulative,
          raw: item.value,
        });
      }
    });
    return result;
  }, [data]);

  if (chartData.length === 0)
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
        No data
      </div>
    );

  const getBarColor = (item: { color?: string; isTotal?: boolean; raw: number }) => {
    if (item.color) return item.color;
    if (item.isTotal) return 'var(--text-secondary)';
    return item.raw >= 0 ? 'var(--positive)' : 'var(--negative)';
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div
      className={cn(
        'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
            {title}
          </h3>
        </div>
      )}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--text-secondary)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              tickFormatter={formatValue}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]!.payload;
                  return (
                    <div className="bg-[var(--bg-surface)] p-2 border border-[var(--border-subtle)] shadow-xl rounded-md">
                      <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
                        {data.label}
                      </p>
                      <p
                        className={cn(
                          'text-sm font-black',
                          data.isTotal
                            ? 'text-[var(--text-primary)]'
                            : data.raw >= 0
                              ? 'text-[var(--positive)]'
                              : 'text-[var(--negative)]'
                        )}
                      >
                        {data.raw > 0 ? '+' : ''}
                        {formatValue(data.raw)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
            <Bar
              dataKey="displayValue"
              stackId="a"
              isAnimationActive={true}
              onClick={onClick ? (entry) => onClick(entry.payload) : undefined}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry as { color?: string; isTotal?: boolean; raw: number })}
                />
              ))}
              <LabelList
                dataKey="raw"
                position="top"
                formatter={(val: unknown) => formatValue(Number(val))}
                style={{ fontSize: '10px', fontWeight: 700, fill: 'var(--text-primary)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
