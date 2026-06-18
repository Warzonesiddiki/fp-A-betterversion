import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SageConnector } from './SageConnector';
import type { ConnectorConfig } from './types';

// Mock the RestApiClient — same pattern as the other connector tests.
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
      defaults = { baseURL: 'https://api.intacct.com/ia/api/v1.0' };
    },
  };
});

describe('SageConnector', () => {
  let connector: SageConnector;
  const mockConfig: ConnectorConfig = {
    id: 'sage-test',
    name: 'Sage Test',
    provider: 'sage',
    auth: {
      type: 'oauth2_sage',
      oauth2: {
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        authorizationUrl: 'https://api.intacct.com/oauth2/authorize',
        tokenUrl: 'https://api.intacct.com/oauth2/token',
        scopes: ['company-profile', 'general-ledger', 'accounts-receivable'],
        redirectUri: 'https://app.example.com/callback',
        sender: {
          companyId: 'ACME-INTACCT-CO',
          userId: 'fpanda-admin',
          password: 'fake-intacct-password',
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new SageConnector(mockConfig);
  });

  describe('construction', () => {
    it('should create connector with correct properties', () => {
      expect(connector.id).toBe('sage-test');
      expect(connector.name).toBe('Sage Test');
      expect(connector.provider).toBe('sage');
    });

    it('should throw if oauth2_sage auth is missing', () => {
      expect(
        () =>
          new SageConnector({
            ...mockConfig,
            auth: { type: 'bearer', bearer: { token: 't' } },
          })
      ).toThrow('SageConnector requires ConnectorConfig.auth with type="oauth2_sage"');
    });

    it('should throw if sender credentials are missing', () => {
      expect(
        () =>
          new SageConnector({
            ...mockConfig,
            auth: {
              ...mockConfig.auth,
              oauth2: {
                ...(mockConfig.auth as unknown as { oauth2: Record<string, unknown> }).oauth2,
                sender: { companyId: '', userId: '', password: '' },
              },
            },
          })
      ).toThrow('sender with companyId, userId, password');
    });
  });

  describe('health check', () => {
    it('should return connected status on success', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: { result: { items: [{ RECORDNO: '1' }] } },
        headers: { 'x-ratelimit-remaining': '140', 'x-ratelimit-reset': '1700000060' },
      });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const health = await connector.checkHealth();
      expect(health.status).toBe('connected');
      expect(health.rateLimitRemaining).toBe(140);
    });

    it('should return error when fault is present', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: { fault: { description: 'Invalid session' } },
        headers: {},
      });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Invalid session');
    });

    it('should return error on network failure', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Network error'));
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Network error');
    });
  });

  describe('OAuth code exchange', () => {
    it('should exchange code for tokens', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          access_token: 'sage-access-token',
          refresh_token: 'sage-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      });
      (connector as unknown as { client: { post: typeof mockPost } }).client.post = mockPost;

      const tokens = await connector.exchangeCodeForTokens('auth-code', 'https://app/cb');
      expect(tokens.accessToken).toBe('sage-access-token');
      expect(tokens.tokenType).toBe('Bearer');
    });

    it('should throw on token endpoint error', async () => {
      const mockPost = vi.fn().mockRejectedValue(new Error('401 Unauthorized'));
      (connector as unknown as { client: { post: typeof mockPost } }).client.post = mockPost;

      await expect(connector.exchangeCodeForTokens('code', 'uri')).rejects.toThrow(
        'Sage OAuth2 code exchange failed'
      );
    });
  });

  describe('OAuth token refresh', () => {
    it('should refresh with existing refresh token', async () => {
      const mockGet = vi.fn().mockReturnValue({
        refreshToken: 'existing-refresh',
      });
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          access_token: 'new-access',
          refresh_token: 'rotated-refresh',
          token_type: 'Bearer',
          expires_in: 3600,
        },
      });
      (
        connector as unknown as {
          client: { getOAuthTokens: typeof mockGet; post: typeof mockPost };
        }
      ).client.getOAuthTokens = mockGet;
      (
        connector as unknown as {
          client: { getOAuthTokens: typeof mockGet; post: typeof mockPost };
        }
      ).client.post = mockPost;

      const tokens = await connector.refreshAccessToken();
      expect(tokens.accessToken).toBe('new-access');
      expect(tokens.refreshToken).toBe('rotated-refresh');
    });

    it('should preserve refresh token if rotation not returned', async () => {
      const mockGet = vi.fn().mockReturnValue({
        refreshToken: 'preserved-refresh',
      });
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          access_token: 'new-access',
          // No new refresh_token
          token_type: 'Bearer',
          expires_in: 3600,
        },
      });
      (
        connector as unknown as {
          client: { getOAuthTokens: typeof mockGet; post: typeof mockPost };
        }
      ).client.getOAuthTokens = mockGet;
      (
        connector as unknown as {
          client: { getOAuthTokens: typeof mockGet; post: typeof mockPost };
        }
      ).client.post = mockPost;

      const tokens = await connector.refreshAccessToken();
      expect(tokens.refreshToken).toBe('preserved-refresh');
    });

    it('should throw if no refresh token available', async () => {
      const mockGet = vi.fn().mockReturnValue(null);
      (
        connector as unknown as { client: { getOAuthTokens: typeof mockGet } }
      ).client.getOAuthTokens = mockGet;

      await expect(connector.refreshAccessToken()).rejects.toThrow('no refresh token');
    });
  });

  describe('getAccounts', () => {
    it('should fetch and map GL accounts', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          result: {
            items: [
              {
                RECORDNO: '100',
                ACCOUNTNO: '1000',
                TITLE: 'Cash - Operating',
                ACCOUNTTYPE: 'bank',
                NORMALBALANCE: 'debit',
                CURRENCY: 'USD',
                STATUS: 'active',
                WHENCREATED: '2024-01-01T00:00:00Z',
                WHENMODIFIED: '2026-06-01T00:00:00Z',
              },
              {
                RECORDNO: '200',
                ACCOUNTNO: '2000',
                TITLE: 'Accounts Payable',
                ACCOUNTTYPE: 'accountspayable',
                NORMALBALANCE: 'credit',
                CURRENCY: 'USD',
                STATUS: 'active',
                WHENCREATED: '2024-01-01T00:00:00Z',
                WHENMODIFIED: '2026-06-01T00:00:00Z',
              },
              {
                RECORDNO: '300',
                ACCOUNTNO: '3000',
                TITLE: 'Revenue',
                ACCOUNTTYPE: 'income',
                NORMALBALANCE: 'credit',
                CURRENCY: 'USD',
                STATUS: 'inactive',
                WHENCREATED: '2024-01-01T00:00:00Z',
                WHENMODIFIED: '2026-06-01T00:00:00Z',
              },
            ],
            totalCount: 3,
            numPages: 1,
          },
        },
      });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getAccounts({ pageSize: 100 });
      expect(result.items).toHaveLength(3);
      expect(result.items[0]!.name).toBe('Cash - Operating');
      expect(result.items[0]!.type).toBe('asset');
      expect(result.items[1]!.type).toBe('liability');
      expect(result.items[2]!.type).toBe('revenue');
      expect(result.items[2]!.active).toBe(false);
    });
  });

  describe('getTransactions', () => {
    it('should fetch GL entries for an account via readByQuery', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          result: {
            items: [
              {
                RECORDNO: 'JE-1',
                BATCHNO: 'B-1',
                JOURNAL: 'GJ',
                ENTRYDATE: '2026-06-15',
                ACCOUNTNO: '1000',
                DEBITAMOUNT: 1000,
                CREDITAMOUNT: 0,
                DESCRIPTION: 'Customer payment',
                DOCNUMBER: 'INV-001',
                CURRENCY: 'USD',
                WHENMODIFIED: '2026-06-15T00:00:00Z',
              },
              {
                RECORDNO: 'JE-2',
                BATCHNO: 'B-1',
                JOURNAL: 'GJ',
                ENTRYDATE: '2026-06-15',
                ACCOUNTNO: '1000',
                DEBITAMOUNT: 0,
                CREDITAMOUNT: 500,
                DESCRIPTION: 'Vendor payment',
                DOCNUMBER: 'BILL-001',
                CURRENCY: 'USD',
                WHENMODIFIED: '2026-06-15T00:00:00Z',
              },
            ],
            totalCount: 2,
            numPages: 1,
          },
        },
      });
      (connector as unknown as { client: { post: typeof mockPost } }).client.post = mockPost;

      const result = await connector.getTransactions('1000', { pageSize: 100 });
      expect(result.items).toHaveLength(2);
      expect(result.items[0]!.type).toBe('debit');
      expect(result.items[0]!.amount).toBe(1000);
      expect(result.items[1]!.type).toBe('credit');
      expect(result.items[1]!.amount).toBe(500);

      // Verify the SOQL-like query was constructed
      const callArgs = mockPost.mock.calls[0]?.[1] as { query: string };
      expect(callArgs.query).toContain('FROM GLEntry');
      expect(callArgs.query).toContain("ACCOUNTNO = '1000'");
    });
  });

  describe('getInvoices', () => {
    it('should fetch AR invoices', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          result: {
            items: [
              {
                RECORDNO: 'AR-1',
                RECORDID: 'INV-100',
                CUSTOMERID: 'C-1',
                CUSTOMERNAME: 'Acme Corp',
                DATE: '2026-06-01',
                DUEDATE: '2026-07-01',
                TOTAMOUNT: 5000,
                TOTPAID: 0,
                BALANCEAMOUNT: 5000,
                CURRENCY: 'USD',
                STATE: 'Posted',
                WHENMODIFIED: '2026-06-01T00:00:00Z',
              },
              {
                RECORDNO: 'AR-2',
                RECORDID: 'INV-101',
                CUSTOMERID: 'C-2',
                DATE: '2026-06-02',
                DUEDATE: '2026-07-02',
                TOTAMOUNT: 3000,
                TOTPAID: 3000,
                BALANCEAMOUNT: 0,
                CURRENCY: 'USD',
                STATE: 'Paid',
                WHENMODIFIED: '2026-06-15T00:00:00Z',
              },
            ],
            totalCount: 2,
            numPages: 1,
          },
        },
      });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getInvoices({ pageSize: 100 });
      expect(result.items).toHaveLength(2);
      expect(result.items[0]!.status).toBe('sent'); // Posted → sent
      expect(result.items[1]!.status).toBe('paid');
    });
  });

  describe('aggregateGLBalance', () => {
    it('should roll up debits/credits/netChange correctly', () => {
      const entries = [
        {
          RECORDNO: '1',
          BATCHNO: 'B',
          JOURNAL: 'GJ',
          ENTRYDATE: '2026-06-01',
          ACCOUNTNO: '1000',
          DEBITAMOUNT: 1000,
          CREDITAMOUNT: 0,
          CURRENCY: 'USD',
          WHENMODIFIED: '',
        },
        {
          RECORDNO: '2',
          BATCHNO: 'B',
          JOURNAL: 'GJ',
          ENTRYDATE: '2026-06-02',
          ACCOUNTNO: '1000',
          DEBITAMOUNT: 500,
          CREDITAMOUNT: 0,
          CURRENCY: 'USD',
          WHENMODIFIED: '',
        },
        {
          RECORDNO: '3',
          BATCHNO: 'B',
          JOURNAL: 'GJ',
          ENTRYDATE: '2026-06-03',
          ACCOUNTNO: '1000',
          DEBITAMOUNT: 0,
          CREDITAMOUNT: 300,
          CURRENCY: 'USD',
          WHENMODIFIED: '',
        },
      ];

      const balance = connector.aggregateGLBalance(entries, '1000');
      expect(balance.accountId).toBe('1000');
      expect(balance.totalDebits).toBe(1500);
      expect(balance.totalCredits).toBe(300);
      expect(balance.netChange).toBe(1200);
      expect(balance.entryCount).toBe(3);
    });

    it('should handle empty entry list', () => {
      const balance = connector.aggregateGLBalance([], '1000');
      expect(balance.totalDebits).toBe(0);
      expect(balance.totalCredits).toBe(0);
      expect(balance.netChange).toBe(0);
      expect(balance.entryCount).toBe(0);
    });
  });
});
