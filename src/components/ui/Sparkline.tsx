import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '@/utils/cn';

export interface SparklineProps {
  data: number[];
  width?: number | string;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = '100%',
  height = 30,
  color = 'var(--accent-primary)',
  showArea = false,
  className,
}) => {
  const chartData = useMemo(() => data.map((val, idx) => ({ value: val, idx })), [data]);

  // Handle empty or small data sets
  if (!data || data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className={cn('bg-gray-100/50 rounded flex items-center justify-center', className)}
      >
        <div className="h-px w-3/4 bg-gray-300" />
      </div>
    );
  }

  const actualColor = color === 'var(--accent-primary)' ? '#2563eb' : color;

  return (
    <div style={{ width, height }} className={cn('relative overflow-hidden', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {showArea ? (
          <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={actualColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={actualColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={actualColor}
              strokeWidth={1.5}
              fill={`url(#gradient-${color})`}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={actualColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
