import type { SectorConfig } from './index';

export const logisticsConfig: SectorConfig = {
  id: 'logistics',
  name: 'Logistics & Supply Chain',
  description: 'Fleet management, transportation, and warehousing metrics',
  defaultKPIs: [
    { id: 'on_time_delivery', label: 'On-Time Delivery Rate', format: 'percent', target: 98 },
    { id: 'fleet_utilization', label: 'Fleet Utilization Rate', format: 'percent', target: 85 },
    { id: 'inventory_turnover', label: 'Inventory Turnover', format: 'number', target: 8.5 },
    {
      id: 'empty_miles_pct',
      label: 'Empty Miles Percentage',
      format: 'percent',
      target: 10,
      lowerIsBetter: true,
    },
    {
      id: 'safety_incident_rate',
      label: 'Safety Incident Rate',
      format: 'number',
      target: 0.02,
      lowerIsBetter: true,
    },
  ],
  enabledModules: ['logistics', 'fleet', 'warehouse', 'revenue', 'workforce'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'logistics',
    'fleet',
    'warehouse',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
