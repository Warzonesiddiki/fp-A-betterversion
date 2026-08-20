import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AUTHORITIES,
  PERSISTED_STORE_COUNT,
  PERSISTED_STORES,
  STORE_CLASSIFICATIONS,
  financialTruthStores,
  getStoreContract,
  hasLocalDraftFinancialTruth,
} from './persistenceAuthority';

const STORE_DIR = join(__dirname, '../store');

function persistKeysOnDisk(): string[] {
  const keys = new Set<string>();
  for (const file of readdirSync(STORE_DIR)) {
    if (!file.endsWith('.ts') || /\.test\.|\.bench\./.test(file)) continue;
    const text = readFileSync(join(STORE_DIR, file), 'utf8');
    if (!text.includes('persist(')) continue;
    for (const match of text.matchAll(/name:\s*['"]([a-z0-9-]+-store)['"]/g)) {
      keys.add(match[1]!);
    }
  }
  return [...keys].sort();
}

describe('persistence authority contract (W0.8.1 / W0.8.3)', () => {
  it('registers every persist() store and no extras', () => {
    const disk = persistKeysOnDisk();
    const registered = PERSISTED_STORES.map((row) => row.persistKey).sort();
    expect(registered).toEqual(disk);
    expect(PERSISTED_STORE_COUNT).toBe(disk.length);
  });

  it('every row has a legal classification and authority', () => {
    for (const row of PERSISTED_STORES) {
      expect(STORE_CLASSIFICATIONS).toContain(row.classification);
      expect(AUTHORITIES).toContain(row.authority);
      expect(row.module.startsWith('src/store/')).toBe(true);
      expect(row.persistKey.length).toBeGreaterThan(0);
      expect(row.notes.length).toBeGreaterThan(8);
    }
  });

  it('financial-truth stores are never silently local-authoritative', () => {
    for (const row of financialTruthStores()) {
      expect(row.authority).not.toBe('local');
    }
  });

  it('user-preference and session stores may be local', () => {
    const prefs = PERSISTED_STORES.filter(
      (row) => row.classification === 'user-preference' || row.classification === 'session'
    );
    expect(prefs.length).toBeGreaterThan(0);
    for (const row of prefs) {
      expect(row.authority).toBe('local');
    }
  });

  it('gl-store is the W0.8.6 spike target and is still a local draft', () => {
    const gl = getStoreContract('gl-store');
    expect(gl).toBeDefined();
    expect(gl!.classification).toBe('financial-truth');
    expect(gl!.authority).toBe('local-draft');
    expect(gl!.serverRoute).toBe('/api/gl');
  });

  it('the workspace still has local-draft financial truth (W0.8.5 banner predicate)', () => {
    expect(hasLocalDraftFinancialTruth()).toBe(true);
  });

  it('persist keys are unique', () => {
    const keys = PERSISTED_STORES.map((row) => row.persistKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
