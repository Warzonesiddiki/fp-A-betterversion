/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/utils/cn';

export interface TreeMapItem {
  name: string;
  value: number;
  color?: string;
  children?: TreeMapItem[];
}

export interface TreeMapProps {
  data: TreeMapItem[];
  width?: number | string;
  height?: number;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (item: TreeMapItem) => void;
}

const CustomizedContent = (props: Record<string, unknown>) => {
  const { depth: d, x: px, y: py, width: w, height: h, payload: pl, name: n, value: v } = props;
  const depth = d as number;
  const x = px as number;
  const y = py as number;
  const width = w as number;
  const height = h as number;
  const payload = pl as { color?: string };
  const name = n as string;
  const value = v as number;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? payload.color || '#2563eb' : '#ffffff00',
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1),
          strokeOpacity: 1 / (depth + 1),
        }}
        className="transition-all hover:opacity-80 cursor-pointer"
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={Math.min(width / 8, 12)}
          fontWeight="bold"
          className="pointer-events-none select-none"
        >
          {name}
        </text>
      )}
      {width > 50 && height > 45 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#fff"
          fillOpacity={0.8}
          fontSize={Math.min(width / 10, 10)}
          fontWeight="medium"
          className="pointer-events-none select-none tabular-nums"
        >
          {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)}
        </text>
      )}
    </g>
  );
};

export const TreeMap: React.FC<TreeMapProps> = ({
  data,
  height = 400,
  title,
  className,
  loading = false,
  error,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
          className
        )}
        role="region"
        aria-label="TreeMap"
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
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">
          {' '}
          role="alert" role="alert" {error}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
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
        <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
          No data
        </div>
      </div>
    );
  }

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
          <Treemap
            data={data as unknown as import('recharts/types/chart/Treemap').TreemapDataType[]}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomizedContent />}
          >
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0]!.payload;
                  return (
                    <div className="bg-slate-900 text-white p-2 rounded shadow-xl border border-slate-800 text-[10px]">
                      <div className="font-black uppercase tracking-wider mb-1">{d.name}</div>
                      <div className="font-medium opacity-80">
                        Value: {d.value.toLocaleString()}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
