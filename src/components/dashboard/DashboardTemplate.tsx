import { useState, useRef, useCallback } from 'react';
import { LiveRegion } from '@/components/ui/LiveRegion';
import { KPICardEnhanced, type KPICardEnhancedProps } from './KPICardEnhanced';
import { TrafficLightBatch } from './TrafficLightIndicator';
import { TornadoChart, type TornadoVariable } from './TornadoChart';
import { HeatmapGrid } from './HeatmapGrid';
import { SankeyDiagram, type SankeyNode, type SankeyLink } from './SankeyDiagram';
import { ActivityFeed } from './ActivityFeed';
import { ComboChart, type ComboChartDataPoint } from './ComboChart';
import { DashboardGauge } from './GaugeChart';
import { cn } from '@/utils/cn';

export type DashboardType = 'cfo' | 'controller' | 'analyst';

export interface WidgetConfig {
  id: string;
  type: 'kpi' | 'traffic-light' | 'tornado' | 'heatmap' | 'sankey' | 'activity' | 'custom';
  title: string;
  span?: 1 | 2 | 3 | 4;
  props: Record<string, unknown>;
}

export interface DashboardTemplateProps {
  type: DashboardType;
  kpis?: KPICardEnhancedProps[];
  trafficItems?: Array<{ label: string; value: number; format?: string }>;
  tornadoVariables?: TornadoVariable[];
  heatmapData?: {
    rows: string[];
    columns: string[];
    cells: Array<{ rowId: string; colId: string; value: number }>;
  };
  sankeyData?: { nodes: SankeyNode[]; links: SankeyLink[] };
  activities?: Array<{ id: string; user: string; action: string; timestamp: string }>;
  className?: string;
  onKPIClick?: (index: number) => void;
  onCellClick?: (row: string, col: string, value: number) => void;
}

const mockKPIs: KPICardEnhancedProps[] = [
  {
    title: 'Total Revenue',
    value: 42500000,
    format: 'compact',
    variancePercent: 8.2,
    varianceAmount: 3200000,
    varianceType: 'favorable',
    priorYearValue: 39300000,
    budgetValue: 40000000,
    sparklineData: [38, 39, 40, 41, 40, 42, 42.5],
  },
  {
    title: 'EBITDA',
    value: 12800000,
    format: 'compact',
    variancePercent: -2.1,
    varianceAmount: -275000,
    varianceType: 'unfavorable',
    priorYearValue: 13075000,
    budgetValue: 13075000,
    sparklineData: [13, 13.2, 12.9, 13.1, 12.5, 12.7, 12.8],
  },
  {
    title: 'Cash Position',
    value: 8900000,
    format: 'compact',
    variancePercent: 15.3,
    varianceAmount: 1180000,
    varianceType: 'favorable',
    sparklineData: [7.5, 7.8, 8.0, 8.2, 8.5, 8.7, 8.9],
  },
  {
    title: 'Headcount',
    value: 342,
    format: 'number',
    variancePercent: 5.6,
    varianceAmount: 18,
    varianceType: 'neutral',
    budgetValue: 350,
    sparklineData: [320, 325, 330, 335, 338, 340, 342],
  },
];

const mockTrafficItems = [
  { label: 'Revenue Growth', value: 8.2, format: 'percent' as const },
  { label: 'Gross Margin', value: 62.5, format: 'percent' as const },
  { label: 'Operating Margin', value: 18.4, format: 'percent' as const },
  { label: 'Quick Ratio', value: 1.8, format: 'number' as const },
  { label: 'DSO', value: 42, format: 'number' as const },
  { label: 'Inventory Turns', value: 6.2, format: 'number' as const },
];

const mockTornado: TornadoVariable[] = [
  { name: 'Price', lowValue: 38000000, highValue: 47000000, baseValue: 42500000 },
  { name: 'Volume', lowValue: 39500000, highValue: 45500000, baseValue: 42500000 },
  { name: 'COGS %', lowValue: 40000000, highValue: 45000000, baseValue: 42500000 },
  { name: 'Headcount', lowValue: 41000000, highValue: 44000000, baseValue: 42500000 },
  { name: 'FX Rate', lowValue: 41500000, highValue: 43500000, baseValue: 42500000 },
];

const mockHeatmap = {
  rows: ['Revenue', 'COGS', 'Gross Margin', 'SG&A', 'R&D', 'EBITDA'],
  columns: ['Q1', 'Q2', 'Q3', 'Q4'],
  cells: [
    { rowId: 'Revenue', colId: 'Q1', value: 10.2 },
    { rowId: 'Revenue', colId: 'Q2', value: 10.8 },
    { rowId: 'Revenue', colId: 'Q3', value: 11.1 },
    { rowId: 'Revenue', colId: 'Q4', value: 10.4 },
    { rowId: 'COGS', colId: 'Q1', value: -3.8 },
    { rowId: 'COGS', colId: 'Q2', value: -4.0 },
    { rowId: 'COGS', colId: 'Q3', value: -4.2 },
    { rowId: 'COGS', colId: 'Q4', value: -3.9 },
    { rowId: 'Gross Margin', colId: 'Q1', value: 6.4 },
    { rowId: 'Gross Margin', colId: 'Q2', value: 6.8 },
    { rowId: 'Gross Margin', colId: 'Q3', value: 6.9 },
    { rowId: 'Gross Margin', colId: 'Q4', value: 6.5 },
    { rowId: 'SG&A', colId: 'Q1', value: -2.5 },
    { rowId: 'SG&A', colId: 'Q2', value: -2.6 },
    { rowId: 'SG&A', colId: 'Q3', value: -2.7 },
    { rowId: 'SG&A', colId: 'Q4', value: -2.5 },
    { rowId: 'R&D', colId: 'Q1', value: -1.8 },
    { rowId: 'R&D', colId: 'Q2', value: -1.9 },
    { rowId: 'R&D', colId: 'Q3', value: -2.0 },
    { rowId: 'R&D', colId: 'Q4', value: -1.9 },
    { rowId: 'EBITDA', colId: 'Q1', value: 2.1 },
    { rowId: 'EBITDA', colId: 'Q2', value: 2.3 },
    { rowId: 'EBITDA', colId: 'Q3', value: 2.2 },
    { rowId: 'EBITDA', colId: 'Q4', value: 2.1 },
  ],
};

const mockSankey = {
  nodes: [
    { id: 'revenue', label: 'Revenue', value: 42500000, color: '#3b82f6' },
    { id: 'cogs', label: 'COGS', value: -16100000, color: '#ef4444' },
    { id: 'gross', label: 'Gross Margin', value: 26400000, color: '#10b981' },
    { id: 'sga', label: 'SG&A', value: -10300000, color: '#f59e0b' },
    { id: 'rd', label: 'R&D', value: -7600000, color: '#8b5cf6' },
    { id: 'ebitda', label: 'EBITDA', value: 8500000, color: '#06b6d4' },
  ] as SankeyNode[],
  links: [
    { source: 'revenue', target: 'cogs', value: 16100000 },
    { source: 'revenue', target: 'gross', value: 26400000 },
    { source: 'gross', target: 'sga', value: 10300000 },
    { source: 'gross', target: 'rd', value: 7600000 },
    { source: 'gross', target: 'ebitda', value: 8500000 },
  ] as SankeyLink[],
};

const mockActivities = [
  { id: '1', user: 'J. Smith', action: 'Approved Q3 budget', timestamp: '2 hours ago' },
  { id: '2', user: 'M. Chen', action: 'Updated revenue forecast', timestamp: '4 hours ago' },
  { id: '3', user: 'S. Patel', action: 'Submitted variance report', timestamp: '6 hours ago' },
  { id: '4', user: 'A. Kim', action: 'Created new scenario', timestamp: '1 day ago' },
];

const mockComboData: ComboChartDataPoint[] = [
  { name: 'Jan', bar: 9800000, bar2: 9500000, line: 18.2, line2: 17.5 },
  { name: 'Feb', bar: 10200000, bar2: 9800000, line: 19.1, line2: 17.8 },
  { name: 'Mar', bar: 11100000, bar2: 10100000, line: 20.3, line2: 18.0 },
  { name: 'Apr', bar: 10800000, bar2: 10300000, line: 19.5, line2: 18.2 },
  { name: 'May', bar: 11500000, bar2: 10600000, line: 21.0, line2: 18.5 },
  { name: 'Jun', bar: 12200000, bar2: 10900000, line: 22.1, line2: 18.8 },
];

export function DashboardTemplate({
  type,
  kpis,
  trafficItems,
  tornadoVariables,
  heatmapData,
  sankeyData,
  activities,
  className,
  onKPIClick,
  onCellClick,
}: DashboardTemplateProps) {
  const [activeLayout, setActiveLayout] = useState<DashboardType>(type);
  // [Hera] a11y: tab refs + keyboard nav + screen reader announcement
  const [layoutAnnouncement, setLayoutAnnouncement] = useState<string>('');
  const cfoTabRef = useRef<HTMLButtonElement>(null);
  const controllerTabRef = useRef<HTMLButtonElement>(null);
  const analystTabRef = useRef<HTMLButtonElement>(null);
  const PERSONAS: ReadonlyArray<{ id: DashboardType; label: string; tabId: string; panelId: string; ref: React.RefObject<HTMLButtonElement | null> }> = [
    { id: 'cfo', label: 'CFO View', tabId: 'tab-cfo', panelId: 'panel-cfo', ref: cfoTabRef },
    { id: 'controller', label: 'Controller View', tabId: 'tab-controller', panelId: 'panel-controller', ref: controllerTabRef },
    { id: 'analyst', label: 'Analyst View', tabId: 'tab-analyst', panelId: 'panel-analyst', ref: analystTabRef },
  ];
  const handleLayoutChange = useCallback((next: DashboardType) => {
    setActiveLayout(next);
    const persona = PERSONAS.find((p) => p.id === next);
    if (persona) setLayoutAnnouncement(`Switched to ${persona.label}`);
  }, []);
  const onTabKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    let nextIdx = idx;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % PERSONAS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + PERSONAS.length) % PERSONAS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = PERSONAS.length - 1;
    const next = PERSONAS[nextIdx];
    if (next) {
      handleLayoutChange(next.id);
      next.ref.current?.focus();
    }
  }, [handleLayoutChange]);

  const dashboardKPIs = kpis ?? mockKPIs;
  const dashboardTraffic = trafficItems ?? mockTrafficItems;
  const dashboardTornado = tornadoVariables ?? mockTornado;
  const dashboardHeatmap = heatmapData ?? mockHeatmap;
  const dashboardSankey = sankeyData ?? mockSankey;
  const dashboardActivities = activities ?? mockActivities;

  return (
    <div className={cn('space-y-6', className)}>
      <div
        className="flex items-center gap-2"
        role="tablist"
        aria-label="Dashboard persona views"
      >
        {PERSONAS.map((p, idx) => {
          const isActive = activeLayout === p.id;
          return (
            <button
              key={p.id}
              ref={p.ref}
              id={p.tabId}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={p.panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleLayoutChange(p.id)}
              onKeyDown={(e) => onTabKeyDown(e, idx)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)]'
              )}
            >
              {p.label}
            </button>
          );
        })}
        <LiveRegion message={layoutAnnouncement} politeness="polite" />
      </div>

      {activeLayout === 'cfo' && (
        <section role="tabpanel" id="panel-cfo" aria-labelledby="tab-cfo" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardKPIs.map((kpi, idx) => (
              <KPICardEnhanced key={idx} {...kpi} onDrillDown={() => onKPIClick?.(idx)} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ComboChart
              data={mockComboData}
              title="Revenue & Margin Trend"
              formatValue={(v) => `$${(v / 1e6).toFixed(1)}M`}
              series={{
                barLabel: 'Actual',
                bar2Label: 'Budget',
                lineLabel: 'Gross Margin %',
              }}
              height={280}
            />
            <div className="grid grid-cols-2 gap-4">
              <DashboardGauge
                value={92}
                target={100}
                title="Revenue Target"
                subtitle="FY 2026"
                size={120}
              />
              <DashboardGauge
                value={78}
                target={100}
                title="EBITDA Target"
                subtitle="FY 2026"
                size={120}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SankeyDiagram
              nodes={dashboardSankey.nodes}
              links={dashboardSankey.links}
              title="Revenue Bridge"
              height={280}
            />
            <TrafficLightBatch
              items={dashboardTraffic.map((i) => ({
                label: i.label,
                value: i.value,
                format: i.format as 'currency' | 'percent' | 'number' | 'compact' | undefined,
              }))}
              thresholds={{
                green: { min: 5 },
                yellow: { min: 0 },
              }}
              direction="higher-is-better"
            />
          </div>
        </section>
      )}

      {activeLayout === 'controller' && (
        <section role="tabpanel" id="panel-controller" aria-labelledby="tab-controller" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardKPIs.slice(0, 4).map((kpi, idx) => (
              <KPICardEnhanced
                key={idx}
                {...kpi}
                target={kpi.budgetValue}
                onDrillDown={() => onKPIClick?.(idx)}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ComboChart
              data={mockComboData}
              title="Actual vs Budget — Revenue & Margin"
              formatValue={(v) => `$${(v / 1e6).toFixed(1)}M`}
              series={{
                barLabel: 'Actual',
                bar2Label: 'Budget',
                lineLabel: 'Gross Margin %',
              }}
              height={280}
            />
            <HeatmapGrid
              rows={dashboardHeatmap.rows}
              columns={dashboardHeatmap.columns}
              cells={dashboardHeatmap.cells}
              title="Variance Heatmap ($M)"
              colorScale="red-green"
              format="number"
              onCellClick={onCellClick}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="grid grid-cols-3 gap-4">
              <DashboardGauge
                value={92}
                target={100}
                title="Revenue"
                subtitle="vs plan"
                size={110}
              />
              <DashboardGauge
                value={85}
                target={100}
                title="OpEx"
                subtitle="vs budget"
                size={110}
              />
              <DashboardGauge
                value={68}
                target={100}
                title="Cash Flow"
                subtitle="vs forecast"
                size={110}
              />
            </div>
            <TrafficLightBatch
              items={dashboardTraffic.slice(0, 4).map((i) => ({
                label: i.label,
                value: i.value,
                format: i.format as 'currency' | 'percent' | 'number' | 'compact' | undefined,
              }))}
              thresholds={{ green: { min: 5 }, yellow: { min: 0 } }}
              direction="higher-is-better"
            />
          </div>
        </section>
      )}

      {activeLayout === 'analyst' && (
        <section role="tabpanel" id="panel-analyst" aria-labelledby="tab-analyst" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardKPIs.map((kpi, idx) => (
              <KPICardEnhanced key={idx} {...kpi} onDrillDown={() => onKPIClick?.(idx)} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ComboChart
              data={mockComboData}
              title="Revenue & Margin Deep Dive"
              formatValue={(v) => `$${(v / 1e6).toFixed(1)}M`}
              series={{
                barLabel: 'Actual',
                bar2Label: 'Budget',
                lineLabel: 'Gross Margin %',
                line2Label: 'Target Margin %',
              }}
              height={300}
            />
            <TornadoChart
              variables={dashboardTornado}
              title="Sensitivity Analysis — Revenue Impact"
              height={300}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HeatmapGrid
              rows={dashboardHeatmap.rows}
              columns={dashboardHeatmap.columns}
              cells={dashboardHeatmap.cells}
              title="Variance Heatmap ($M)"
              colorScale="red-green"
              format="number"
              onCellClick={onCellClick}
            />
            <SankeyDiagram
              nodes={dashboardSankey.nodes}
              links={dashboardSankey.links}
              title="Revenue Bridge"
              height={280}
            />
          </div>
          <ActivityFeed maxItems={dashboardActivities.length} />
        </section>
      )}
    </div>
  );
}
