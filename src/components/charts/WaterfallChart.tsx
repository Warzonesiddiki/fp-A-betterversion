import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

export interface WaterfallDataPoint {
  name: string;
  value: number;
  fill?: string;
}

interface WaterfallChartProps {
  data: WaterfallDataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
  onClick?: (dataPoint: WaterfallDataPoint, index: number) => void;
}

interface ProcessedPoint extends WaterfallDataPoint {
  invisible: number;
  visible: number;
  fill: string;
}

export function WaterfallChart({
  data,
  height = 400,
  formatValue = (v) => `$${v.toLocaleString()}`,
  ariaLabel = 'Waterfall chart',
  onClick,
}: WaterfallChartProps) {
  const processed: ProcessedPoint[] = useMemo(() => {
    let running = 0; // eslint-disable-line react-hooks/immutability -- scoped to callback, safe
    return data.map((d) => {
      const start = running;
      running += d.value;
      return {
        ...d,
        invisible: d.value >= 0 ? start : running,
        visible: Math.abs(d.value),
        fill: d.fill ?? (d.value >= 0 ? '#16A34A' : '#DC2626'),
      };
    });
  }, [data]);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <div role="img" aria-label={ariaLabel} data-testid="waterfall-chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={processed} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #334155)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary, #94a3b8)' }} />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 12, fill: 'var(--text-secondary, #94a3b8)' }}
          />
          <Tooltip
            formatter={(value, name, props) => [
              formatValue(props.payload?.value ?? 0),
              props.payload?.name ?? '',
            ]}
          />
          <ReferenceLine y={0} stroke="var(--text-muted, #666)" />
          <Bar dataKey="invisible" stackId="waterfall" fill="transparent" />
          <Bar
            dataKey="visible"
            stackId="waterfall"
            onClick={onClick ? (_entry, index) => onClick(data[index]!, index) : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          >
            {processed.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="text-center text-sm text-muted-foreground mt-1">
        Total: {formatValue(total)}
      </div>
    </div>
  );
}
