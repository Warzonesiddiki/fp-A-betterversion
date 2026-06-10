import { defineCatalog, defineRegistry } from '@json-render/core';
import { Renderer } from '@json-render/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { WaterfallChart } from '@/components/charts/WaterfallChart';
import { VarianceChart } from '@/components/charts/VarianceChart';
import { SparklineChart } from '@/components/charts/SparklineChart';
import { GaugeChart } from '@/components/charts/GaugeChart';

// Define what AI can use
const catalog = defineCatalog({
  Card: {
    props: {
      title: { type: 'string', description: 'Card title' },
      children: { type: 'array', description: 'Card content' },
    },
  },
  Metric: {
    props: {
      label: { type: 'string', description: 'Metric label' },
      value: { type: 'number', description: 'Metric value' },
      format: {
        type: 'string',
        enum: ['currency', 'percent', 'number'],
        description: 'Value format',
      },
      change: { type: 'number', description: 'Change percentage' },
    },
  },
  Chart: {
    props: {
      type: {
        type: 'string',
        enum: ['bar', 'line', 'pie', 'area', 'waterfall', 'variance', 'sparkline', 'gauge'],
        description: 'Chart type',
      },
      data: { type: 'array', description: 'Chart data points' },
      title: { type: 'string', description: 'Chart title' },
    },
  },
  Grid: {
    props: {
      columns: { type: 'number', description: 'Number of columns (1-4)' },
      children: { type: 'array', description: 'Grid items' },
    },
  },
});

// Define rendering implementations
const registry = defineRegistry({
  Card: ({ title, children }: { title?: string; children?: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  ),
  Metric: ({
    label,
    value,
    format = 'number',
    change,
  }: {
    label?: string;
    value?: number;
    format?: string;
    change?: number;
  }) => {
    const numValue = value ?? 0;
    const formattedValue =
      format === 'currency'
        ? `$${numValue.toLocaleString()}`
        : format === 'percent'
          ? `${numValue.toFixed(1)}%`
          : numValue.toLocaleString();
    return <KPIValue label={label ?? ''} value={formattedValue} change={change} />;
  },
  Chart: ({
    type,
    data,
    title,
  }: {
    type?: string;
    data?: Array<Record<string, unknown>>;
    title?: string;
  }) => {
    switch (type) {
      case 'waterfall':
        return (
          <WaterfallChart
            data={(data ?? []).map((d) => ({
              name: String(d.name ?? d.label ?? ''),
              value: Number(d.value ?? 0),
            }))}
          />
        );
      case 'variance':
        return (
          <VarianceChart
            data={(data ?? []).map((d) => ({
              name: String(d.name ?? d.label ?? ''),
              budget: Number(d.budget ?? 0),
              actual: Number(d.actual ?? 0),
            }))}
          />
        );
      case 'sparkline':
        return <SparklineChart data={(data ?? []).map((d) => Number(d.value ?? 0))} />;
      case 'gauge':
        return <GaugeChart value={Number(data?.[0]?.value ?? 0)} max={100} label={title} />;
      default:
        return (
          <div
            className="h-48 flex items-center justify-center text-muted-foreground"
            role="region"
            aria-label="GenerativeDashboard"
          >
            Chart type: {type}
          </div>
        );
    }
  },
  Grid: ({ columns = 2, children }: { columns?: number; children?: React.ReactNode }) => (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${Math.min(columns, 4)}, 1fr)` }}
    >
      {children}
    </div>
  ),
});

interface GenerativeDashboardProps {
  spec: Record<string, unknown>;
  className?: string;
}

export function GenerativeDashboard({ spec, className = '' }: GenerativeDashboardProps) {
  const RendererComponent = Renderer as unknown as React.ComponentType<{
    spec: Record<string, unknown>;
    registry: unknown;
  }>;
  return (
    <div className={className}>
      <RendererComponent spec={spec} registry={registry} />
    </div>
  );
}

export { catalog, registry };
