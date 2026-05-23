/**
 * Feature flags for FinPlan Pro
 * Toggle features on/off without code changes
 */

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  roles?: string[];
}

const flags: Record<string, FeatureFlag> = {
  'nlq-chat': {
    key: 'nlq-chat',
    name: 'NLQ Chat',
    description: 'Natural Language Query chat interface',
    enabled: true,
  },
  'three-statement': {
    key: 'three-statement',
    name: '3-Statement Model',
    description: 'Integrated P&L + BS + CF',
    enabled: true,
  },
  'plugin-system': {
    key: 'plugin-system',
    name: 'Plugin System',
    description: 'Extensible plugin architecture',
    enabled: true,
    roles: ['admin'],
  },
  'template-gallery': {
    key: 'template-gallery',
    name: 'Template Gallery',
    description: 'Pre-built budget/forecast/report templates',
    enabled: true,
  },
  'chart-export': {
    key: 'chart-export',
    name: 'Chart Export',
    description: 'SVG/PNG export for charts',
    enabled: true,
  },
  'what-if-sliders': {
    key: 'what-if-sliders',
    name: 'What-If Sliders',
    description: 'Interactive what-if analysis',
    enabled: true,
  },
  'zero-based-budget': {
    key: 'zero-based-budget',
    name: 'Zero-Based Budgeting',
    description: 'Build budget from zero each period',
    enabled: true,
  },
  'connector-framework': {
    key: 'connector-framework',
    name: 'Connector Framework',
    description: 'ERP connectors (QuickBooks, NetSuite)',
    enabled: true,
    roles: ['admin', 'manager'],
  },
  'virtual-scrolling': {
    key: 'virtual-scrolling',
    name: 'Virtual Scrolling',
    description: 'Virtual scrolling for large tables',
    enabled: true,
  },
  'generative-dashboard': {
    key: 'generative-dashboard',
    name: 'Generative Dashboard',
    description: 'AI-generated dashboards from NLQ results',
    enabled: true,
  },
};

export function isFeatureEnabled(flagKey: string, userRole?: string): boolean {
  const flag = flags[flagKey];
  if (!flag) return false;
  if (!flag.enabled) return false;
  if (flag.roles && userRole && !flag.roles.includes(userRole)) return false;
  return true;
}

export function getFlag(flagKey: string): FeatureFlag | undefined {
  return flags[flagKey];
}

export function getAllFlags(): FeatureFlag[] {
  return Object.values(flags);
}

export function setFlagEnabled(flagKey: string, enabled: boolean): void {
  if (flags[flagKey]) {
    flags[flagKey].enabled = enabled;
  }
}
