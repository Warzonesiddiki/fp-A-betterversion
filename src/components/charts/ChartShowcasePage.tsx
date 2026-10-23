import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { WaterfallChart } from './WaterfallChart';
import { VarianceChart } from './VarianceChart';
import { SparklineChart } from './SparklineChart';
import { TreemapChart } from './TreemapChart';
import { HeatmapChart } from './HeatmapChart';
import { GaugeChart } from './GaugeChart';
import { ChartExportButton } from './ChartExportButton';

const waterfallData = [
  { name: 'Revenue', value: 500000 },
  { name: 'COGS', value: -200000 },
  { name: 'Gross Profit', value: 300000 },
  { name: 'OpEx', value: -150000 },
  { name: 'EBITDA', value: 150000 },
  { name: 'Tax', value: -30000 },
  { name: 'Net Income', value: 120000 },
];

const varianceData = [
  { name: 'Revenue', budget: 400000, actual: 450000 },
  { name: 'COGS', budget: 160000, actual: 170000 },
  { name: 'Marketing', budget: 50000, actual: 45000 },
  { name: 'R&D', budget: 80000, actual: 90000 },
  { name: 'Admin', budget: 30000, actual: 28000 },
];

const sparklineData = [100, 120, 115, 130, 125, 140, 135, 150, 145, 160, 155, 170];

const treemapData = [
  { name: 'Technology', size: 35 },
  { name: 'Healthcare', size: 25 },
  { name: 'Finance', size: 20 },
  { name: 'Energy', size: 12 },
  { name: 'Consumer', size: 8 },
];

const heatmapData = [
  { x: 'Jan', y: 'Revenue', value: 100 },
  { x: 'Feb', y: 'Revenue', value: 120 },
  { x: 'Mar', y: 'Revenue', value: 110 },
  { x: 'Jan', y: 'Expenses', value: 80 },
  { x: 'Feb', y: 'Expenses', value: 90 },
  { x: 'Mar', y: 'Expenses', value: 85 },
];

export function ChartShowcasePage() {
  const waterfallRef = useRef<HTMLDivElement>(null);
  const varianceRef = useRef<HTMLDivElement>(null);
  const sparklineRef = useRef<HTMLDivElement>(null);
  const treemapRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);

  const charts = [
    {
      title: 'Waterfall Chart',
      ref: waterfallRef,
      component: <WaterfallChart data={waterfallData} height={300} />,
    },
    {
      title: 'Variance Chart',
      ref: varianceRef,
      component: <VarianceChart data={varianceData} height={300} />,
    },
    {
      title: 'Sparkline Chart',
      ref: sparklineRef,
      component: <SparklineChart data={sparklineData} height={100} />,
    },
    {
      title: 'Treemap Chart',
      ref: treemapRef,
      component: <TreemapChart data={treemapData} height={300} />,
    },
    {
      title: 'Heatmap Chart',
      ref: heatmapRef,
      component: <HeatmapChart data={heatmapData} />,
    },
    {
      title: 'Gauge Chart',
      ref: gaugeRef,
      component: <GaugeChart value={75} max={100} target={80} label="Revenue Target" />,
    },
  ];

  const refs = [waterfallRef, varianceRef, sparklineRef, treemapRef, heatmapRef, gaugeRef];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chart Components</h1>
        <p className="text-muted-foreground">
          All 6 chart types with sample data. Export any chart as SVG or PNG.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charts.map((chart, i) => (
          <Card key={chart.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{chart.title}</CardTitle>
              <ChartExportButton
                chartRef={refs[i]!}
                filename={chart.title.toLowerCase().replace(/\s/g, '-')}
              />
            </CardHeader>
            <CardContent ref={refs[i]}>{chart.component}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
