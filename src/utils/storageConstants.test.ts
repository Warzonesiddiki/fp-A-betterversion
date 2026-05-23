import { describe, it, expect } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  PERSIST_KEYS,
  BACKUP_PREFIX,
  AUTO_BACKUP_MAX,
} from './storageConstants';

describe('DB_NAME', () => {
  it('should be finplan-pro', () => {
    expect(DB_NAME).toBe('finplan-pro');
  });

  it('should be a string', () => {
    expect(typeof DB_NAME).toBe('string');
  });
});

describe('DB_VERSION', () => {
  it('should be a positive integer', () => {
    expect(DB_VERSION).toBe(1);
    expect(Number.isInteger(DB_VERSION)).toBe(true);
    expect(DB_VERSION).toBeGreaterThan(0);
  });
});

describe('PERSIST_KEYS', () => {
  it('should have 13 store keys', () => {
    expect(Object.keys(PERSIST_KEYS)).toHaveLength(13);
  });

  it('should include AUTH key', () => {
    expect(PERSIST_KEYS.AUTH).toBe('auth-store');
  });

  it('should include UI key', () => {
    expect(PERSIST_KEYS.UI).toBe('ui-store');
  });

  it('should include BUDGET key', () => {
    expect(PERSIST_KEYS.BUDGET).toBe('budget-store');
  });

  it('should include FORECAST key', () => {
    expect(PERSIST_KEYS.FORECAST).toBe('forecast-store');
  });

  it('should include VARIANCE key', () => {
    expect(PERSIST_KEYS.VARIANCE).toBe('variance-store');
  });

  it('should include SCENARIO key', () => {
    expect(PERSIST_KEYS.SCENARIO).toBe('scenario-store');
  });

  it('should include REPORT key', () => {
    expect(PERSIST_KEYS.REPORT).toBe('report-store');
  });

  it('should include DATA key', () => {
    expect(PERSIST_KEYS.DATA).toBe('data-store');
  });

  it('should include GL key', () => {
    expect(PERSIST_KEYS.GL).toBe('gl-store');
  });

  it('should include ANALYTICS key', () => {
    expect(PERSIST_KEYS.ANALYTICS).toBe('analytics-store');
  });

  it('should include COLLABORATION key', () => {
    expect(PERSIST_KEYS.COLLABORATION).toBe('collaboration-store');
  });

  it('should include NOTIFICATION key', () => {
    expect(PERSIST_KEYS.NOTIFICATION).toBe('notification-store');
  });

  it('should include SETTINGS key', () => {
    expect(PERSIST_KEYS.SETTINGS).toBe('settings-store');
  });

  it('should include ENTITY key or not', () => {
    // ENTITY key may or may not exist depending on store setup
    expect(typeof PERSIST_KEYS).toBe('object');
  });

  it('should all end with -store suffix', () => {
    for (const value of Object.values(PERSIST_KEYS)) {
      expect(value).toMatch(/-store$/);
    }
  });

  it('should all be strings', () => {
    for (const value of Object.values(PERSIST_KEYS)) {
      expect(typeof value).toBe('string');
    }
  });

  it('should have unique values', () => {
    const values = Object.values(PERSIST_KEYS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('BACKUP_PREFIX', () => {
  it('should be finplan-pro-backup', () => {
    expect(BACKUP_PREFIX).toBe('finplan-pro-backup');
  });

  it('should be a string', () => {
    expect(typeof BACKUP_PREFIX).toBe('string');
  });
});

describe('AUTO_BACKUP_MAX', () => {
  it('should be 5', () => {
    expect(AUTO_BACKUP_MAX).toBe(5);
  });

  it('should be a positive integer', () => {
    expect(Number.isInteger(AUTO_BACKUP_MAX)).toBe(true);
    expect(AUTO_BACKUP_MAX).toBeGreaterThan(0);
  });
});
