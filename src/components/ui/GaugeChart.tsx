interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  threshold?: number;
  critical?: number;
  label: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: () => void;
}

export function GaugeChart({
  value,
  min,
  max,
  threshold,
  critical,
  label,
  width = 200,
  height = 160,
  className,
  loading = false,
  error,
  onClick,
}: GaugeChartProps) {
  if (loading) {
    return (
      <div className={className} style={{ width, height }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={{ width, height }}>
        <div className="flex items-center justify-center h-full text-red-600 text-sm">{error}</div>
      </div>
    );
  }
  if (isNaN(value) || isNaN(min) || isNaN(max))
    return <div className="text-slate-400 text-xs p-4">Invalid data</div>;

  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const angle = (pct / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const cx = width / 2;
  const cy = height - 20;
  const r = Math.min(width / 2 - 20, height - 40);
  const nx = cx + r * Math.sin(radians);
  const ny = cy - r * Math.cos(radians);
  const thresholdAngle = threshold !== undefined ? ((threshold - min) / (max - min)) * 180 : 0;
  const criticalAngle = critical !== undefined ? ((critical - min) / (max - min)) * 180 : 0;
  const thrRad = (thresholdAngle * Math.PI) / 180;
  const criRad = (criticalAngle * Math.PI) / 180;

  if (max <= min) return <div className="text-slate-400 text-xs p-4">Invalid range</div>;

  const getColor = () => {
    if (critical !== undefined && pct >= critical) return 'var(--negative)';
    if (threshold !== undefined && pct >= threshold) return 'var(--warning)';
    return 'var(--positive)';
  };

  return (
    <div
      className={className}
      style={{ width, height }}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${value}`}
      data-testid="gauge-chart"
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
    >
      <svg width={width} height={height}>
        <path
          d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {threshold !== undefined && (
          <line
            x1={cx}
            y1={cy}
            x2={cx + r * Math.sin(thrRad)}
            y2={cy - r * Math.cos(thrRad)}
            stroke="var(--warning)"
            strokeWidth={2}
            opacity={0.5}
            strokeDasharray="4 2"
          />
        )}
        {critical !== undefined && (
          <line
            x1={cx}
            y1={cy}
            x2={cx + r * Math.sin(criRad)}
            y2={cy - r * Math.cos(criRad)}
            stroke="var(--negative)"
            strokeWidth={2}
            opacity={0.5}
            strokeDasharray="4 2"
          />
        )}
        <path
          d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${nx} ${ny}`}
          fill="none"
          stroke={getColor()}
          strokeWidth={12}
          strokeLinecap="round"
        />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--text-primary)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={4} fill="var(--text-primary)" />
        <text
          x={cx}
          y={cy - r / 2 - 5}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize={20}
          fontWeight={700}
        >
          {value.toLocaleString()}
        </text>
        <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--text-muted)" fontSize={11}>
          {label}
        </text>
        <text x={12} y={cy + 12} fill="var(--text-muted)" fontSize={10}>
          {min}
        </text>
        <text x={width - 12} y={cy + 12} textAnchor="end" fill="var(--text-muted)" fontSize={10}>
          {max}
        </text>
      </svg>
    </div>
  );
}
