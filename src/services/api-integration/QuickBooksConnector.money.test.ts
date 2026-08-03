/**
 * GAP-1 (F-0006) known-answer tests for QuickBooksConnector's money migration.
 *
 * `mapInvoice`'s subtotal aggregates real QuickBooks line-item `Amount`
 * values (currency imported from the QuickBooks Online API) — previously a
 * raw `+` reduce over IEEE-754 doubles. Invoice line amounts, totals, account
 * balances, and transaction amounts are passed through unrounded (no
 * arithmetic is applied to them); record counts, rate-limit values,
 * pagination offsets, and token-expiry timestamps are not currency. Each
 * fixed input asserts the exact cent result with `toBe`; the pre-migration
 * IEEE-754 output is recorded inline.
 */

import { describe, expect, it, vi } from 'vitest';
import { QuickBooksConnector } from './QuickBooksConnector';
import type { ConnectorConfig } from './types';

const config: ConnectorConfig = {
  id: 'qb-money-test',
  name: 'QuickBooks money test',
  provider: 'quickbooks',
  auth: {
    type: 'oauth2',
    oauth2: {
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
      tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      scopes: ['com.intuit.quickbooks.accounting'],
      redirectUri: 'https://app.example.test/callback',
    },
  },
};

type MockClient = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  setOAuthTokens: ReturnType<typeof vi.fn>;
  getOAuthTokens: ReturnType<typeof vi.fn>;
};

function makeConnector(): { connector: QuickBooksConnector; mockClient: MockClient } {
  const connector = new QuickBooksConnector({ ...config, realmId: '123456789' });
  const mockClient: MockClient = {
    get: vi.fn(),
    post: vi.fn(),
    setOAuthTokens: vi.fn(),
    getOAuthTokens: vi.fn(),
  };
  // Replace the protected RestApiClient with a mock (same pattern as the
  // existing QuickBooksConnector.test.ts) for the HTTP-backed getInvoices case.
  (connector as unknown as { client: MockClient }).client = mockClient;
  return { connector, mockClient };
}

/** Build a QB Invoice whose SalesItemLineDetail lines carry the given amounts. */
function invoice(lineAmounts: readonly number[], total = 0, balance = total) {
  return {
    Id: '101',
    DocNumber: 'INV-001',
    TxnDate: '2024-01-15',
    DueDate: '2024-02-15',
    TotalAmt: total,
    Balance: balance,
    CurrencyRef: { value: 'USD' },
    CustomerRef: { value: 'CUST-1' },
    Line: lineAmounts.map((amount, i) => ({
      Id: String(i + 1),
      Description: `Line ${i + 1}`,
      Amount: amount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: {
        UnitPrice: amount,
        Qty: 1,
        AccountRef: { value: 'ACCT-1' },
      },
    })),
  };
}

describe('QuickBooksConnector — money known answers (GAP-1 / F-0006)', () => {
  it('sums invoice line amounts exactly (old float: 0.30000000000000004)', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Invoice: [invoice([0.1, 0.2], 0.3)], totalCount: 1 } },
    });

    const result = await connector.getInvoices();

    expect(result.items[0]?.subtotal).toBe(0.3);
    expect(result.items[0]?.total).toBe(0.3);
  });

  it('keeps three-way line sums exact (old float: 0.6000000000000001)', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Invoice: [invoice([0.1, 0.2, 0.3], 0.6)], totalCount: 1 } },
    });

    const result = await connector.getInvoices();

    expect(result.items[0]?.subtotal).toBe(0.6);
  });

  it('recovers exact tenths from drifted float sums (old float: 0.7000000000000001)', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Invoice: [invoice([0.1, 0.2, 0.4], 0.7)], totalCount: 1 } },
    });

    const result = await connector.getInvoices();

    expect(result.items[0]?.subtotal).toBe(0.7);
  });

  it('recovers exact cents from drifted float sums (old float: 1234.6299999999999)', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Invoice: [invoice([1234.56, 0.07], 1234.63)], totalCount: 1 } },
    });

    const result = await connector.getInvoices();

    expect(result.items[0]?.subtotal).toBe(1234.63);
  });

  it('cent-rounds the aggregate with declared half-up (old float: 1.005)', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Invoice: [invoice([1.005], 1.005)], totalCount: 1 } },
    });

    const result = await connector.getInvoices();

    // 1.005 → half-up cents = 1.01; the old float code returned the raw 1.005.
    expect(result.items[0]?.subtotal).toBe(1.01);
    expect(result.items[0]?.lineItems[0]?.amount).toBe(1.005);
  });

  it('keeps cent-exact sums unchanged (control: 33.3333333 + 66.6666667)', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: {
        QueryResponse: { Invoice: [invoice([33.3333333, 66.6666667], 100)], totalCount: 1 },
      },
    });

    const result = await connector.getInvoices();

    expect(result.items[0]?.subtotal).toBe(100);
  });

  it('returns an exact zero subtotal when the invoice has no line items', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Invoice: [invoice([], 0)], totalCount: 1 } },
    });

    const result = await connector.getInvoices();

    expect(result.items[0]?.subtotal).toBe(0);
    expect(result.items[0]?.lineItems).toEqual([]);
  });

  it('passes through line-item amounts, unit prices, total, and tax unrounded (import contract)', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: {
        QueryResponse: {
          Invoice: [
            {
              Id: '202',
              DocNumber: 'INV-002',
              TxnDate: '2024-02-01',
              DueDate: '2024-03-01',
              TotalAmt: 12.34,
              Balance: 12.34,
              CurrencyRef: { value: 'USD' },
              CustomerRef: { value: 'CUST-2' },
              Line: [
                {
                  Id: '1',
                  Description: 'Advisory',
                  Amount: 9.99,
                  DetailType: 'SalesItemLineDetail',
                  SalesItemLineDetail: {
                    UnitPrice: 4.995,
                    Qty: 2,
                    AccountRef: { value: 'ACCT-2' },
                  },
                },
              ],
            },
          ],
          totalCount: 1,
        },
      },
    });

    const result = await connector.getInvoices();
    const item = result.items[0];

    expect(item?.lineItems[0]?.amount).toBe(9.99);
    expect(item?.lineItems[0]?.unitPrice).toBe(4.995);
    expect(item?.total).toBe(12.34);
    expect(item?.tax).toBe(0);
  });
});
