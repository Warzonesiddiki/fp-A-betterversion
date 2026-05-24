interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  target?: number;
  label?: string;
  formatValue?: (v: number) => string;
  size?: number;
  ariaLabel?: string;
  onClick?: () => void;
}

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  target,
  label,
  formatValue = (v) => `${v}%`,
  size = 160,
  ariaLabel = 'Gauge chart',
  onClick,
}: GaugeChartProps) {
  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  const startAngle = -135;
  const endAngle = 135;
  const range = endAngle - startAngle;

  const valueAngle = startAngle + ((value - min) / (max - min)) * range;
  const targetAngle =
    target !== undefined ? startAngle + ((target - min) / (max - min)) * range : undefined;

  const toXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  const arcPath = (startA: number, endA: number, r: number) => {
    const start = toXY(startA, r);
    const end = toXY(endA, r);
    const largeArc = endA - startA > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const getColor = () => {
    if (target === undefined) return '#3B82F6';
    const ratio = value / target;
    if (ratio >= 1) return '#16A34A';
    if (ratio >= 0.8) return '#F59E0B';
    return '#DC2626';
  };

  const needleEnd = toXY(valueAngle, radius - 15);

  return (
    <div
      role={onClick ? 'button' : 'img'}
      aria-label={`${ariaLabel}: ${formatValue(value)}`}
      data-testid="gauge-chart"
      className="flex flex-col items-center"
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background arc */}
        <path
          d={arcPath(startAngle, endAngle, radius)}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={12}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={arcPath(startAngle, valueAngle, radius)}
          fill="none"
          stroke={getColor()}
          strokeWidth={12}
          strokeLinecap="round"
        />

        {/* Target marker */}
        {targetAngle !== undefined && (
          <circle {...toXY(targetAngle, radius)} r={4} fill="#111" stroke="#fff" strokeWidth={2} />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={getColor()}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill={getColor()} />

        {/* Value text */}
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fontSize={20}
          fontWeight="bold"
          fill="currentColor"
        >
          {formatValue(value)}
        </text>
      </svg>
      {label && <div className="text-sm text-muted-foreground mt-1">{label}</div>}
    </div>
  );
}
