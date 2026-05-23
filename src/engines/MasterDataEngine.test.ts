import { describe, it, expect, beforeEach } from 'vitest';
import {
  MasterDataEngine,
  createSystemEntities,
  createSystemAccounts,
  type MasterDataRecord,
} from './MasterDataEngine';

// =============================================================================
// MasterDataEngine Tests
// =============================================================================

describe('MasterDataEngine', () => {
  let engine: MasterDataEngine;

  beforeEach(() => {
    engine = new MasterDataEngine();
  });

  const addEntity = (overrides?: Partial<MasterDataRecord>) =>
    engine.add({
      id: 'entity-1',
      type: 'entity',
      code: 'CORP',
      name: 'Corporate HQ',
      parentId: null,
      attributes: { country: 'US' },
      status: 'active',
      createdBy: 'test',
      ...overrides,
    });

  describe('add', () => {
    it('should add a record with auto-generated timestamps and version', () => {
      const record = addEntity();
      expect(record.id).toBe('entity-1');
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeDefined();
      expect(record.version).toBe(1);
    });

    it('should auto-generate ID when not provided', () => {
      const record = engine.add({
        id: '',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
      expect(record.id).toBeTruthy();
      expect(record.id).not.toBe('');
    });
  });

  describe('get / getByCode', () => {
    it('should retrieve by ID', () => {
      addEntity();
      expect(engine.get('entity-1')).toBeDefined();
      expect(engine.get('entity-1')!.code).toBe('CORP');
    });

    it('should return undefined for non-existent ID', () => {
      expect(engine.get('nonexistent')).toBeUndefined();
    });

    it('should retrieve by type and code', () => {
      addEntity();
      const found = engine.getByCode('entity', 'CORP');
      expect(found).toBeDefined();
      expect(found!.name).toBe('Corporate HQ');
    });

    it('should return undefined for non-existent code', () => {
      expect(engine.getByCode('entity', 'NOSUCH')).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should list all records', () => {
      addEntity();
      engine.add({
        id: 'acct-1',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
      expect(engine.list()).toHaveLength(2);
    });

    it('should filter by type', () => {
      addEntity();
      engine.add({
        id: 'acct-1',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
      expect(engine.list('entity')).toHaveLength(1);
      expect(engine.list('account')).toHaveLength(1);
    });

    it('should filter by status', () => {
      addEntity();
      engine.add({
        id: 'acct-1',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'inactive',
        createdBy: 'test',
      });
      expect(engine.list(undefined, 'active')).toHaveLength(1);
      expect(engine.list(undefined, 'inactive')).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update fields and track changes', () => {
      addEntity();
      const updated = engine.update('entity-1', { name: 'New Name' }, 'admin', 'rebranding');
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('New Name');
      expect(updated!.version).toBe(2);
    });

    it('should return null for non-existent ID', () => {
      expect(engine.update('nonexistent', { name: 'X' }, 'admin')).toBeNull();
    });

    it('should not change id, createdAt, or version directly', () => {
      addEntity();
      const original = engine.get('entity-1')!;
      const originalCreatedAt = original.createdAt;

      engine.update(
        'entity-1',
        { id: 'hacked', createdAt: '2000-01-01' } as unknown as Partial<MasterDataRecord>,
        'admin'
      );
      const updated = engine.get('entity-1')!;
      expect(updated.id).toBe('entity-1');
      expect(updated.createdAt).toBe(originalCreatedAt);
    });

    it('should record changes with changedBy and reason', () => {
      addEntity();
      engine.update('entity-1', { name: 'Updated' }, 'admin', 'correction');
      const changes = engine.getChanges('entity-1');
      expect(changes).toHaveLength(1);
      expect(changes[0].changedBy).toBe('admin');
      expect(changes[0].reason).toBe('correction');
      expect(changes[0].field).toBe('name');
      expect(changes[0].oldValue).toBe('Corporate HQ');
      expect(changes[0].newValue).toBe('Updated');
    });

    it('should not record change when value is identical', () => {
      addEntity();
      engine.update('entity-1', { name: 'Corporate HQ' }, 'admin');
      const changes = engine.getChanges('entity-1');
      expect(changes).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('should search by name', () => {
      addEntity();
      engine.add({
        id: 'acct-1',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });

      const results = engine.search('corporate');
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('CORP');
    });

    it('should search by code', () => {
      addEntity();
      const results = engine.search('CORP');
      expect(results).toHaveLength(1);
    });

    it('should search by attributes', () => {
      addEntity();
      const results = engine.search('US');
      expect(results).toHaveLength(1);
    });

    it('should filter search by type', () => {
      addEntity();
      engine.add({
        id: 'acct-1',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });

      const results = engine.search('revenue', 'account');
      expect(results).toHaveLength(1);
    });

    it('should return empty for no match', () => {
      addEntity();
      expect(engine.search('nonexistent')).toEqual([]);
    });

    it('should handle multi-term search', () => {
      addEntity();
      const results = engine.search('corporate hq');
      expect(results).toHaveLength(1);
    });
  });

  describe('deactivate / archive', () => {
    it('should deactivate a record', () => {
      addEntity();
      expect(engine.deactivate('entity-1')).toBe(true);
      expect(engine.get('entity-1')!.status).toBe('inactive');
      expect(engine.get('entity-1')!.version).toBe(2);
    });

    it('should archive a record', () => {
      addEntity();
      expect(engine.archive('entity-1')).toBe(true);
      expect(engine.get('entity-1')!.status).toBe('archived');
    });

    it('should return false for non-existent ID', () => {
      expect(engine.deactivate('nonexistent')).toBe(false);
      expect(engine.archive('nonexistent')).toBe(false);
    });
  });

  describe('hierarchy', () => {
    beforeEach(() => {
      engine.add({
        id: 'corp',
        type: 'entity',
        code: 'CORP',
        name: 'Corporate',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
      engine.add({
        id: 'na',
        type: 'entity',
        code: 'NA',
        name: 'North America',
        parentId: 'corp',
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
      engine.add({
        id: 'emea',
        type: 'entity',
        code: 'EMEA',
        name: 'Europe',
        parentId: 'corp',
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
      engine.add({
        id: 'us',
        type: 'entity',
        code: 'US',
        name: 'United States',
        parentId: 'na',
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
    });

    it('should get children of a parent', () => {
      const children = engine.getChildren('corp');
      expect(children).toHaveLength(2);
    });

    it('should get children filtered by type', () => {
      const children = engine.getChildren('corp', 'entity');
      expect(children).toHaveLength(2);
    });

    it('should build hierarchy tree', () => {
      const tree = engine.getHierarchy('entity');
      expect(tree).toHaveLength(1);
      expect(tree[0].code).toBe('CORP');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].children).toHaveLength(1);
    });

    it('should build hierarchy from specific root', () => {
      const tree = engine.getHierarchy('entity', 'na');
      expect(tree).toHaveLength(1);
      expect(tree[0].code).toBe('NA');
    });

    it('should return empty for non-existent root', () => {
      const tree = engine.getHierarchy('entity', 'nonexistent');
      expect(tree).toEqual([]);
    });

    it('should compute correct path', () => {
      const path = engine.getPath('us');
      expect(path).toHaveLength(3);
      expect(path[0].code).toBe('CORP');
      expect(path[1].code).toBe('NA');
      expect(path[2].code).toBe('US');
    });

    it('should include level and path in hierarchy nodes', () => {
      const tree = engine.getHierarchy('entity');
      expect(tree[0].level).toBe(0);
      expect(tree[0].path).toEqual(['CORP']);
      expect(tree[0].children[0].level).toBe(1);
      expect(tree[0].children[0].path).toEqual(['CORP', 'NA']);
    });
  });

  describe('validate', () => {
    it('should validate a valid record', () => {
      const record = addEntity();
      const result = engine.validate(record);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail on empty code', () => {
      const record = addEntity({ code: '  ' });
      const result = engine.validate(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Code is required');
    });

    it('should fail on empty name', () => {
      const record = addEntity({ name: '  ' });
      const result = engine.validate(record);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Name is required');
    });

    it('should fail on duplicate code when validated before adding', () => {
      addEntity();
      // Build a candidate record (not yet added) with the same code
      const candidate: MasterDataRecord = {
        id: 'entity-2',
        type: 'entity',
        code: 'CORP',
        name: 'Duplicate',
        parentId: null,
        attributes: {},
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'test',
        version: 1,
      };
      const result = engine.validate(candidate);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('already exists'))).toBe(true);
    });

    it('should fail when parent not found', () => {
      const record = addEntity({ parentId: 'nonexistent' });
      const result = engine.validate(record);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Parent'))).toBe(true);
    });

    it('should fail on parent type mismatch', () => {
      engine.add({
        id: 'acct-1',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
      const record = addEntity({ parentId: 'acct-1' });
      const result = engine.validate(record);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('type mismatch'))).toBe(true);
    });

    it('should fail when effectiveFrom > effectiveTo', () => {
      const record = addEntity({ effectiveFrom: '2025-01-01', effectiveTo: '2024-01-01' });
      const result = engine.validate(record);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('before'))).toBe(true);
    });

    it('should warn on archived status', () => {
      const record = addEntity({ status: 'archived' });
      const result = engine.validate(record);
      expect(result.warnings.some((w) => w.includes('archived'))).toBe(true);
    });
  });

  describe('getChanges', () => {
    it('should return all changes when no recordId specified', () => {
      addEntity();
      engine.update('entity-1', { name: 'A' }, 'admin');
      engine.update('entity-1', { name: 'B' }, 'admin');
      expect(engine.getChanges()).toHaveLength(2);
    });

    it('should limit results', () => {
      addEntity();
      engine.update('entity-1', { name: 'A' }, 'admin');
      engine.update('entity-1', { name: 'B' }, 'admin');
      expect(engine.getChanges(undefined, 1)).toHaveLength(1);
    });

    it('should sort changes newest first', () => {
      addEntity();
      engine.update('entity-1', { name: 'A' }, 'admin');
      engine.update('entity-1', { name: 'B' }, 'admin');
      const changes = engine.getChanges();
      expect(new Date(changes[0].changedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(changes[1].changedAt).getTime()
      );
    });
  });

  describe('getStats', () => {
    it('should return stats per type', () => {
      addEntity();
      engine.add({
        id: 'acct-1',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });
      engine.add({
        id: 'acct-2',
        type: 'account',
        code: 'COGS',
        name: 'COGS',
        parentId: null,
        attributes: {},
        status: 'inactive',
        createdBy: 'test',
      });

      const stats = engine.getStats();
      expect(stats.entity.total).toBe(1);
      expect(stats.account.total).toBe(2);
      expect(stats.account.active).toBe(1);
      expect(stats.account.inactive).toBe(1);
    });
  });

  describe('serialize / deserialize', () => {
    it('should round-trip serialize and deserialize', () => {
      addEntity();
      engine.add({
        id: 'acct-1',
        type: 'account',
        code: 'REV',
        name: 'Revenue',
        parentId: null,
        attributes: {},
        status: 'active',
        createdBy: 'test',
      });

      const json = engine.serialize();
      const freshEngine = new MasterDataEngine();
      freshEngine.deserialize(json);

      expect(freshEngine.list()).toHaveLength(2);
      expect(freshEngine.get('entity-1')!.code).toBe('CORP');
      expect(freshEngine.getByCode('account', 'REV')).toBeDefined();
    });

    it('should restore changes after deserialize', () => {
      addEntity();
      engine.update('entity-1', { name: 'Updated' }, 'admin');

      const json = engine.serialize();
      const freshEngine = new MasterDataEngine();
      freshEngine.deserialize(json);

      expect(freshEngine.getChanges()).toHaveLength(1);
    });
  });

  describe('preset creators', () => {
    it('should create system entities', () => {
      const entities = createSystemEntities();
      expect(entities.length).toBeGreaterThan(0);
      expect(entities[0].code).toBe('CORP');
      expect(entities[0].parentId).toBeNull();
      expect(entities[1].parentId).toBe('entity-corp');
    });

    it('should create system accounts', () => {
      const accounts = createSystemAccounts();
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts[0].code).toBe('BS');
      expect(accounts.some((a) => a.code === 'REV')).toBe(true);
    });

    it('should add system entities to engine', () => {
      for (const e of createSystemEntities()) {
        engine.add(e);
      }
      expect(engine.list('entity')).toHaveLength(4);
      expect(engine.getByCode('entity', 'EMEA')).toBeDefined();
    });
  });
});
