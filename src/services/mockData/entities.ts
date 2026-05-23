import type { Entity } from '@/types';

export const entities: Entity[] = [
  {
    id: 'ent-global',
    name: 'FinPlan Pro Global Holding',
    code: 'GLOBAL',
    currency: 'USD',
    country: 'United States',
    isParent: true,
    parentId: null,
  },
  {
    id: 'ent-na',
    name: 'North America Operations',
    code: 'NA-OPS',
    currency: 'USD',
    country: 'United States',
    isParent: true,
    parentId: 'ent-global',
  },
  {
    id: 'ent-emea',
    name: 'EMEA Regional Hub',
    code: 'EMEA-HUB',
    currency: 'EUR',
    country: 'Ireland',
    isParent: true,
    parentId: 'ent-global',
  },
  {
    id: 'ent-apac',
    name: 'APAC Regional Hub',
    code: 'APAC-HUB',
    currency: 'SGD',
    country: 'Singapore',
    isParent: true,
    parentId: 'ent-global',
  },
  {
    id: 'ent-uk',
    name: 'UK subsidiary Ltd',
    code: 'UK-SUB',
    currency: 'GBP',
    country: 'United Kingdom',
    isParent: false,
    parentId: 'ent-emea',
  },
  {
    id: 'ent-de',
    name: 'Germany GmbH',
    code: 'DE-SUB',
    currency: 'EUR',
    country: 'Germany',
    isParent: false,
    parentId: 'ent-emea',
  },
  {
    id: 'ent-fr',
    name: 'France SAS',
    code: 'FR-SUB',
    currency: 'EUR',
    country: 'France',
    isParent: false,
    parentId: 'ent-emea',
  },
  {
    id: 'ent-jp',
    name: 'Japan KK',
    code: 'JP-SUB',
    currency: 'JPY',
    country: 'Japan',
    isParent: false,
    parentId: 'ent-apac',
  },
  {
    id: 'ent-au',
    name: 'Australia Pty Ltd',
    code: 'AU-SUB',
    currency: 'AUD',
    country: 'Australia',
    isParent: false,
    parentId: 'ent-apac',
  },
  {
    id: 'ent-ca',
    name: 'Canada Inc',
    code: 'CA-SUB',
    currency: 'CAD',
    country: 'Canada',
    isParent: false,
    parentId: 'ent-na',
  },
];

export function getEntityById(id: string): Entity | undefined {
  return entities.find((e) => e.id === id);
}

export function getChildrenEntities(parentId: string): Entity[] {
  return entities.filter((e) => e.parentId === parentId);
}

export function getParentEntity(childId: string): Entity | undefined {
  const child = getEntityById(childId);
  if (!child || !child.parentId) return undefined;
  return getEntityById(child.parentId);
}

export function getEntityHierarchy(rootId: string = 'ent-global'): Entity[] {
  const result: Entity[] = [];
  const root = getEntityById(rootId);
  if (root) {
    result.push(root);
    const children = getChildrenEntities(rootId);
    children.forEach((child) => {
      result.push(...getEntityHierarchy(child.id));
    });
  }
  return result;
}
