import { describe, it, expect } from 'vitest';
import { BaseConnector } from '@/services/api-integration/BaseConnector';
import {
  CATEGORY_LABELS,
  INTEGRATION_CATALOG,
  getIntegrationDefinition,
  type IntegrationCategory,
} from './integrations';

describe('integration catalog', () => {
  it('lists every connector class in the framework', () => {
    expect(INTEGRATION_CATALOG).toHaveLength(9);
    const providers = INTEGRATION_CATALOG.map((def) => def.provider);
    expect(providers).toEqual(
      expect.arrayContaining([
        'quickbooks',
        'xero',
        'netsuite',
        'sage',
        'dynamics',
        'salesforce',
        'stripe',
        'plaid',
        'slack',
      ])
    );
  });

  it('has unique providers and valid metadata', () => {
    const seen = new Set<string>();
    for (const def of INTEGRATION_CATALOG) {
      expect(seen.has(def.provider)).toBe(false);
      seen.add(def.provider);
      expect(def.name.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
      expect(def.capability.length).toBeGreaterThan(0);
      expect(def.icon).toBeDefined();
      expect(def.fields.length).toBeGreaterThan(0);
      expect(Object.keys(CATEGORY_LABELS)).toContain(def.category);
    }
  });

  it('requires all fields to have unique keys and at least one credential field', () => {
    for (const def of INTEGRATION_CATALOG) {
      const keys = def.fields.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys.some((k) => k !== 'accessToken' && k !== 'channel')).toBe(true);
    }
  });

  it('buildConfig produces a valid config and buildConnector constructs a real connector for every entry', () => {
    for (const def of INTEGRATION_CATALOG) {
      const values: Record<string, string> = {};
      for (const field of def.fields) {
        values[field.key] = 'dummy-value';
      }
      const config = def.buildConfig(values, `test-${def.provider}`);
      expect(config.id).toBe(`test-${def.provider}`);
      expect(config.provider).toBe(def.provider);
      expect(config.name.length).toBeGreaterThan(0);
      expect(config.auth).toBeDefined();

      // Construction must not throw — every provider's auth guard must pass
      // with the catalog's built config.
      const connector = def.buildConnector(config);
      expect(connector).toBeInstanceOf(BaseConnector);
      expect(connector.provider).toBe(def.provider);
    }
  });

  it('buildConfig defaults missing optional values safely', () => {
    const stripe = getIntegrationDefinition('stripe');
    expect(stripe).toBeDefined();
    const config = stripe?.buildConfig({}, 'test-stripe');
    expect(config?.auth).toEqual({ type: 'bearer', bearer: { token: '' } });
  });

  it('getIntegrationDefinition returns undefined for unknown providers', () => {
    expect(getIntegrationDefinition('sap')).toBeUndefined();
    expect(getIntegrationDefinition('powerbi')).toBeUndefined();
  });

  it('every category used has a display label', () => {
    const used = new Set<IntegrationCategory>(INTEGRATION_CATALOG.map((d) => d.category));
    for (const category of used) {
      expect(CATEGORY_LABELS[category]).toBeDefined();
    }
  });
});
