import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { cn } from '@/utils/cn';

export interface TornadoItem {
  label: string;
  lowValue: number;
  highValue: number;
  baseValue: number;
}

export interface TornadoChartProps {
  data: TornadoItem[];
  height?: number;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (item: TornadoItem) => void;
}

export const TornadoChart: React.FC<TornadoChartProps> = ({
  data,
  height = 400,
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
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">{error}</div>
      </div>
    );
  }
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .map((item) => ({
        ...item,
        range: Math.abs(item.highValue - item.lowValue),
        valueRange: [
          Math.min(item.lowValue, item.highValue),
          Math.max(item.lowValue, item.highValue),
        ],
      }))
      .sort((a, b) => b.range - a.range);
  }, [data]);

  if (sortedData.length === 0)
    return <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">No data</div>;

  const baseValue = data.length > 0 ? data[0].baseValue : 0;

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
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              tickFormatter={formatValue}
              domain={['auto', 'auto']}
            />
            <YAxis
              dataKey="label"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-primary)' }}
              width={100}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[var(--bg-surface)] p-3 border border-[var(--border-subtle)] shadow-2xl rounded-lg">
                      <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 tracking-widest">
                        {d.label}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-[10px] font-bold text-[var(--negative)]">
                            Low Case
                          </span>
                          <span className="text-xs font-black tabular-nums text-[var(--text-primary)]">
                            {formatValue(d.lowValue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-[10px] font-bold text-[var(--info)]">
                            Base Case
                          </span>
                          <span className="text-xs font-black tabular-nums text-[var(--text-primary)]">
                            {formatValue(d.baseValue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-[10px] font-bold text-[var(--positive)]">
                            High Case
                          </span>
                          <span className="text-xs font-black tabular-nums text-[var(--text-primary)]">
                            {formatValue(d.highValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              x={baseValue}
              stroke="var(--border-strong)"
              strokeWidth={2}
              strokeDasharray="3 3"
            />
            <Bar
              dataKey="valueRange"
              isAnimationActive={true}
              radius={[2, 2, 2, 2]}
              onClick={onClick ? (entry) => onClick(entry.payload) : undefined}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.highValue > entry.lowValue ? 'var(--accent-primary)' : 'var(--info)'}
                  opacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center justify-center space-x-6 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter opacity-60">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
          <span>Sensitivity Range</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-0.5 bg-[var(--text-muted)] border-t border-dashed border-[var(--text-muted)]" />
          <span>Base Case ({formatValue(baseValue)})</span>
        </div>
      </div>
    </div>
  );
};
