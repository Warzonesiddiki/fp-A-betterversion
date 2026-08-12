import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PlaidConnector } from './PlaidConnector';

const mockFetch = vi.fn();

describe('PlaidConnector', () => {
  const baseConfig = {
    id: 'plaid-test',
    name: 'Plaid Test',
    provider: 'plaid',
    auth: {
      type: 'api_key' as const,
      apiKey: { headerName: 'client_id', key: 'client-id-123' },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('construction', () => {
    it('creates connector with client id and secret', () => {
      const connector = new PlaidConnector({ ...baseConfig, secret: 'secret-123' });
      expect(connector.id).toBe('plaid-test');
      expect(connector.provider).toBe('plaid');
    });

    it('throws without a client id', () => {
      expect(
        () =>
          new PlaidConnector({
            ...baseConfig,
            auth: { type: 'api_key', apiKey: { headerName: 'x', key: '' } },
            secret: 'secret-123',
          })
      ).toThrow(/client_id/);
    });

    it('throws without a secret', () => {
      expect(() => new PlaidConnector({ ...baseConfig, secret: '' })).toThrow(/secret/);
    });
  });

  describe('health check', () => {
    it('returns connected when link token is issued', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi
          .fn()
          .mockResolvedValue({ link_token: 'link-sandbox-abc', expiration: '2026-09-01' }),
      });
      const connector = new PlaidConnector({ ...baseConfig, secret: 'secret-123' });

      const health = await connector.checkHealth();
      expect(health.status).toBe('connected');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sandbox.plaid.com/link/token/create',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'PLAID-CLIENT-ID': 'client-id-123',
            'PLAID-SECRET': 'secret-123',
          }),
        })
      );
    });

    it('returns error on API failure with Plaid error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ error_message: 'invalid client_id' }),
      });
      const connector = new PlaidConnector({ ...baseConfig, secret: 'secret-123' });

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toContain('invalid client_id');
    });
  });

  describe('transactions', () => {
    it('returns empty when no access token is stored', async () => {
      const connector = new PlaidConnector({ ...baseConfig, secret: 'secret-123' });
      const result = await connector.getTransactions('acct-1');
      expect(result.items).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('maps transactions with access token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: vi.fn().mockResolvedValue({
          added: [
            {
              transaction_id: 'txn-1',
              account_id: 'acct-1',
              date: '2026-08-01',
              name: 'Grocery Store',
              amount: -42.5,
              iso_currency_code: 'USD',
              pending: false,
            },
            {
              transaction_id: 'txn-2',
              account_id: 'acct-2',
              date: '2026-08-02',
              name: 'Payroll Deposit',
              amount: 2500,
              currency_code: 'USD',
              pending: false,
            },
          ],
          modified: [],
          removed: [],
          has_more: false,
          next_cursor: 'cursor-1',
        }),
      });
      const connector = new PlaidConnector({
        ...baseConfig,
        secret: 'secret-123',
        accessToken: 'access-sandbox-xyz',
      });

      const result = await connector.getTransactions('acct-1');
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        externalId: 'txn-1',
        accountId: 'acct-1',
        amount: 42.5,
        currency: 'USD',
        type: 'credit',
      });
      expect(result.items[1]?.type).toBe('debit');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://sandbox.plaid.com/transactions/sync',
        expect.objectContaining({ body: expect.stringContaining('access-sandbox-xyz') })
      );
    });
  });

  describe('sync', () => {
    it('pull counts zero without access token and push is always zero', async () => {
      const connector = new PlaidConnector({ ...baseConfig, secret: 'secret-123' });

      const pull = await connector.sync({ direction: 'pull' });
      expect(pull.success).toBe(true);
      expect(pull.recordsSynced).toBe(0);

      const push = await connector.sync({ direction: 'push' });
      expect(push.recordsSynced).toBe(0);
    });
  });
});
