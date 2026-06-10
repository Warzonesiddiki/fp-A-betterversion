import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';

interface ScatterPoint {
  x: number;
  y: number;
  label: string;
  size?: number;
  color?: string;
}

interface ScatterPlotProps {
  data: ScatterPoint[];
  width?: number;
  height?: number;
  xLabel?: string;
  yLabel?: string;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (point: ScatterPoint) => void;
}

export const ScatterPlot = React.memo(function ScatterPlot({
  data,
  height = 300,
  xLabel,
  yLabel,
  title,
  className,
  loading = false,
  error,
  onClick,
}: ScatterPlotProps) {
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">
          {' '}
          role="alert" role="alert" {error}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0)
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
        No data
      </div>
    );

  const hasSize = data.some((d) => d.size !== undefined);
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="x"
            name={xLabel || 'X'}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            label={{ value: xLabel, position: 'bottom', fontSize: 11, fill: 'var(--text-muted)' }}
          />
          <YAxis
            dataKey="y"
            name={yLabel || 'Y'}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            label={{
              value: yLabel,
              angle: -90,
              position: 'left',
              fontSize: 11,
              fill: 'var(--text-muted)',
            }}
          />
          <Tooltip
            formatter={(value: any) => [value.toLocaleString(), '']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Scatter
            data={data}
            shape={hasSize ? 'circle' : 'circle'}
            isAnimationActive={false}
            onClick={onClick ? (entry) => onClick(entry.payload as ScatterPoint) : undefined}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color || colors[i % colors.length]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
});
