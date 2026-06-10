import { describe, it, expect, vi, beforeEach } from 'vitest';
import { XeroConnector } from './XeroConnector';

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

describe('XeroConnector', () => {
  let connector: XeroConnector;
  const mockConfig = {
    id: 'xero-test',
    name: 'Xero Test',
    provider: 'xero',
    auth: {
      type: 'oauth2' as const,
      oauth2: {
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        authorizationUrl: 'https://login.xero.com/identity/connect/authorize',
        tokenUrl: 'https://identity.xero.com/connect/token',
        scopes: ['accounting.transactions', 'accounting.contacts', 'accounting.settings'],
        redirectUri: 'https://app.example.com/callback',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    connector = new XeroConnector(mockConfig);
  });

  describe('construction', () => {
    it('should create connector with correct properties', () => {
      expect(connector.id).toBe('xero-test');
      expect(connector.name).toBe('Xero Test');
      expect(connector.provider).toBe('xero');
    });
  });

  describe('health check', () => {
    it('should return connected status on success', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: { Accounts: [{ AccountID: '1', Name: 'Test', Type: 'BANK', Status: 'ACTIVE' }] },
      });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;
      (connector as unknown as { tenantId: string }).tenantId = 'test-tenant';

      const health = await connector.checkHealth();
      expect(health.status).toBe('connected');
    });

    it('should return error status on failure', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Unauthorized'));
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;
      (connector as unknown as { tenantId: string }).tenantId = 'test-tenant';

      const health = await connector.checkHealth();
      expect(health.status).toBe('error');
      expect(health.lastError).toBe('Unauthorized');
    });
  });

  describe('getAccounts', () => {
    it('should fetch and map accounts', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          Accounts: [
            {
              AccountID: 'acct-1',
              Code: '001',
              Name: 'Business Bank Account',
              Type: 'BANK',
              AccountClass: 'ASSET',
              Status: 'ACTIVE',
              CurrencyCode: 'NZD',
              ReportingCode: 'A-ASSET',
              UpdatedDateUTC: '/Date(1705305600000+0000)/',
            },
          ],
        },
      });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getAccounts({ page: 1, pageSize: 50 });

      expect(result.items).toHaveLength(1);
      expect(result!.items[0]!.externalId).toBe('acct-1');
      expect(result!.items[0]!.name).toBe('Business Bank Account');
      expect(result!.items[0]!.type).toBe('asset');
      expect(result!.items[0]!.currency).toBe('NZD');
      expect(result!.items[0]!.active).toBe(true);
    });
  });

  describe('getInvoices', () => {
    it('should fetch and map invoices', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          Invoices: [
            {
              InvoiceID: 'inv-1',
              InvoiceNumber: 'INV-001',
              Type: 'ACCREC',
              Date: '2024-01-15T00:00:00',
              DueDate: '2024-02-15T00:00:00',
              Status: 'AUTHORISED',
              LineAmountTypes: 'Exclusive',
              SubTotal: 1000,
              TotalTax: 150,
              Total: 1150,
              CurrencyCode: 'NZD',
              Contact: { ContactID: 'contact-1' },
              LineItems: [
                {
                  LineItemID: 'line-1',
                  Description: 'Web Development',
                  Quantity: 10,
                  UnitAmount: 100,
                  LineAmount: 1000,
                  AccountCode: '200',
                },
              ],
              UpdatedDateUTC: '/Date(1705305600000+0000)/',
            },
          ],
        },
      });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getInvoices({ page: 1, pageSize: 50 });

      expect(result.items).toHaveLength(1);
      expect(result!.items[0]!.externalId).toBe('inv-1');
      expect(result!.items[0]!.number).toBe('INV-001');
      expect(result!.items[0]!.status).toBe('sent');
      expect(result!.items[0]!.total).toBe(1150);
      expect(result!.items[0]!.tax).toBe(150);
      expect(result!.items[0]!.lineItems).toHaveLength(1);
      expect(result!.items[0]!.customerId).toBe('contact-1');
    });
  });

  describe('getTransactions', () => {
    it('should fetch bank transactions for an account', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          BankTransactions: [
            {
              BankTransactionID: 'txn-1',
              Type: 'SPEND',
              Date: '2024-01-15T00:00:00',
              Reference: 'Office supplies',
              Status: 'AUTHORISED',
              Total: 250,
              CurrencyCode: 'NZD',
              BankAccount: { AccountID: 'bank-1' },
              LineItems: [
                {
                  LineItemID: 'line-1',
                  Description: 'Printer paper',
                  Quantity: 5,
                  UnitAmount: 50,
                  LineAmount: 250,
                  AccountCode: '400',
                },
              ],
              UpdatedDateUTC: '/Date(1705305600000+0000)/',
            },
          ],
        },
      });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getTransactions('bank-1', { page: 1, pageSize: 50 });

      expect(result.items).toHaveLength(1);
      expect(result!.items[0]!.externalId).toBe('txn-1-line-1');
      expect(result!.items[0]!.amount).toBe(250);
      expect(result!.items[0]!.type).toBe('credit');
    });
  });

  describe('getBudgets', () => {
    it('should fetch and map budgets', async () => {
      const mockGet = vi.fn().mockResolvedValue({
        data: {
          Budgets: [
            {
              BudgetID: 'budget-1',
              Type: 'OVERALL',
              Description: 'FY2024 Budget',
              UpdatedDateUTC: '/Date(1705305600000+0000)/',
              BudgetLines: [
                {
                  AccountID: 'acct-1',
                  AccountCode: '200',
                  AccountName: 'Revenue',
                  BudgetAmounts: [
                    { Period: '2024-01', Amount: 50000 },
                    { Period: '2024-02', Amount: 55000 },
                  ],
                },
              ],
            },
          ],
        },
      });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getBudgets({ page: 1, pageSize: 50 });

      expect(result.items).toHaveLength(1);
      expect(result!.items[0]!.externalId).toBe('budget-1');
      expect(result!.items[0]!.name).toBe('FY2024 Budget');
      expect(result!.items[0]!.entries).toHaveLength(2);
    });

    it('should return empty when budgets API not available', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('Feature not available'));
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.getBudgets();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('account type mapping', () => {
    it('should map Xero account types correctly', async () => {
      const types = [
        { xeroType: 'BANK', expected: 'asset' },
        { xeroType: 'CURRENT', expected: 'asset' },
        { xeroType: 'FIXED', expected: 'asset' },
        { xeroType: 'CURRLIAB', expected: 'liability' },
        { xeroType: 'TERMLIAB', expected: 'liability' },
        { xeroType: 'EQUITY', expected: 'equity' },
        { xeroType: 'REVENUE', expected: 'revenue' },
        { xeroType: 'EXPENSE', expected: 'expense' },
        { xeroType: 'DIRECTCOSTS', expected: 'expense' },
        { xeroType: 'OVERHEADS', expected: 'expense' },
      ];

      for (const { xeroType, expected } of types) {
        const mockGet = vi.fn().mockResolvedValue({
          data: {
            Accounts: [
              {
                AccountID: '1',
                Code: '001',
                Name: 'Test',
                Type: xeroType,
                Status: 'ACTIVE',
                UpdatedDateUTC: '/Date(1705305600000+0000)/',
              },
            ],
          },
        });

        (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

        const result = await connector.getAccounts();
        expect(result!.items[0]!.type).toBe(expected);
      }
    });
  });

  describe('invoice status mapping', () => {
    it('should map invoice statuses correctly', async () => {
      const statuses = [
        { xeroStatus: 'DRAFT', expected: 'draft' },
        { xeroStatus: 'SUBMITTED', expected: 'sent' },
        { xeroStatus: 'AUTHORISED', expected: 'sent' },
        { xeroStatus: 'PAID', expected: 'paid' },
        { xeroStatus: 'VOIDED', expected: 'void' },
      ];

      for (const { xeroStatus, expected } of statuses) {
        const mockGet = vi.fn().mockResolvedValue({
          data: {
            Invoices: [
              {
                InvoiceID: '1',
                InvoiceNumber: 'INV-001',
                Type: 'ACCREC',
                Date: '2024-01-15',
                DueDate: '2024-02-15',
                Status: xeroStatus,
                LineAmountTypes: 'Exclusive',
                SubTotal: 100,
                TotalTax: 15,
                Total: 115,
                CurrencyCode: 'NZD',
                Contact: { ContactID: 'c1' },
                LineItems: [],
                UpdatedDateUTC: '/Date(1705305600000+0000)/',
              },
            ],
          },
        });

        (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

        const result = await connector.getInvoices();
        expect(result!.items[0]!.status).toBe(expected);
      }
    });
  });

  describe('connect', () => {
    it('should return true when health check passes', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: { Accounts: [] } });
      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;
      (connector as unknown as { tenantId: string }).tenantId = 'test-tenant';

      const result = await connector.connect();
      expect(result).toBe(true);
    });
  });

  describe('sync', () => {
    it('should pull data and return sync result', async () => {
      const mockGet = vi
        .fn()
        .mockResolvedValueOnce({ data: { Accounts: [] } })
        .mockResolvedValueOnce({ data: { BankTransactions: [] } })
        .mockResolvedValueOnce({ data: { Invoices: [] } })
        .mockResolvedValueOnce({ data: { Budgets: [] } });

      (connector as unknown as { client: { get: typeof mockGet } }).client.get = mockGet;

      const result = await connector.sync({ direction: 'pull' });
      expect(result.success).toBe(true);
    });
  });
});
