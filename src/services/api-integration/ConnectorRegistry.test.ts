import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectorRegistry } from './ConnectorRegistry';
import type { ConnectorConfig } from './types';
import type { BaseConnector } from './BaseConnector';

// Mock connector for testing
function createMockConnector(id: string): BaseConnector {
  return {
    id,
    name: `Mock ${id}`,
    provider: 'mock',
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn().mockResolvedValue(undefined),
    checkHealth: vi.fn().mockResolvedValue({ status: 'connected' }),
    getHealth: vi.fn().mockReturnValue({ status: 'connected' }),
    sync: vi.fn().mockResolvedValue({
      success: true,
      recordsSynced: 0,
      errors: [],
      duration: 0,
      timestamp: Date.now(),
    }),
    setOAuthTokens: vi.fn(),
    getAccounts: vi
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, hasNext: false }),
    getTransactions: vi
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, hasNext: false }),
    getInvoices: vi
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, hasNext: false }),
    getBudgets: vi
      .fn()
      .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50, hasNext: false }),
  } as unknown as BaseConnector;
}

describe('ConnectorRegistry', () => {
  let registry: ConnectorRegistry;
  const defaultConfig: ConnectorConfig = {
    id: 'test-1',
    name: 'Test Connector',
    provider: 'mock',
    auth: { type: 'bearer', bearer: { token: 'test' } },
  };

  beforeEach(() => {
    registry = new ConnectorRegistry();
  });

  describe('factory registration', () => {
    it('should register and check factory existence', () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));
      expect(registry.hasFactory('mock')).toBe(true);
      expect(registry.hasFactory('nonexistent')).toBe(false);
    });

    it('should list registered providers', () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));
      registry.registerFactory('another', (cfg) => createMockConnector(cfg.id));

      const providers = registry.getRegisteredProviders();
      expect(providers).toContain('mock');
      expect(providers).toContain('another');
    });

    it('should be case-insensitive for provider lookup', () => {
      registry.registerFactory('QuickBooks', (cfg) => createMockConnector(cfg.id));
      expect(registry.hasFactory('quickbooks')).toBe(true);
      expect(registry.hasFactory('QUICKBOOKS')).toBe(true);
    });
  });

  describe('instance management', () => {
    it('should create and retrieve connector instances', () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));

      const connector = registry.createConnector(defaultConfig);
      expect(connector.id).toBe('test-1');

      const retrieved = registry.getConnector('test-1');
      expect(retrieved).toBe(connector);
    });

    it('should throw for unregistered provider', () => {
      expect(() => registry.createConnector(defaultConfig)).toThrow(
        /No connector factory registered/
      );
    });

    it('should get all connectors', () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));

      registry.createConnector({ ...defaultConfig, id: 'c1' });
      registry.createConnector({ ...defaultConfig, id: 'c2' });
      registry.createConnector({ ...defaultConfig, id: 'c3' });

      expect(registry.getAllConnectors()).toHaveLength(3);
    });

    it('should remove connector and disconnect', async () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));

      const connector = registry.createConnector(defaultConfig);
      const removed = registry.removeConnector('test-1');

      expect(removed).toBe(true);
      expect(registry.getConnector('test-1')).toBeUndefined();
      expect(connector.disconnect).toHaveBeenCalled();
    });

    it('should return false when removing non-existent connector', () => {
      expect(registry.removeConnector('nonexistent')).toBe(false);
    });
  });

  describe('bulk operations', () => {
    it('should connect all connectors', async () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));

      registry.createConnector({ ...defaultConfig, id: 'c1' });
      registry.createConnector({ ...defaultConfig, id: 'c2' });

      const results = await registry.connectAll();

      expect(results.get('c1')).toBe(true);
      expect(results.get('c2')).toBe(true);
    });

    it('should disconnect all connectors', async () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));

      const c1 = registry.createConnector({ ...defaultConfig, id: 'c1' });
      const c2 = registry.createConnector({ ...defaultConfig, id: 'c2' });

      await registry.disconnectAll();

      expect(c1.disconnect).toHaveBeenCalled();
      expect(c2.disconnect).toHaveBeenCalled();
    });

    it('should get health for all connectors', async () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));

      registry.createConnector({ ...defaultConfig, id: 'c1' });
      registry.createConnector({ ...defaultConfig, id: 'c2' });

      const healthMap = await registry.getHealthAll();

      expect(healthMap.get('c1')?.status).toBe('connected');
      expect(healthMap.get('c2')?.status).toBe('connected');
    });

    it('should handle health check errors gracefully', async () => {
      registry.registerFactory('mock', (cfg) => {
        const connector = createMockConnector(cfg.id);
        (connector.checkHealth as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Timeout'));
        return connector;
      });

      registry.createConnector({ ...defaultConfig, id: 'c1' });

      const healthMap = await registry.getHealthAll();
      expect(healthMap.get('c1')?.status).toBe('error');
      expect(healthMap.get('c1')?.lastError).toBe('Timeout');
    });

    it('should clear all instances', () => {
      registry.registerFactory('mock', (cfg) => createMockConnector(cfg.id));

      registry.createConnector({ ...defaultConfig, id: 'c1' });
      registry.createConnector({ ...defaultConfig, id: 'c2' });

      registry.clear();
      expect(registry.getAllConnectors()).toHaveLength(0);
    });
  });
});
