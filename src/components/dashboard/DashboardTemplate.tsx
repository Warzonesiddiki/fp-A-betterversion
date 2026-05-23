import { useState, useMemo, useCallback } from 'react';
import { KPICardEnhanced, type KPICardEnhancedProps } from './KPICardEnhanced';
import { TrafficLightBatch } from './TrafficLightIndicator';
import { TornadoChart, type TornadoVariable } from './TornadoChart';
import { HeatmapGrid } from './HeatmapGrid';
import { SankeyDiagram, type SankeyNode, type SankeyLink } from './SankeyDiagram';
import { ActivityFeed } from './ActivityFeed';
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

  const dashboardKPIs = kpis ?? mockKPIs;
  const dashboardTraffic = trafficItems ?? mockTrafficItems;
  const dashboardTornado = tornadoVariables ?? mockTornado;
  const dashboardHeatmap = heatmapData ?? mockHeatmap;
  const dashboardSankey = sankeyData ?? mockSankey;
  const dashboardActivities = activities ?? mockActivities;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-2">
        {(['cfo', 'controller', 'analyst'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveLayout(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              activeLayout === t
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)]'
            )}
          >
            {t === 'cfo' ? 'CFO View' : t === 'controller' ? 'Controller View' : 'Analyst View'}
          </button>
        ))}
      </div>

      {activeLayout === 'cfo' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardKPIs.map((kpi, idx) => (
              <KPICardEnhanced key={idx} {...kpi} onDrillDown={() => onKPIClick?.(idx)} />
            ))}
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
        </>
      )}

      {activeLayout === 'controller' && (
        <>
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
            <HeatmapGrid
              rows={dashboardHeatmap.rows}
              columns={dashboardHeatmap.columns}
              cells={dashboardHeatmap.cells}
              title="Variance Heatmap ($M)"
              colorScale="red-green"
              format="number"
              onCellClick={onCellClick}
            />
            <div className="space-y-4">
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
          </div>
        </>
      )}

      {activeLayout === 'analyst' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardKPIs.map((kpi, idx) => (
              <KPICardEnhanced key={idx} {...kpi} onDrillDown={() => onKPIClick?.(idx)} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4">
            <TornadoChart
              variables={dashboardTornado}
              title="Sensitivity Analysis — Revenue Impact"
              height={280}
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
          <ActivityFeed activities={dashboardActivities} />
        </>
      )}
    </div>
  );
}
