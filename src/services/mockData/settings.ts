import type { CalendarType } from '@/types';

export const mockOrganizationSettings = {
  name: 'FinPlan Pro Inc.',
  fiscalYear: 2024,
  fiscalYearStart: '2024-01-01',
  calendarType: 'Standard' as CalendarType,
  baseCurrency: 'USD',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  decimalPlaces: 2,
};

export const mockOrganizationProfiles = [
  {
    id: 'org-001',
    name: 'FinPlan Pro Global HQ',
    industry: 'Technology',
    taxId: 'TX-998877',
    address: '123 Wall St, New York, NY 10005',
    isPrimary: true,
  },
  {
    id: 'org-002',
    name: 'FinPlan Pro EMEA',
    industry: 'Technology',
    taxId: 'EU-445566',
    address: '45 Canary Wharf, London, UK',
    isPrimary: false,
  },
  {
    id: 'org-003',
    name: 'FinPlan Pro APAC',
    industry: 'Technology',
    taxId: 'AP-112233',
    address: '88 Marina Bay, Singapore',
    isPrimary: false,
  },
];

export const mockUserPreferences = {
  theme: 'dark',
  density: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
  sidebarCollapsed: false,
  language: 'en-US',
  notifications: {
    email: true,
    desktop: true,
    approvalRequests: true,
    mentions: true,
    deadlines: true,
  },
  defaultExportFormat: 'excel',
  showGridLines: true,
  enableAnimations: true,
};

export const mockFeatureFlags = {
  enableScenarioModeling: true,
  enableMultiCurrency: true,
  enableConsolidation: true,
  enableSaaSMetrics: true,
  enableAdvancedTax: false,
  enableCustomFieldEngine: true,
  enableExcelShortcuts: true,
  enableDrillDown: true,
  enableRealTimeCollaboration: true,
  enableSandboxMode: true,
};

export const mockExportOptions = [
  {
    id: 'exp-001',
    name: 'Standard Board Pack',
    format: 'pdf',
    includeCharts: true,
    includeTables: true,
  },
  { id: 'exp-002', name: 'Raw GL Data', format: 'csv', includeCharts: false, includeTables: true },
  {
    id: 'exp-003',
    name: 'Working Budget',
    format: 'excel',
    includeCharts: true,
    includeTables: true,
  },
  {
    id: 'exp-004',
    name: 'Scenario Comparison',
    format: 'pdf',
    includeCharts: true,
    includeTables: false,
  },
];
