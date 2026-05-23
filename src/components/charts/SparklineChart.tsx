import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  ariaLabel?: string;
  onClick?: () => void;
}

export function SparklineChart({
  data,
  color = '#3B82F6',
  height = 40,
  width = 120,
  ariaLabel = 'Sparkline chart',
  onClick,
}: SparklineChartProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      data-testid="sparkline-chart"
      onClick={onClick}
      className="dark:opacity-90"
      style={{ width, height, display: 'inline-block', cursor: onClick ? 'pointer' : 'default' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
