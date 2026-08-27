import type { SectorConfig } from './index';

export const energyConfig: SectorConfig = {
  id: 'energy',
  name: 'Energy / Utilities',
  description:
    'Energy metrics: reserve replacement, availability, CapEx per MW, TRIR safety, renewables mix; gross margin derived from classified GL.',
  defaultKPIs: [
    {
      id: 'reserve_replacement',
      label: 'Reserve Replacement Ratio',
      format: 'percent',
      target: 105,
    },
    {
      id: 'availability_factor',
      label: 'Plant Availability Factor',
      format: 'percent',
      target: 94,
    },
    {
      id: 'capex_per_mw',
      label: 'CapEx per MW',
      format: 'currency',
      target: 1200000,
      lowerIsBetter: true,
    },
    {
      id: 'safety_incident_rate',
      label: 'TRIR Safety Rate',
      format: 'number',
      target: 0.5,
      lowerIsBetter: true,
    },
    { id: 'renewable_mix', label: 'Renewable energy Mix', format: 'percent', target: 35 },
  ],
  enabledModules: ['energy', 'esg', 'capex', 'compliance'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'energy',
    'esg',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
