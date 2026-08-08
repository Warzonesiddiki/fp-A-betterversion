import { describe, it, expect } from 'vitest';
import {
  entities,
  getEntityById,
  getChildrenEntities,
  getParentEntity,
  getEntityHierarchy,
} from './entities';

describe('mockData entities', () => {
  it('provides a well-formed entity list', () => {
    expect(entities.length).toBeGreaterThanOrEqual(10);
    // unique ids and codes
    expect(new Set(entities.map((e) => e.id)).size).toBe(entities.length);
    expect(new Set(entities.map((e) => e.code)).size).toBe(entities.length);
  });

  it('has a single global root and consistent parent references', () => {
    const roots = entities.filter((e) => e.parentId === null);
    expect(roots).toHaveLength(1);
    expect(roots[0]!.id).toBe('ent-global');
    for (const e of entities) {
      if (e.parentId !== null) {
        const parent = getEntityById(e.parentId);
        expect(parent).toBeDefined();
        // a non-root child must not itself be the root
        expect(e.id).not.toBe('ent-global');
      }
      // parents must be flagged as parents
      if (e.isParent) {
        expect(entities.filter((c) => c.parentId === e.id).length).toBeGreaterThan(0);
      }
    }
  });

  it('getEntityById finds entities and returns undefined for unknowns', () => {
    expect(getEntityById('ent-global')?.name).toBe('FinPlan Pro Global Holding');
    expect(getEntityById('ent-jp')?.currency).toBe('JPY');
    expect(getEntityById('nope')).toBeUndefined();
    expect(getEntityById('')).toBeUndefined();
  });

  it('getChildrenEntities returns direct children only', () => {
    const globalChildren = getChildrenEntities('ent-global');
    expect(globalChildren.map((c) => c.id)).toEqual(['ent-na', 'ent-emea', 'ent-apac']);

    const emeaChildren = getChildrenEntities('ent-emea');
    expect(emeaChildren.map((c) => c.id)).toEqual(['ent-uk', 'ent-de', 'ent-fr']);

    expect(getChildrenEntities('ent-uk')).toEqual([]);
    expect(getChildrenEntities('missing')).toEqual([]);
  });

  it('getParentEntity walks up one level and tolerates roots/unknowns', () => {
    expect(getParentEntity('ent-uk')?.id).toBe('ent-emea');
    expect(getParentEntity('ent-ca')?.id).toBe('ent-na');
    expect(getParentEntity('ent-global')).toBeUndefined();
    expect(getParentEntity('missing')).toBeUndefined();
  });

  it('getEntityHierarchy performs a depth-first traversal from the root by default', () => {
    const hierarchy = getEntityHierarchy();
    const ids = hierarchy.map((e) => e.id);
    expect(ids[0]).toBe('ent-global');
    // every entity is visited exactly once
    expect(ids).toHaveLength(entities.length);
    expect(new Set(ids).size).toBe(entities.length);

    // depth-first: North America's subtree (Canada) comes before EMEA siblings
    expect(ids.indexOf('ent-na')).toBeLessThan(ids.indexOf('ent-emea'));
    expect(ids.indexOf('ent-ca')).toBeLessThan(ids.indexOf('ent-emea'));
    expect(ids.indexOf('ent-uk')).toBeLessThan(ids.indexOf('ent-apac'));
  });

  it('getEntityHierarchy supports a custom root and returns [] for unknown roots', () => {
    const emea = getEntityHierarchy('ent-emea');
    expect(emea.map((e) => e.id)).toEqual(['ent-emea', 'ent-uk', 'ent-de', 'ent-fr']);

    expect(getEntityHierarchy('ent-uk').map((e) => e.id)).toEqual(['ent-uk']);
    expect(getEntityHierarchy('does-not-exist')).toEqual([]);
  });
});
