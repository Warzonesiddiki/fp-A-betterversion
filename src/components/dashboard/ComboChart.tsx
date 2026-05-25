import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface ComboChartDataPoint {
  name: string;
  bar: number;
  line: number;
  /** Optional second bar series */
  bar2?: number;
  /** Optional second line series */
  line2?: number;
}

export interface ComboChartSeriesConfig {
  barLabel?: string;
  barColor?: string;
  bar2Label?: string;
  bar2Color?: string;
  lineLabel?: string;
  lineColor?: string;
  line2Label?: string;
  line2Color?: string;
}

export interface ComboChartProps {
  data: ComboChartDataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  series?: ComboChartSeriesConfig;
  ariaLabel?: string;
  title?: string;
  className?: string;
  onClick?: (dataPoint: ComboChartDataPoint, index: number) => void;
}

const defaultSeries: ComboChartSeriesConfig = {
  barLabel: 'Actual',
  barColor: '#3B82F6',
  bar2Label: 'Budget',
  bar2Color: '#94A3B8',
  lineLabel: 'Margin %',
  lineColor: '#10B981',
  line2Label: '',
  line2Color: '#F59E0B',
};

export function ComboChart({
  data,
  height = 350,
  formatValue = (v) => v.toLocaleString(),
  series = defaultSeries,
  ariaLabel = 'Combo bar and line chart',
  title,
  className,
  onClick,
}: ComboChartProps) {
  const cfg = { ...defaultSeries, ...series };
  const hasBar2 = data.some((d) => d.bar2 !== undefined);
  const hasLine2 = data.some((d) => d.line2 !== undefined);

  return (
    <div className={className} role="img" aria-label={ariaLabel} data-testid="combo-chart">
      {title && (
        <div className="text-sm font-semibold text-[var(--text-primary)] mb-3">{title}</div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #334155)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary, #94a3b8)' }} />
          <YAxis
            yAxisId="left"
            tickFormatter={formatValue}
            tick={{ fontSize: 12, fill: 'var(--text-secondary, #94a3b8)' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12, fill: 'var(--text-secondary, #94a3b8)' }}
          />
          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              const num = typeof value === 'number' ? value : Number(value);
              const label = String(name);
              if (label.includes('Margin') || label.includes('%')) {
                return [`${num.toFixed(1)}%`, label];
              }
              return [formatValue(num), label];
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="bar"
            name={cfg.barLabel}
            fill={cfg.barColor}
            radius={[3, 3, 0, 0]}
            barSize={24}
            onClick={onClick ? (_entry, index) => onClick(data[index]!, index) : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          />
          {hasBar2 && (
            <Bar
              yAxisId="left"
              dataKey="bar2"
              name={cfg.bar2Label}
              fill={cfg.bar2Color}
              radius={[3, 3, 0, 0]}
              barSize={24}
            />
          )}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="line"
            name={cfg.lineLabel}
            stroke={cfg.lineColor}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          {hasLine2 && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="line2"
              name={cfg.line2Label}
              stroke={cfg.line2Color}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
