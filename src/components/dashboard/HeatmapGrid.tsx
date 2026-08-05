import { useMemo, useState, memo } from 'react';
import { cn } from '@/utils/cn';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';

export interface HeatmapCell {
  rowId: string;
  colId: string;
  value: number;
  rawValue?: number;
}

export interface HeatmapGridProps {
  rows: string[];
  columns: string[];
  cells: HeatmapCell[];
  title?: string;
  colorScale?: 'red-green' | 'red-yellow-green' | 'blue-orange';
  format?: 'currency' | 'percent' | 'number' | 'compact';
  min?: number;
  max?: number;
  className?: string;
  onCellClick?: (rowId: string, colId: string, value: number) => void;
  onCellHover?: (rowId: string, colId: string, value: number) => void;
}

const colorScales = {
  'red-green': {
    negative: [220, 38, 38], // red-600
    neutral: [255, 255, 255], // white
    positive: [21, 128, 61], // green-700 (5.13:1 ✅ WCAG 2.1 AA Normal, was green-600 [22,163,74] 3.94:1 ❌ — PATCH 19+)
  },
  'red-yellow-green': {
    negative: [220, 38, 38],
    neutral: [234, 179, 8], // yellow-500
    positive: [21, 128, 61], // green-700 (PATCH 19+)
  },
  'blue-orange': {
    negative: [249, 115, 22], // orange-500
    neutral: [255, 255, 255],
    positive: [37, 99, 235], // blue-600
  },
};

function interpolateColor(
  value: number,
  min: number,
  max: number,
  scale: (typeof colorScales)['red-green']
): string {
  const range = max - min || 1;
  const t = Math.max(0, Math.min(1, (value - min) / range));

  let r: number, g: number, b: number;
  if (t < 0.5) {
    const localT = t * 2;
    r = scale.negative[0]! + (scale.neutral[0]! - scale.negative[0]!) * localT;
    g = scale.negative[1]! + (scale.neutral[1]! - scale.negative[1]!) * localT;
    b = scale.negative[2]! + (scale.neutral[2]! - scale.negative[2]!) * localT;
  } else {
    const localT = (t - 0.5) * 2;
    r = scale.neutral[0]! + (scale.positive[0]! - scale.neutral[0]!) * localT;
    g = scale.neutral[1]! + (scale.positive[1]! - scale.neutral[1]!) * localT;
    b = scale.neutral[2]! + (scale.positive[2]! - scale.neutral[2]!) * localT;
  }

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function formatNum(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'percent':
      return `${formatPercent(value, 1)}`;
    case 'compact':
      return formatCompact(value);
    default:
      return value.toLocaleString();
  }
}

export const HeatmapGrid = memo(function HeatmapGrid({
  rows,
  columns,
  cells,
  title,
  colorScale = 'red-green',
  format = 'number',
  min: explicitMin,
  max: explicitMax,
  className,
  onCellClick,
  onCellHover,
}: HeatmapGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string } | null>(null);

  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    cells.forEach((c) => map.set(`${c.rowId}:${c.colId}`, c));
    return map;
  }, [cells]);

  const { computedMin, computedMax } = useMemo(() => {
    const values = cells.map((c) => c.value);
    return {
      computedMin: explicitMin ?? Math.min(...values, 0),
      computedMax: explicitMax ?? Math.max(...values, 0),
    };
  }, [cells, explicitMin, explicitMax]);

  const scale = colorScales[colorScale];

  return (
    <div
      className={cn(
        'w-full p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm overflow-x-auto',
        className
      )}
    >
      {title && (
        <div className="mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
            {title}
          </h3>
        </div>
      )}

      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th
              className="text-left p-2 font-medium text-[var(--text-muted)] border-b border-[var(--border-subtle)]"
              scope="col"
            >
              Account
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="text-right p-2 font-medium text-[var(--text-muted)] border-b border-[var(--border-subtle)] whitespace-nowrap"
                scope="col"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td className="p-2 font-medium text-[var(--text-primary)] border-b border-[var(--border-subtle)] whitespace-nowrap">
                {row}
              </td>
              {columns.map((col) => {
                const cell = cellMap.get(`${row}:${col}`);
                const value = cell?.value ?? 0;
                const bgColor = interpolateColor(value, computedMin, computedMax, scale);
                const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;
                const textColor =
                  value > computedMax * 0.7 || value < computedMin * 0.7
                    ? 'text-white'
                    : 'text-[var(--text-primary)]';

                return (
                  <td
                    key={col}
                    className={cn(
                      'text-right p-2 font-medium tabular-nums border-b border-[var(--border-subtle)] transition-all cursor-pointer',
                      textColor,
                      isHovered && 'ring-2 ring-blue-400 ring-inset z-10 relative'
                    )}
                    style={{ backgroundColor: bgColor }}
                    onClick={() => onCellClick?.(row, col, value)}
                    onMouseEnter={() => {
                      setHoveredCell({ row, col });
                      onCellHover?.(row, col, value);
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    title={`${row} × ${col}: ${formatNum(value, format)}`}
                  >
                    {formatNum(value, format)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-xs text-[var(--text-muted)] mr-1">
          {formatNum(computedMin, format)}
        </span>
        <div
          className="h-3 w-32 rounded"
          style={{
            background: `linear-gradient(to right, ${interpolateColor(computedMin, computedMin, computedMax, scale)}, ${interpolateColor((computedMin + computedMax) / 2, computedMin, computedMax, scale)}, ${interpolateColor(computedMax, computedMin, computedMax, scale)})`,
          }}
        />
        <span className="text-xs text-[var(--text-muted)] ml-1">
          {formatNum(computedMax, format)}
        </span>
      </div>
    </div>
  );
});
