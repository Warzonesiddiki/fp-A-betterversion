import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

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

function CustomContent(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  name: string;
  size: number;
}) {
  const { x, y, width, height, index, name, size } = props;
  if (width < 30 || height < 20) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={COLORS[index % COLORS.length]}
        stroke="#fff"
        strokeWidth={2}
      />
      {width > 50 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 6}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
          >
            {size.toLocaleString()}
          </text>
        </>
      )}
    </g>
  );
}

export function TreemapChart({
  data,
  height = 400,
  ariaLabel = 'Treemap chart',
}: TreemapChartProps) {
  return (
    <div role="img" aria-label={ariaLabel} data-testid="treemap-chart">
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={data}
          dataKey="size"
          nameKey="name"
          content={<CustomContent x={0} y={0} width={0} height={0} index={0} name="" size={0} />}
        >
          <Tooltip formatter={(value: any, name: any) => [value.toLocaleString(), name]} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
