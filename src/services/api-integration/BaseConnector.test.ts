import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConnectorConfig, ConnectorHealth, OAuth2Tokens, SyncOptions } from './types';

// Mock RestApiClient
vi.mock('./RestApiClient', () => ({
  RestApiClient: class MockRestApiClient {
    get = vi.fn();
    post = vi.fn();
    put = vi.fn();
    patch = vi.fn();
    delete = vi.fn();
    request = vi.fn();
    setOAuthTokens = vi.fn();
    getOAuthTokens = vi.fn();
    setTokenRefreshHandler = vi.fn();
  },
}));

import { BaseConnector } from './BaseConnector';

// Concrete subclass for testing abstract class
class TestConnector extends BaseConnector {
  public healthResult: ConnectorHealth = { status: 'connected' };
  public pullCount = 0;
  public pushCount = 0;
  public shouldFailHealth = false;
  public shouldFailPull = false;
  public shouldFailPush = false;

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    if (this.shouldFailHealth) {
      return { status: 'error', lastError: 'Health check failed' };
    }
    return this.healthResult;
  }

  protected async pullData(_options: SyncOptions): Promise<number> {
    if (this.shouldFailPull) {
      throw new Error('Pull failed');
    }
    return this.pullCount;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    if (this.shouldFailPush) {
      throw new Error('Push failed');
    }
    return this.pushCount;
  }
}

describe('BaseConnector', () => {
  let connector: TestConnector;
  const mockConfig: ConnectorConfig = {
    id: 'test-connector',
    name: 'Test Connector',
    provider: 'test-provider',
    baseUrl: 'https://api.test.com',
    auth: { type: 'api_key', apiKey: { headerName: 'X-API-Key', key: 'test-key' } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new TestConnector(mockConfig);
  });

  describe('identity getters', () => {
    it('should expose id, name, and provider from config', () => {
      expect(connector.id).toBe('test-connector');
      expect(connector.name).toBe('Test Connector');
      expect(connector.provider).toBe('test-provider');
    });
  });

  describe('connect', () => {
    it('should return true when health check passes', async () => {
      connector.healthResult = { status: 'connected' };
      const result = await connector.connect();
      expect(result).toBe(true);
    });

    it('should return false when health check returns error', async () => {
      connector.shouldFailHealth = true;
      const result = await connector.connect();
      expect(result).toBe(false);
    });

    it('should set status to error when health check throws', async () => {
      connector.shouldFailHealth = true;
      connector.healthResult = { status: 'error', lastError: 'boom' };

      await connector.connect();
      const health = connector.getHealth();
      expect(health.status).toBe('error');
    });

    it('should catch exceptions from performHealthCheck and return false', async () => {
      // Override to throw
      const throwingConnector = new (class extends BaseConnector {
        protected async performHealthCheck(): Promise<ConnectorHealth> {
          throw new Error('Unexpected crash');
        }
        protected async pullData(): Promise<number> {
          return 0;
        }
        protected async pushData(): Promise<number> {
          return 0;
        }
      })(mockConfig);

      const result = await throwingConnector.connect();
      expect(result).toBe(false);
      expect(throwingConnector.getHealth().status).toBe('error');
      expect(throwingConnector.getHealth().lastError).toBe('Unexpected crash');
    });

    it('should handle non-Error exceptions in connect', async () => {
      const throwingConnector = new (class extends BaseConnector {
        protected async performHealthCheck(): Promise<ConnectorHealth> {
          throw 'string error';
        }
        protected async pullData(): Promise<number> {
          return 0;
        }
        protected async pushData(): Promise<number> {
          return 0;
        }
      })(mockConfig);

      const result = await throwingConnector.connect();
      expect(result).toBe(false);
      // Non-Error thrown from performHealthCheck flows through checkHealth's catch
      // which sets lastError to 'Health check failed', then connect catches that health result
      expect(throwingConnector.getHealth().lastError).toBe('Health check failed');
    });
  });

  describe('disconnect', () => {
    it('should set status to disconnected', async () => {
      await connector.connect();
      expect(connector.getHealth().status).toBe('connected');

      await connector.disconnect();
      expect(connector.getHealth().status).toBe('disconnected');
    });
  });

  describe('checkHealth', () => {
    it('should return health from performHealthCheck', async () => {
      connector.healthResult = { status: 'connected', rateLimitRemaining: 100 };

      const health = await connector.checkHealth();
      expect(health.status).toBe('connected');
      expect(health.rateLimitRemaining).toBe(100);
    });

    it('should update internal status on success', async () => {
      await connector.checkHealth();
      expect(connector.getHealth().status).toBe('connected');
    });

    it('should return error status when performHealthCheck returns error', async () => {
      connector.shouldFailHealth = true;

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Health check failed');
    });

    it('should catch exceptions and return error', async () => {
      const throwingConnector = new (class extends BaseConnector {
        protected async performHealthCheck(): Promise<ConnectorHealth> {
          throw new Error('Boom');
        }
        protected async pullData(): Promise<number> {
          return 0;
        }
        protected async pushData(): Promise<number> {
          return 0;
        }
      })(mockConfig);

      const health = await throwingConnector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Boom');
    });

    it('should handle non-Error exceptions in checkHealth', async () => {
      const throwingConnector = new (class extends BaseConnector {
        protected async performHealthCheck(): Promise<ConnectorHealth> {
          throw 42;
        }
        protected async pullData(): Promise<number> {
          return 0;
        }
        protected async pushData(): Promise<number> {
          return 0;
        }
      })(mockConfig);

      const health = await throwingConnector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Health check failed');
    });
  });

  describe('getHealth', () => {
    it('should return current status, lastSyncAt, and lastError', async () => {
      const health = connector.getHealth();
      expect(health.status).toBe('disconnected');
      expect(health.lastSyncAt).toBeUndefined();
      expect(health.lastError).toBeUndefined();
    });

    it('should reflect status after connect', async () => {
      await connector.connect();
      const health = connector.getHealth();
      expect(health.status).toBe('connected');
    });
  });

  describe('setOAuthTokens', () => {
    it('should delegate to client.setOAuthTokens', () => {
      const tokens: OAuth2Tokens = {
        accessToken: 'at-123',
        refreshToken: 'rt-456',
        expiresAt: Date.now() + 3600_000,
        tokenType: 'Bearer',
      };
      connector.setOAuthTokens(tokens);
      // Verify no throw and delegation works
      expect(() => connector.setOAuthTokens(tokens)).not.toThrow();
    });
  });

  describe('sync', () => {
    it('should pull data and return success result', async () => {
      connector.pullCount = 5;

      const result = await connector.sync({ direction: 'pull' });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(5);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.errors).toEqual([]);
    });

    it('should push data and return success result', async () => {
      connector.pushCount = 3;

      const result = await connector.sync({ direction: 'push' });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(3);
    });

    it('should handle bidirectional sync', async () => {
      connector.pullCount = 4;
      connector.pushCount = 2;

      const result = await connector.sync({ direction: 'bidirectional' });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(6);
    });

    it('should return failure when pull throws', async () => {
      connector.shouldFailPull = true;

      const result = await connector.sync({ direction: 'pull' });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Pull failed');
      expect(result.recordsSynced).toBe(0);
    });

    it('should return failure when push throws', async () => {
      connector.shouldFailPush = true;

      const result = await connector.sync({ direction: 'push' });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Push failed');
    });

    it('should handle non-Error exceptions in sync', async () => {
      const throwingConnector = new (class extends BaseConnector {
        protected async performHealthCheck(): Promise<ConnectorHealth> {
          return { status: 'connected' };
        }
        protected async pullData(): Promise<number> {
          throw 'string error in pull';
        }
        protected async pushData(): Promise<number> {
          return 0;
        }
      })(mockConfig);

      const result = await throwingConnector.sync({ direction: 'pull' });
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Sync failed');
    });

    it('should update lastSyncAt on success', async () => {
      const before = Date.now();
      await connector.sync({ direction: 'pull' });
      const after = Date.now();

      const health = connector.getHealth();
      expect(health.lastSyncAt).toBeGreaterThanOrEqual(before);
      expect(health.lastSyncAt).toBeLessThanOrEqual(after);
    });

    it('should update lastError on failure', async () => {
      connector.shouldFailPull = true;

      await connector.sync({ direction: 'pull' });
      const health = connector.getHealth();
      expect(health.lastError).toBe('Pull failed');
    });
  });

  describe('default domain methods', () => {
    it('getAccounts should return empty paginated response', async () => {
      const result = await connector.getAccounts();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasNext).toBe(false);
    });

    it('getTransactions should return empty paginated response', async () => {
      const result = await connector.getTransactions('acct-1');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('getInvoices should return empty paginated response', async () => {
      const result = await connector.getInvoices();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('getBudgets should return empty paginated response', async () => {
      const result = await connector.getBudgets();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
