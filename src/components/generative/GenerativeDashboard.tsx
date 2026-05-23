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
  Card: ({ title, children }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  ),
  Metric: ({ label, value, format = 'number', change }) => {
    const formattedValue =
      format === 'currency'
        ? `$${value.toLocaleString()}`
        : format === 'percent'
          ? `${value.toFixed(1)}%`
          : value.toLocaleString();
    return <KPIValue label={label} value={formattedValue} change={change} />;
  },
  Chart: ({ type, data, title }) => {
    const chartData = data.map((d: { label: string; value: number }) => ({
      label: d.label,
      value: d.value,
    }));
    switch (type) {
      case 'waterfall':
        return <WaterfallChart data={chartData} title={title} />;
      case 'variance':
        return <VarianceChart data={chartData} title={title} />;
      case 'sparkline':
        return <SparklineChart data={data.map((d: { value: number }) => d.value)} />;
      case 'gauge':
        return <GaugeChart value={data[0]?.value ?? 0} max={100} label={title} />;
      default:
        return (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Chart type: {type}
          </div>
        );
    }
  },
  Grid: ({ columns = 2, children }) => (
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
  return (
    <div className={className}>
      <Renderer spec={spec} registry={registry} />
    </div>
  );
}

export { catalog, registry };
