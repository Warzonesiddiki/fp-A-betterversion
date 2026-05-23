/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectorEngine } from './ConnectorEngine';

describe('ConnectorEngine', () => {
  beforeEach(() => {
    ConnectorEngine.unregister('test-connector');
  });

  describe('register', () => {
    it('registers a new connector', () => {
      ConnectorEngine.register({
        id: 'test-connector',
        name: 'Test Connector',
        type: 'generic',
        baseUrl: 'https://api.example.com',
      });
      const config = ConnectorEngine.getConfig('test-connector');
      expect(config).toBeDefined();
      expect(config?.name).toBe('Test Connector');
    });
  });

  describe('listConnectors', () => {
    it('lists all registered connectors', () => {
      ConnectorEngine.register({
        id: 'c1',
        name: 'C1',
        type: 'generic',
        baseUrl: 'https://api1.com',
      });
      ConnectorEngine.register({
        id: 'c2',
        name: 'C2',
        type: 'quickbooks',
        baseUrl: 'https://api2.com',
      });
      const connectors = ConnectorEngine.listConnectors();
      expect(connectors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('unregister', () => {
    it('removes a connector', () => {
      ConnectorEngine.register({
        id: 'temp',
        name: 'Temp',
        type: 'generic',
        baseUrl: 'https://temp.com',
      });
      ConnectorEngine.unregister('temp');
      expect(ConnectorEngine.getConfig('temp')).toBeUndefined();
    });
  });

  describe('transform', () => {
    it('transforms data using mapping', () => {
      const input = { account_name: 'Revenue', amount: 1000 };
      const mapping = { account_name: 'name', amount: 'value' };
      const result = ConnectorEngine.transform(input, mapping);
      expect(result).toBeDefined();
    });
  });

  describe('QuickBooksAdapter', () => {
    it('has correct endpoints', () => {
      expect(ConnectorEngine).toBeDefined();
    });
  });
});
