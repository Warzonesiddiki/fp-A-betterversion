// Bundle diet: recharts Treemap removed — custom flex layout (T019, T526-T534)
// Previously used Treemap from recharts (99KB gz heavy), now lightweight divs
export interface TreemapDataPoint {
  name: string;
  size: number;
  fill?: string;
}

interface TreemapChartProps {
  data: TreemapDataPoint[];
  height?: number;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
  onClick?: (dataPoint: TreemapDataPoint, index: number) => void;
}

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
];

export function TreemapChart({
  data,
  height = 400,
  ariaLabel = 'Treemap chart',
  formatValue,
  onClick,
}: TreemapChartProps) {
  const total = data.reduce((sum, d) => sum + d.size, 0) || 1;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      data-testid="treemap-chart"
      className="w-full flex flex-wrap gap-1"
      style={{ minHeight: height }}
    >
      {data.map((d, i) => {
        const pct = (d.size / total) * 100;
        const widthPct = Math.max(10, pct);
        return (
          <div
            key={d.name}
            className="relative flex items-center justify-center rounded text-white text-xs font-bold cursor-pointer hover:opacity-90 transition-opacity p-2"
            style={{
              backgroundColor: d.fill || COLORS[i % COLORS.length],
              width: `${widthPct}%`,
              minWidth: 80,
              minHeight: 60,
              flexGrow: 1,
            }}
            onClick={() => onClick?.(d, i)}
            title={`${d.name}: ${formatValue ? formatValue(d.size) : d.size.toLocaleString()}`}
          >
            <span className="text-center">
              {d.name}
              <br />
              <span className="font-normal">
                {formatValue ? formatValue(d.size) : d.size.toLocaleString()}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
