import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  WaterfallChart,
  VarianceChart,
  SparklineChart,
  TreemapChart,
  HeatmapChart,
  GaugeChart,
  ChartExportButton,
  type VarianceDataPoint,
} from '@/components/charts';

const waterfallData = [
  { name: 'Revenue', value: 500000 },
  { name: 'COGS', value: -200000 },
  { name: 'Gross Profit', value: 300000 },
  { name: 'OpEx', value: -150000 },
  { name: 'EBITDA', value: 150000 },
  { name: 'Depreciation', value: -30000 },
  { name: 'Net Income', value: 120000 },
];

const varianceData: VarianceDataPoint[] = [
  { name: 'Revenue', budget: 500000, actual: 520000 },
  { name: 'COGS', budget: 200000, actual: 195000 },
  { name: 'Marketing', budget: 80000, actual: 92000 },
  { name: 'R&D', budget: 120000, actual: 115000 },
  { name: 'Admin', budget: 60000, actual: 58000 },
];

const treemapData = [
  { name: 'North America', size: 450000 },
  { name: 'Europe', size: 320000 },
  { name: 'Asia Pacific', size: 280000 },
  { name: 'Latin America', size: 120000 },
  { name: 'Middle East', size: 80000 },
];

const heatmapData = Array.from({ length: 6 }, (_, y) =>
  Array.from({ length: 6 }, (_, x) => ({
    x: `Q${x + 1}`,
    y: `Region ${y + 1}`,
    value: Math.round(Math.random() * 100),
  }))
).flat();

export function ChartShowcasePage() {
  const waterfallRef = useRef<HTMLDivElement>(null!);
  const varianceRef = useRef<HTMLDivElement>(null!);
  const gaugeRef = useRef<HTMLDivElement>(null!);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chart Showcase</h1>
        <p className="text-muted-foreground">All 7 chart components with sample data and export</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div ref={waterfallRef}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Waterfall Chart</CardTitle>
              <ChartExportButton chartRef={waterfallRef} filename="waterfall" />
            </CardHeader>
            <CardContent>
              <WaterfallChart
                data={waterfallData}
                height={250}
                formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
              />
            </CardContent>
          </Card>
        </div>

        <div ref={varianceRef}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Variance Chart</CardTitle>
              <ChartExportButton chartRef={varianceRef} filename="variance" />
            </CardHeader>
            <CardContent>
              <VarianceChart data={varianceData} height={250} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sparkline Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                <SparklineChart
                  data={[100, 120, 115, 130, 145, 140, 160, 155, 170, 180]}
                  color="#10B981"
                  height={40}
                  width={120}
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Expenses</div>
                <SparklineChart
                  data={[80, 85, 90, 88, 95, 92, 98, 100, 105, 102]}
                  color="#EF4444"
                  height={40}
                  width={120}
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Margin</div>
                <SparklineChart
                  data={[20, 35, 25, 42, 50, 48, 62, 55, 65, 78]}
                  color="#3B82F6"
                  height={40}
                  width={120}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Treemap Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <TreemapChart
              data={treemapData}
              height={200}
              formatValue={(v) => `$${(v / 1000).toFixed(0)}K`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Heatmap Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapChart data={heatmapData} cellSize={40} formatValue={(v) => `${v}%`} />
          </CardContent>
        </Card>

        <div ref={gaugeRef}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Gauge Chart</CardTitle>
              <ChartExportButton chartRef={gaugeRef} filename="gauge" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <GaugeChart
                  value={78}
                  max={100}
                  target={80}
                  label="Revenue"
                  formatValue={(v) => `$${v}K`}
                />
                <GaugeChart value={92} max={100} target={90} label="Retention" />
                <GaugeChart value={65} max={100} target={75} label="Growth" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
