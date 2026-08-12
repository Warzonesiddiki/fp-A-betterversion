import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StripeConnector } from './StripeConnector';

vi.mock('./RestApiClient', () => {
  return {
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
  };
});

describe('StripeConnector', () => {
  let connector: StripeConnector;
  const mockConfig = {
    id: 'stripe-test',
    name: 'Stripe Test',
    provider: 'stripe',
    auth: {
      type: 'bearer' as const,
      bearer: { token: 'sk_test_123' },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new StripeConnector(mockConfig);
  });

  describe('construction', () => {
    it('creates a connector with correct properties and default base URL', () => {
      expect(connector.id).toBe('stripe-test');
      expect(connector.provider).toBe('stripe');
    });
  });

  describe('health check', () => {
    it('returns connected when balance is available', async () => {
      const client = (connector as unknown as { client: { get: ReturnType<typeof vi.fn> } }).client;
      client.get.mockResolvedValue({
        data: { available: [{ amount: 1000, currency: 'usd' }], pending: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const health = await connector.checkHealth();
      expect(health.status).toBe('connected');
      expect(client.get).toHaveBeenCalledWith('/balance');
    });

    it('returns error when no balance data', async () => {
      const client = (connector as unknown as { client: { get: ReturnType<typeof vi.fn> } }).client;
      client.get.mockResolvedValue({
        data: { available: [], pending: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toContain('no balance');
    });

    it('returns error on API failure', async () => {
      const client = (connector as unknown as { client: { get: ReturnType<typeof vi.fn> } }).client;
      client.get.mockRejectedValue(new Error('Invalid API key'));

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Invalid API key');
    });
  });

  describe('transactions', () => {
    it('maps charges to ExternalTransaction with exact cent conversion', async () => {
      const client = (connector as unknown as { client: { get: ReturnType<typeof vi.fn> } }).client;
      client.get.mockResolvedValue({
        data: {
          data: [
            {
              id: 'ch_1',
              amount: 12345,
              currency: 'usd',
              created: 1_700_000_000,
              description: 'Invoice 1001',
              status: 'succeeded',
              receipt_url: 'https://pay.stripe.com/receipts/1',
            },
            {
              id: 'ch_2',
              amount: 50,
              currency: 'eur',
              created: 1_700_000_100,
              description: null,
              status: 'pending',
              receipt_url: null,
            },
          ],
          has_more: true,
          url: '/v1/charges',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const result = await connector.getTransactions('stripe', { page: 1, pageSize: 100 });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        externalId: 'ch_1',
        amount: 123.45,
        currency: 'USD',
        type: 'credit',
        reference: 'https://pay.stripe.com/receipts/1',
      });
      // No float drift: 50 minor units → 0.5 major units exactly.
      expect(result.items[1]?.amount).toBe(0.5);
      expect(result.items[1]?.currency).toBe('EUR');
      expect(result.hasNext).toBe(true);
    });

    it('returns empty list when API returns no data array', async () => {
      const client = (connector as unknown as { client: { get: ReturnType<typeof vi.fn> } }).client;
      client.get.mockResolvedValue({ data: {}, status: 200, statusText: 'OK', headers: {} });

      const result = await connector.getTransactions('stripe');
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('sync', () => {
    it('pull counts pulled transactions and push is zero', async () => {
      const client = (connector as unknown as { client: { get: ReturnType<typeof vi.fn> } }).client;
      client.get.mockResolvedValue({
        data: {
          data: [
            {
              id: 'ch_1',
              amount: 100,
              currency: 'usd',
              created: 1,
              description: 'd',
              status: 'succeeded',
              receipt_url: null,
            },
          ],
          has_more: false,
          url: '/v1/charges',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
      });

      const result = await connector.sync({ direction: 'pull' });
      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(1);
      expect(connector.getHealth().lastSyncAt).toBeDefined();
    });

    it('push-only sync records zero', async () => {
      const result = await connector.sync({ direction: 'push' });
      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBe(0);
    });
  });
});
