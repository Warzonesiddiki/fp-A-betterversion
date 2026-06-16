import { useMemo } from 'react';

export interface HeatmapDataPoint {
  x: string;
  y: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapDataPoint[];
  cellSize?: number;
  formatValue?: (v: number) => string;
  colorScale?: [string, string];
  ariaLabel?: string;
  onClick?: (dataPoint: HeatmapDataPoint) => void;
}

export function HeatmapChart({
  data = [],
  cellSize = 40,
  formatValue = (v) => v.toFixed(1),
  colorScale = ['#EFF6FF', '#1D4ED8'],
  ariaLabel = 'Heatmap chart',
}: HeatmapChartProps) {
  const { xLabels, yLabels, grid, min, max } = useMemo(() => {
    const xs = [...new Set(data.map((d) => d.x))];
    const ys = [...new Set(data.map((d) => d.y))];
    const map = new Map<string, number>();
    data.forEach((d) => map.set(`${d.x}:${d.y}`, d.value));
    const values = data.map((d) => d.value);
    return {
      xLabels: xs,
      yLabels: ys,
      grid: ys.map((y) => xs.map((x) => map.get(`${x}:${y}`) ?? 0)),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data]);

  const getColor = (value: number) => {
    if (max === min) return colorScale[0];
    const ratio = (value - min) / (max - min);
    const r1 = parseInt(colorScale[0]!.slice(1, 3), 16);
    const g1 = parseInt(colorScale[0]!.slice(3, 5), 16);
    const b1 = parseInt(colorScale[0]!.slice(5, 7), 16);
    const r2 = parseInt(colorScale[1]!.slice(1, 3), 16);
    const g2 = parseInt(colorScale[1]!.slice(3, 5), 16);
    const b2 = parseInt(colorScale[1]!.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    return `rgb(${r},${g},${b})`;
  };

  const getTextColor = (value: number) => {
    const ratio = max === min ? 0 : (value - min) / (max - min);
    return ratio > 0.5 ? '#fff' : '#111';
  };

  return (
    <div role="img" aria-label={ariaLabel} data-testid="heatmap-chart" className="overflow-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="p-1" scope="col"></th>
            {xLabels.map((x) => (
              <th
                key={x}
                className="p-1 text-xs text-center font-medium"
                style={{ width: cellSize }}
                scope="col"
              >
                {x}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yLabels.map((y, yi) => (
            <tr key={y}>
              <td className="p-1 text-xs font-medium pr-2">{y}</td>
              {grid[yi]!.map((value, xi) => (
                <td
                  key={xi}
                  className="text-center text-xs font-mono"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: getColor(value),
                    color: getTextColor(value),
                  }}
                  title={`${y} / ${xLabels[xi]}: ${formatValue(value)}`}
                >
                  {formatValue(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
