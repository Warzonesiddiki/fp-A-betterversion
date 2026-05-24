import { describe, it, expect } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  PERSIST_KEYS,
  BACKUP_PREFIX,
  AUTO_BACKUP_MAX,
} from '../storageConstants';

describe('storageConstants', () => {
  it('DB_NAME is set', () => {
    expect(DB_NAME).toBe('finplan-pro');
  });

  it('DB_VERSION is 1', () => {
    expect(DB_VERSION).toBe(1);
  });

  it('PERSIST_KEYS contains all store keys', () => {
    const keys = Object.values(PERSIST_KEYS);
    expect(keys).toContain('auth-store');
    expect(keys).toContain('ui-store');
    expect(keys).toContain('budget-store');
    expect(keys).toContain('forecast-store');
    expect(keys).toContain('variance-store');
    expect(keys).toContain('scenario-store');
    expect(keys).toContain('report-store');
    expect(keys).toContain('data-store');
    expect(keys).toContain('gl-store');
    expect(keys).toContain('analytics-store');
    expect(keys).toContain('collaboration-store');
    expect(keys).toContain('notification-store');
    expect(keys).toContain('settings-store');
    expect(keys.length).toBe(13);
  });

  it('BACKUP_PREFIX is set', () => {
    expect(BACKUP_PREFIX).toBe('finplan-pro-backup');
  });

  it('AUTO_BACKUP_MAX is 5', () => {
    expect(AUTO_BACKUP_MAX).toBe(5);
  });
});
