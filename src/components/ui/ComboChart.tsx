import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ComboBar {
  key: string;
  color?: string;
  name: string;
}
interface ComboLine {
  key: string;
  color?: string;
  name: string;
}

interface ComboChartProps {
  data: Record<string, unknown>[];
  bars?: ComboBar[];
  lines?: ComboLine[];
  xAxisKey?: string;
  xKey?: string;
  yKeys?: Array<{ key: string; color: string; name: string }>;
  height?: number;
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onClick?: (data: Record<string, unknown>) => void;
}

export function ComboChart({
  data,
  bars: barsProp,
  lines: linesProp,
  xAxisKey,
  xKey,
  yKeys,
  height = 300,
  title,
  className,
  loading = false,
  error,
  onClick,
}: ComboChartProps) {
  const effectiveXKey = xAxisKey ?? xKey ?? '';
  const bars: ComboBar[] =
    barsProp ?? (yKeys ? yKeys.map((y) => ({ key: y.key, color: y.color, name: y.name })) : []);
  const lines: ComboLine[] = linesProp ?? [];
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-48 text-red-600 text-sm">{error}</div>
      </div>
    );
  }
  if (!data || data.length === 0)
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-300">
        No data
      </div>
    );

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          onClick={
            onClick
              ? (e) => {
                  const p = e as unknown as { activePayload?: Array<{ payload?: unknown }> };
                  if (p?.activePayload?.[0]?.payload)
                    onClick(p.activePayload[0]!.payload as Record<string, unknown>);
                }
              : undefined
          }
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey={effectiveXKey} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {bars.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.name}
              fill={b.color || '#3B82F6'}
              radius={[2, 2, 0, 0]}
              maxBarSize={24}
            />
          ))}
          {lines.map((l) => (
            <Line
              key={l.key}
              dataKey={l.key}
              name={l.name}
              stroke={l.color || '#10B981'}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
