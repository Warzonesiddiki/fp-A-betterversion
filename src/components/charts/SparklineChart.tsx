// Bundle diet: recharts removed for sparkline — custom SVG (T019, T526-T534)
// Previously used LineChart from recharts (heavy), now lightweight SVG path
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
  if (data.length === 0) {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        data-testid="sparkline-chart"
        style={{ width, height, display: 'inline-block' }}
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel}
      data-testid="sparkline-chart"
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
      className="dark:opacity-90"
      style={{ width, height, display: 'inline-block', cursor: onClick ? 'pointer' : 'default' }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}
