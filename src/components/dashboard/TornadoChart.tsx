import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/utils/cn';

export interface TornadoVariable {
  name: string;
  lowValue: number;
  highValue: number;
  baseValue?: number;
}

export interface TornadoChartProps {
  variables: TornadoVariable[];
  baseCase?: number;
  title?: string;
  height?: number;
  currency?: string;
  className?: string;
  onVariableClick?: (variable: TornadoVariable) => void;
}

interface ChartDataItem {
  name: string;
  lowDelta: number;
  highDelta: number;
  absMax: number;
  lowValue: number;
  highValue: number;
  baseValue: number;
}

export function TornadoChart({
  variables,
  baseCase,
  title,
  height = 300,
  className,
  onVariableClick,
}: TornadoChartProps) {
  const base = baseCase ?? 0;

  const chartData = useMemo<ChartDataItem[]>(() => {
    const items = variables.map((v) => {
      const bv = v.baseValue ?? base;
      const lowDelta = v.lowValue - bv;
      const highDelta = v.highValue - bv;
      return {
        name: v.name,
        lowDelta,
        highDelta,
        absMax: Math.max(Math.abs(lowDelta), Math.abs(highDelta)),
        lowValue: v.lowValue,
        highValue: v.highValue,
        baseValue: bv,
      };
    });
    return items.sort((a, b) => b.absMax - a.absMax);
  }, [variables, base]);

  const maxAbs = Math.max(...chartData.map((d) => d.absMax), 1);

  const formatCurrency = (v: number) => {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toFixed(0);
  };

  return (
    <div
      className={cn(
        'w-full flex flex-col p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm',
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
            {title}
          </h3>
        </div>
      )}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              domain={[-maxAbs, maxAbs]}
              tickFormatter={formatCurrency}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={75}
              tick={{ fontSize: 11, fontWeight: 500, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as ChartDataItem;
                return (
                  <div className="bg-[var(--bg-surface)] p-3 border border-[var(--border-subtle)] shadow-xl rounded-lg text-xs">
                    <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">{d.name}</p>
                    <p className="text-[var(--text-muted)]">
                      Base: <span className="font-semibold">{formatCurrency(d.baseValue)}</span>
                    </p>
                    <p className="fin-positive">
                      High: <span className="font-semibold">{formatCurrency(d.highValue)}</span>
                      <span className="text-gray-400 dark:text-gray-500 ml-1">
                        ({d.highDelta >= 0 ? '+' : ''}
                        {formatCurrency(d.highDelta)})
                      </span>
                    </p>
                    <p className="fin-negative">
                      Low: <span className="font-semibold">{formatCurrency(d.lowValue)}</span>
                      <span className="text-gray-400 dark:text-gray-500 ml-1">
                        ({d.lowDelta >= 0 ? '+' : ''}
                        {formatCurrency(d.lowDelta)})
                      </span>
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine x={0} stroke="#475569" strokeWidth={2} />
            <Bar
              dataKey="lowDelta"
              stackId="tornado"
              isAnimationActive={false}
              onClick={(data) => {
                const variable = variables.find((v) => v.name === data.name);
                if (variable && onVariableClick) onVariableClick(variable);
              }}
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill="#ef4444" opacity={0.8} />
              ))}
            </Bar>
            <Bar
              dataKey="highDelta"
              stackId="tornado"
              isAnimationActive={false}
              onClick={(data) => {
                const variable = variables.find((v) => v.name === data.name);
                if (variable && onVariableClick) onVariableClick(variable);
              }}
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill="#22c55e" opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded bg-red-500 opacity-80" />
          <span>Downside</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-4 bg-gray-600" />
          <span>Base case</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded bg-green-500 opacity-80" />
          <span>Upside</span>
        </div>
      </div>
    </div>
  );
}
