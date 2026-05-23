import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
}
function formatPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}
function formatNumber(v: number): string {
  return new Intl.NumberFormat('en-US').format(v);
}

function DashboardCard({
  title,
  value,
  format,
}: {
  title: string;
  value: number;
  format?: string;
}) {
  const fmt =
    format === 'currency' ? formatCurrency : format === 'percent' ? formatPercent : formatNumber;
  return (
    <Card>
      <CardContent className="p-4">
        <KPIValue label={title} value={fmt(value)} />
      </CardContent>
    </Card>
  );
}

function DashboardMetric({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend?: string;
}) {
  return (
    <div className="text-center p-2">
      <div className="text-2xl font-bold">{formatCurrency(value)}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {trend && (
        <div
          className={`text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-[var(--text-muted)]'}`}
        >
          {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192'}
        </div>
      )}
    </div>
  );
}

function DashboardChart({
  type,
  data,
  title,
}: {
  type: string;
  data: Array<{ name: string; value: number }>;
  title?: string;
}) {
  if (!data?.length) return null;
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          ) : type === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area dataKey="value" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DashboardTable({
  columns,
  data,
}: {
  columns: Array<{ key: string; label: string }>;
  data: Array<Record<string, unknown>>;
}) {
  if (!columns?.length || !data?.length) return null;
  return (
    <Card>
      <CardContent className="p-0 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-3 py-2 text-xs font-medium text-slate-400"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    {String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function KPIRow({ items }: { items: Array<{ label: string; value: number; trend?: string }> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <DashboardMetric key={i} {...item} />
      ))}
    </div>
  );
}

const componentMap: Record<string, React.ComponentType<Record<string, unknown>>> = {
  Card: DashboardCard as React.ComponentType<Record<string, unknown>>,
  Metric: DashboardMetric as React.ComponentType<Record<string, unknown>>,
  Chart: DashboardChart as React.ComponentType<Record<string, unknown>>,
  Table: DashboardTable as React.ComponentType<Record<string, unknown>>,
  KPIRow: KPIRow as React.ComponentType<Record<string, unknown>>,
};

interface SpecElement {
  type: string;
  props: Record<string, unknown>;
  children?: SpecElement[];
}

interface DashboardSpec {
  root: string;
  elements: Record<string, SpecElement>;
}

function renderElement(spec: DashboardSpec, elementId: string): React.ReactNode {
  const element = spec.elements[elementId];
  if (!element) return null;
  const Component = componentMap[element.type];
  if (!Component) return null;
  const childNodes = element.children?.map((child, i) => {
    const childId = `${elementId}-${i}`;
    return <React.Fragment key={childId}>{renderElement(spec, childId)}</React.Fragment>;
  });
  return <Component {...element.props}>{childNodes}</Component>;
}

import React from 'react';

export interface GenerativeDashboardProps {
  spec: DashboardSpec;
  className?: string;
}

export function GenerativeDashboard({ spec, className = '' }: GenerativeDashboardProps) {
  return <div className={`space-y-4 ${className}`}>{renderElement(spec, spec.root)}</div>;
}

export function nlqResultToSpec(
  data: Array<{ label: string; value: number }>,
  intent: string,
  title?: string
): DashboardSpec {
  if (intent === 'kpi' && data.length <= 4) {
    return {
      root: 'kpis',
      elements: {
        kpis: {
          type: 'KPIRow',
          props: { items: data.map((d) => ({ label: d.label, value: d.value })) },
          children: [],
        },
      },
    };
  }

  if (intent === 'table') {
    return {
      root: 'table',
      elements: {
        table: {
          type: 'Table',
          props: {
            columns: [
              { key: 'label', label: 'Label' },
              { key: 'value', label: 'Value' },
            ],
            data: data.map((d) => ({ label: d.label, value: d.value })),
          },
          children: [],
        },
      },
    };
  }

  return {
    root: 'chart',
    elements: {
      chart: {
        type: 'Chart',
        props: {
          type: 'bar',
          data: data.slice(0, 15).map((d) => ({ name: d.label, value: d.value })),
          title: title || 'Query Result',
        },
        children: [],
      },
    },
  };
}
