import type { SectorConfig } from './index';

export const agricultureConfig: SectorConfig = {
  id: 'agriculture',
  name: 'Agriculture',
  description:
    'Agriculture: posted revenue, costs, margin and labor share from classified GL; agronomy and equipment KPI targets await operational feeds.',
  defaultKPIs: [
    {
      id: 'cost-per-unit',
      label: 'Cost per Unit',
      format: 'currency',
      target: 100,
      lowerIsBetter: true,
    },
    { id: 'gross-margin', label: 'Gross Margin', format: 'percent', target: 35 },
    {
      id: 'water-usage',
      label: 'Water Usage (m3)',
      format: 'number',
      target: 5000,
      lowerIsBetter: true,
    },
    { id: 'labor-cost', label: 'Labor Cost %', format: 'percent', target: 25 },
    { id: 'equipment-utilization', label: 'Equipment Utilization', format: 'percent', target: 80 },
  ],
  enabledModules: ['data', 'budgets', 'forecasts', 'reporting', 'consolidation'],
  sidebarOrder: [
    'dashboard',
    'data',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'consolidation',
    'cash',
    'capex',
    'settings',
  ],
  defaultCurrency: 'USD',
};
