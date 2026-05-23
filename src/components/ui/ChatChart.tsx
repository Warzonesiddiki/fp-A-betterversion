import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { NLQResult } from '@/engines/NLQEngine';

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
];

interface ChatChartProps {
  result: NLQResult;
  height?: number;
}

export function ChatChart({ result, height = 240 }: ChatChartProps) {
  const { data, chartConfig, query } = result;

  const chartData = useMemo(() => {
    return data.slice(0, 20).map((dp) => ({
      name: dp.label,
      value: dp.value,
      dimension: dp.dimension || dp.label,
    }));
  }, [data]);

  const formatValue = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  };

  if (!chartConfig || chartData.length === 0) return null;

  const chartType = chartConfig.type;

  return (
    <div
      className="mt-3 rounded-xl border bg-background p-3"
      role="img"
      aria-label={chartConfig.title}
    >
      <p className="mb-2 text-xs font-medium text-muted-foreground">{chartConfig.title}</p>

      {chartType === 'pie' ? (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={height * 0.35}
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: any) => formatValue(v)} />
          </PieChart>
        </ResponsiveContainer>
      ) : chartType === 'line' ? (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => formatValue(v)} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : chartType === 'area' ? (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => formatValue(v)} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={COLORS[0]}
              fill={COLORS[0]}
              fillOpacity={0.15}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatValue} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => formatValue(v)} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {query.intent === 'comparison' && data.length >= 2 && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Legend
            payload={chartData.slice(0, 6).map((d, i) => ({
              value: d.name,
              type: 'square' as const,
              color: COLORS[i % COLORS.length],
            }))}
          />
        </div>
      )}
    </div>
  );
}
