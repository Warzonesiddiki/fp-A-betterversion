/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConnectorEngine,
  QuickBooksAdapter,
  NetSuiteAdapter,
  SalesforceAdapter,
} from './ConnectorEngine';

describe('ConnectorEngine', () => {
  beforeEach(() => {
    for (const c of ConnectorEngine.listConnectors()) {
      ConnectorEngine.unregister(c.id);
    }
  });

  describe('register', () => {
    it('registers a new connector with custom type', () => {
      ConnectorEngine.register({
        id: 'test-connector',
        name: 'Test Connector',
        type: 'custom',
        baseUrl: 'https://api.example.com',
      });
      const config = ConnectorEngine.getConfig('test-connector');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Test Connector');
      expect(config?.type).toBe('custom');
    });

    it('registers a QuickBooks connector with optional fields', () => {
      ConnectorEngine.register({
        id: 'qb-connector',
        name: 'QuickBooks',
        type: 'quickbooks',
        baseUrl: 'https://quickbooks.api.intuit.com/v3',
        clientId: 'abc',
        clientSecret: 'secret',
        apiKey: 'key-123',
      });
      const config = ConnectorEngine.getConfig('qb-connector');
      expect(config?.clientId).toBe('abc');
      expect(config?.apiKey).toBe('key-123');
    });

    it('registers a NetSuite connector', () => {
      ConnectorEngine.register({
        id: 'ns-connector',
        name: 'NetSuite',
        type: 'netsuite',
        baseUrl: 'https://<account>.suitetalk.api.netsuite.com',
        headers: { Accept: 'application/json' },
      });
      const config = ConnectorEngine.getConfig('ns-connector');
      expect(config?.type).toBe('netsuite');
      expect(config?.headers).toEqual({ Accept: 'application/json' });
    });

    it('registers a Salesforce connector', () => {
      ConnectorEngine.register({
        id: 'sf-connector',
        name: 'Salesforce',
        type: 'salesforce',
        baseUrl: 'https://instance.salesforce.com',
      });
      const config = ConnectorEngine.getConfig('sf-connector');
      expect(config?.type).toBe('salesforce');
    });
  });

  describe('getConfig', () => {
    it('returns undefined for unknown id', () => {
      expect(ConnectorEngine.getConfig('nonexistent')).toBeUndefined();
    });
  });

  describe('listConnectors', () => {
    it('lists all registered connectors', () => {
      ConnectorEngine.register({
        id: 'c1',
        name: 'C1',
        type: 'custom',
        baseUrl: 'https://api1.com',
      });
      ConnectorEngine.register({
        id: 'c2',
        name: 'C2',
        type: 'quickbooks',
        baseUrl: 'https://api2.com',
      });
      const connectors = ConnectorEngine.listConnectors();
      expect(connectors).toHaveLength(2);
      expect(connectors.map((c) => c.id)).toEqual(['c1', 'c2']);
    });

    it('returns empty array when none registered', () => {
      expect(ConnectorEngine.listConnectors()).toEqual([]);
    });
  });

  describe('unregister', () => {
    it('removes a connector', () => {
      ConnectorEngine.register({
        id: 'temp',
        name: 'Temp',
        type: 'custom',
        baseUrl: 'https://temp.com',
      });
      expect(ConnectorEngine.getConfig('temp')).toBeDefined();
      ConnectorEngine.unregister('temp');
      expect(ConnectorEngine.getConfig('temp')).toBeUndefined();
    });

    it('succeeds on unregistering unknown id', () => {
      expect(() => ConnectorEngine.unregister('ghost')).not.toThrow();
    });
  });

  describe('connect', () => {
    it('returns error for unregistered connector', async () => {
      const result = await ConnectorEngine.connect('missing');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connector not found');
    });
  });

  describe('fetch', () => {
    it('returns error for unregistered connector', async () => {
      const result = await ConnectorEngine.fetch('missing', { path: '/test', method: 'GET' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connector not found');
    });

    it('returns error when fetch fails', async () => {
      ConnectorEngine.register({
        id: 'fail',
        name: 'Fail',
        type: 'custom',
        baseUrl: 'https://bad.url/that/will/fail',
      });
      const result = await ConnectorEngine.fetch('fail', { path: '/data', method: 'GET' });
      expect(result.success).toBe(false);
    });
  });

  describe('transform', () => {
    it('transforms data using mapping', () => {
      const input = { account_name: 'Revenue', amount: 1000 };
      const mapping = { account_name: 'name', amount: 'value' };
      const result = ConnectorEngine.transform<Record<string, unknown>, Record<string, unknown>>(
        input,
        mapping
      );
      expect(result).toEqual({ name: 'Revenue', value: 1000 });
    });

    it('handles missing source keys as undefined', () => {
      const result = ConnectorEngine.transform({ a: 1 }, { a: 'x', b: 'y' });
      expect(result).toEqual({ x: 1, y: undefined });
    });

    it('returns empty object for empty mapping', () => {
      const result = ConnectorEngine.transform({ a: 1 }, {});
      expect(result).toEqual({});
    });
  });
});

describe('QuickBooksAdapter', () => {
  it('has correct endpoints', () => {
    expect(QuickBooksAdapter.baseUrl).toBe('https://quickbooks.api.intuit.com/v3');
    expect(QuickBooksAdapter.endpoints.accounts.method).toBe('GET');
    expect(QuickBooksAdapter.endpoints.transactions.path).toContain('Transaction');
    expect(QuickBooksAdapter.endpoints.reports.path).toContain('ProfitAndLoss');
  });
});

describe('NetSuiteAdapter', () => {
  it('has correct endpoints', () => {
    expect(NetSuiteAdapter.baseUrl).toContain('netsuite.com');
    expect(NetSuiteAdapter.endpoints.accounts.method).toBe('GET');
    expect(NetSuiteAdapter.endpoints.journal.path).toContain('journalentry');
    expect(NetSuiteAdapter.endpoints.financial.path).toContain('incomeStatement');
  });
});

describe('SalesforceAdapter', () => {
  it('has correct endpoints', () => {
    expect(SalesforceAdapter.baseUrl).toContain('salesforce.com');
    expect(SalesforceAdapter.endpoints.accounts.path).toContain('Account');
    expect(SalesforceAdapter.endpoints.opportunities.path).toContain('Opportunity');
  });
});
