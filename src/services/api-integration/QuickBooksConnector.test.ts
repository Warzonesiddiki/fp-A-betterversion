import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickBooksConnector } from './QuickBooksConnector';

// Mock the RestApiClient
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

describe('QuickBooksConnector', () => {
  let connector: QuickBooksConnector;
  const mockConfig = {
    id: 'qb-test',
    name: 'QuickBooks Test',
    provider: 'quickbooks',
    auth: {
      type: 'oauth2' as const,
      oauth2: {
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
        tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        scopes: ['com.intuit.quickbooks.accounting'],
        redirectUri: 'https://app.example.com/callback',
      },
    },
    realmId: '123456789',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new QuickBooksConnector(mockConfig);
  });

  describe('construction', () => {
    it('should create connector with correct properties', () => {
      expect(connector.id).toBe('qb-test');
      expect(connector.name).toBe('QuickBooks Test');
      expect(connector.provider).toBe('quickbooks');
    });
  });

  describe('health check', () => {
    it('should return connected status on success', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          QueryResponse: {
            CompanyInfo: [{ CompanyName: 'Test Co', Id: '1' }],
          },
        },
        headers: { 'x-ratelimit-remaining': '499', 'x-ratelimit-reset': '60' },
      });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const health = await connector.checkHealth();
      expect(health.status).toBe('connected');
      expect(health.rateLimitRemaining).toBe(499);
    });

    it('should return error status on failure', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Network error'));
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Network error');
    });
  });

  describe('getAccounts', () => {
    it('should fetch and map accounts', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          QueryResponse: {
            Account: [
              {
                Id: '1',
                Name: 'Checking',
                FullyQualifiedName: 'Assets:Checking',
                AccountType: 'Bank',
                AccountSubType: 'CheckingAccount',
                Classification: 'Asset',
                CurrencyRef: { value: 'USD' },
                CurrentBalance: 10000,
                Active: true,
                MetaData: { LastUpdatedTime: '2024-01-15T10:00:00Z' },
              },
            ],
            totalCount: 1,
          },
        },
      });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getAccounts({ page: 1, pageSize: 50 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        externalId: '1',
        name: 'Assets:Checking',
        type: 'asset',
        subtype: 'CheckingAccount',
        currency: 'USD',
        balance: 10000,
        active: true,
        lastUpdated: new Date('2024-01-15T10:00:00Z').getTime(),
      });
    });
  });

  describe('getInvoices', () => {
    it('should fetch and map invoices', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          QueryResponse: {
            Invoice: [
              {
                Id: '101',
                DocNumber: 'INV-001',
                TxnDate: '2024-01-15',
                DueDate: '2024-02-15',
                TotalAmt: 1500,
                Balance: 1500,
                CurrencyRef: { value: 'USD' },
                CustomerRef: { value: 'CUST-1' },
                Line: [
                  {
                    Description: 'Consulting',
                    Amount: 1500,
                    DetailType: 'SalesItemLineDetail',
                    SalesItemLineDetail: {
                      UnitPrice: 150,
                      Qty: 10,
                      AccountRef: { value: 'ACCT-1' },
                    },
                  },
                ],
              },
            ],
            totalCount: 1,
          },
        },
      });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getInvoices({ page: 1, pageSize: 50 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].externalId).toBe('101');
      expect(result.items[0].number).toBe('INV-001');
      expect(result.items[0].total).toBe(1500);
      expect(result.items[0].lineItems).toHaveLength(1);
    });
  });

  describe('connect', () => {
    it('should return true when health check passes', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: { QueryResponse: { CompanyInfo: [{ CompanyName: 'Test Co', Id: '1' }] } },
        headers: {},
      });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.connect();
      expect(result).toBe(true);
    });

    it('should return false when health check fails', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Auth failed'));
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.connect();
      expect(result).toBe(false);
    });
  });

  describe('sync', () => {
    it('should pull data and return sync result', async () => {
      const mockGet = vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            QueryResponse: {
              Account: [
                {
                  Id: '1',
                  Name: 'Test',
                  AccountType: 'Bank',
                  Classification: 'Asset',
                  Active: true,
                  MetaData: { LastUpdatedTime: '2024-01-01' },
                },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          data: { QueryResponse: { JournalEntry: [] } },
        })
        .mockResolvedValueOnce({
          data: { QueryResponse: { Invoice: [] } },
        });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.sync({ direction: 'pull' });

      expect(result.success).toBe(true);
      expect(result.recordsSynced).toBeGreaterThanOrEqual(1);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('account type mapping', () => {
    it('should map QuickBooks account types correctly', async () => {
      const classifications = [
        { classification: 'Asset', expected: 'asset' },
        { classification: 'Liability', expected: 'liability' },
        { classification: 'Equity', expected: 'equity' },
        { classification: 'Income', expected: 'revenue' },
        { classification: 'Expense', expected: 'expense' },
      ];

      for (const { classification, expected } of classifications) {
        const mockGet = vi.fn().mockResolvedValue({
          data: {
            QueryResponse: {
              Account: [
                {
                  Id: '1',
                  Name: 'Test',
                  FullyQualifiedName: 'Test',
                  AccountType: 'Other',
                  Classification: classification,
                  Active: true,
                  MetaData: { LastUpdatedTime: '2024-01-01' },
                },
              ],
            },
          },
        });

        (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

        const result = await connector.getAccounts();
        expect(result.items[0].type).toBe(expected);
      }
    });
  });
});
