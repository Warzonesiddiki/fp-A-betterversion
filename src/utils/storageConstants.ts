export const DB_NAME = 'finplan-pro';
export const DB_VERSION = 1;

export const PERSIST_KEYS = {
  AUTH: 'auth-store',
  UI: 'ui-store',
  BUDGET: 'budget-store',
  FORECAST: 'forecast-store',
  VARIANCE: 'variance-store',
  SCENARIO: 'scenario-store',
  REPORT: 'report-store',
  DATA: 'data-store',
  GL: 'gl-store',
  ANALYTICS: 'analytics-store',
  COLLABORATION: 'collaboration-store',
  NOTIFICATION: 'notification-store',
  SETTINGS: 'settings-store',
} as const;

export const BACKUP_PREFIX = 'finplan-pro-backup';
export const AUTO_BACKUP_MAX = 5;
