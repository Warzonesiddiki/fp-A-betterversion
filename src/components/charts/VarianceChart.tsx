import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts';

export interface VarianceDataPoint {
  name: string;
  budget: number;
  actual: number;
}

interface VarianceChartProps {
  data: VarianceDataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
  onClick?: (dataPoint: VarianceDataPoint, index: number) => void;
}

export function VarianceChart({
  data,
  height = 400,
  formatValue = (v) => `$${v.toLocaleString()}`,
  ariaLabel = 'Budget vs Actual variance chart',
  onClick,
}: VarianceChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    variance: d.actual - d.budget,
    variancePct: d.budget !== 0 ? ((d.actual - d.budget) / Math.abs(d.budget)) * 100 : 0,
  }));

  return (
    <div role="img" aria-label={ariaLabel} data-testid="variance-chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #334155)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary, #94a3b8)' }} />
          <YAxis
            tickFormatter={formatValue}
            tick={{ fontSize: 12, fill: 'var(--text-secondary, #94a3b8)' }}
          />
          <Tooltip
            formatter={
              ((value: string | number, name: string) => [
                formatValue(Number(value)),
                name,
              ]) as React.ComponentProps<typeof Tooltip>['formatter']
            }
            labelFormatter={(label) => label}
          />
          <Legend />
          <ReferenceLine y={0} stroke="var(--text-muted, #666)" />
          <Bar dataKey="budget" fill="#94A3B8" name="Budget" radius={[2, 2, 0, 0]} />
          <Bar
            dataKey="actual"
            name="Actual"
            radius={[2, 2, 0, 0]}
            onClick={onClick ? (_entry, index) => onClick(data[index]!, index) : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.variance >= 0 ? '#16A34A' : '#DC2626'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
