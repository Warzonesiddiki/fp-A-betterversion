import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetSuiteConnector } from './NetSuiteConnector';
import type { ConnectorConfig } from './types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeConfig(
  overrides: Partial<ConnectorConfig['auth'] & { baseUrl?: string }> = {}
): ConnectorConfig {
  return {
    id: 'ns-1',
    name: 'NetSuite Prod',
    provider: 'netsuite',
    baseUrl: overrides.baseUrl,
    auth: {
      type: 'oauth1',
      oauth1: {
        accountId: 'TSTDRV1234567',
        consumerKey: 'consumer-key',
        consumerSecret: 'consumer-secret',
        tokenId: 'token-id',
        tokenTokenSecret: 'token-secret',
        realm: 'TSTDRV1234567',
        signatureMethod: 'HMAC-SHA256',
      },
    } as unknown as ConnectorConfig['auth'],
  };
}

const accountPage = {
  count: 3,
  hasMore: false,
  offset: 0,
  totalResults: 3,
  items: [
    {
      id: '123',
      type: 'account',
      attributes: {},
      acctNumber: '1000',
      acctName: 'Cash',
      acctType: 'Bank',
      currency: { id: '1', refName: 'USD' },
      lastModifiedDate: '2024-01-15T00:00:00Z',
      isInactive: false,
    },
    {
      id: '456',
      type: 'account',
      attributes: {},
      acctName: 'Sales Revenue',
      acctType: 'Income',
    },
    {
      id: '789',
      type: 'account',
      attributes: {},
      acctName: 'Mystery',
      acctType: 'Something Else',
      isInactive: true,
    },
  ],
};

const transactionPage = {
  count: 2,
  hasMore: false,
  offset: 0,
  items: [
    {
      id: 't1',
      type: 'journalEntry',
      attributes: {},
      tranId: 'JE-1',
      date: '2024-01-10',
      entity: { id: 'e1', refName: 'Acme Corp' },
      memo: 'Jan accrual',
      total: 500,
      status: 'Posted',
    },
    {
      id: 't2',
      type: 'vendorBill',
      attributes: {},
      date: '2024-01-11',
      total: -250.5,
    },
  ],
};

const invoicePage = {
  count: 1,
  hasMore: false,
  offset: 0,
  items: [
    {
      id: 'inv1',
      type: 'invoice',
      attributes: {},
      tranId: 'INV-100',
      date: '2024-01-12',
      entity: { id: 'e2', refName: 'Beta LLC' },
      total: 1200,
      status: 'A',
    },
  ],
};

const budgetPage = {
  count: 2,
  hasMore: false,
  offset: 0,
  items: [
    {
      id: 'b1',
      type: 'budget',
      attributes: {},
      budgetName: 'FY2024 OpEx',
      account: { id: 'a1', refName: 'Salaries' },
      periodAmountList: [
        { period: { id: 'p1', refName: 'Jan 2024' }, amount: 1000 },
        { period: { id: 'p2', refName: 'Feb 2024' }, amount: 1200 },
      ],
    },
    {
      id: 'b2',
      type: 'budget',
      attributes: {},
      budgetName: 'FY2024 Capex',
      amount: 50000,
      fiscalYear: { id: 'fy1', refName: '2024' },
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NetSuiteConnector', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requires an oauth1 auth payload at construction', () => {
    expect(() => new NetSuiteConnector(makeConfig())).not.toThrow();

    expect(
      () =>
        new NetSuiteConnector({ ...makeConfig(), auth: undefined } as unknown as ConnectorConfig)
    ).toThrow(/NetSuiteConnector requires/);

    expect(
      () =>
        new NetSuiteConnector({
          ...makeConfig(),
          auth: { type: 'oauth2' },
        } as unknown as ConnectorConfig)
    ).toThrow(/NetSuiteConnector requires/);

    expect(
      () =>
        new NetSuiteConnector({
          ...makeConfig(),
          auth: { type: 'oauth1' },
        } as unknown as ConnectorConfig)
    ).toThrow(/NetSuiteConnector requires/);
  });

  it('signs requests with an OAuth1 Authorization header and calls fetch', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [], hasMore: false }) });
    const connector = new NetSuiteConnector(makeConfig());

    await connector.getAccounts();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('TSTDRV1234567.suitetalk.api.netsuite.com');
    expect(String(url)).toContain('limit=100');
    expect(String(url)).toContain('offset=0');
    expect(init.method).toBe('GET');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^OAuth realm="TSTDRV1234567", oauth_consumer_key=/);
    expect(headers.Authorization).toContain('oauth_signature_method="HMAC-SHA256"');
    expect(headers.Authorization).toContain('oauth_signature=');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('getAccounts maps NetSuite account types and pagination', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => accountPage });
    const connector = new NetSuiteConnector(makeConfig());

    const result = await connector.getAccounts({ page: 2, pageSize: 50 });

    expect(fetchMock.mock.calls[0]![0]).toContain('limit=50');
    expect(fetchMock.mock.calls[0]![0]).toContain('offset=50');
    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toMatchObject({
      externalId: '123',
      name: 'Cash',
      type: 'asset',
      subtype: 'Bank',
      currency: 'USD',
      active: true,
    });
    expect(result.items[1]).toMatchObject({ type: 'revenue', currency: 'USD' });
    expect(result.items[2]).toMatchObject({ type: 'asset', active: false });
    expect(result.total).toBe(3);
    expect(result.hasNext).toBe(false);
  });

  it('getAccounts defaults pageSize to 100 and handles empty items', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: null, hasMore: false }) });
    const connector = new NetSuiteConnector(makeConfig());

    const result = await connector.getAccounts();
    expect(fetchMock.mock.calls[0]![0]).toContain('limit=100');
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('throws a descriptive error when the API responds with failure', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => '{"message":"bad token"}',
    });
    const connector = new NetSuiteConnector(makeConfig());

    await expect(connector.getAccounts()).rejects.toThrow(/NetSuite GET.*failed: 401 Unauthorized/);
  });

  it('getTransactions maps debits/credits and falls back to empty on error', async () => {
    const connector = new NetSuiteConnector(makeConfig());

    fetchMock.mockResolvedValue({ ok: true, json: async () => transactionPage });
    const ok = await connector.getTransactions('123', { page: 1, pageSize: 25 });
    expect(ok.items).toHaveLength(2);
    expect(ok.items[0]).toMatchObject({
      externalId: 't1',
      accountId: '123',
      description: 'Jan accrual',
      amount: 500,
      type: 'debit',
      reference: 'JE-1',
      metadata: { status: 'Posted' },
    });
    expect(ok.items[1]).toMatchObject({ type: 'credit', amount: 250.5, description: 'vendorBill' });

    fetchMock.mockRejectedValue(new Error('network down'));
    const empty = await connector.getTransactions('123');
    expect(empty).toEqual({ items: [], total: 0, page: 1, pageSize: 100, hasNext: false });
  });

  it('getInvoices maps invoices and falls back to empty on error', async () => {
    const connector = new NetSuiteConnector(makeConfig());

    fetchMock.mockResolvedValue({ ok: true, json: async () => invoicePage });
    const ok = await connector.getInvoices();
    expect(ok.items).toEqual([
      expect.objectContaining({
        externalId: 'inv1',
        number: 'INV-100',
        customerId: 'e2',
        total: 1200,
        currency: 'USD',
      }),
    ]);

    fetchMock.mockRejectedValue(new Error('boom'));
    const empty = await connector.getInvoices();
    expect(empty.items).toEqual([]);
  });

  it('getBudgets maps period lists and single amounts', async () => {
    const connector = new NetSuiteConnector(makeConfig());

    fetchMock.mockResolvedValue({ ok: true, json: async () => budgetPage });
    const ok = await connector.getBudgets();

    expect(ok.items).toHaveLength(2);
    expect(ok.items[0]!.entries).toHaveLength(2);
    expect(ok.items[0]!.entries[0]).toEqual({
      accountId: 'a1',
      category: 'FY2024 OpEx',
      amount: 1000,
      period: 'Jan 2024',
    });
    expect(ok.items[1]!.entries).toEqual([
      { accountId: '', category: 'FY2024 Capex', amount: 50000, period: '2024' },
    ]);
    expect(ok.items[1]!.fiscalYear).toBe('2024');
  });

  it('getBudgets falls back to empty on error', async () => {
    fetchMock.mockRejectedValue(new Error('boom'));
    const connector = new NetSuiteConnector(makeConfig());
    const empty = await connector.getBudgets();
    expect(empty.items).toEqual([]);
  });

  it('performHealthCheck reports connected on success and error on failure', async () => {
    const connector = new NetSuiteConnector(makeConfig());

    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [], hasMore: false }) });
    const health = await connector.checkHealth();
    expect(health.status).toBe('connected');
    expect(connector.getHealth().status).toBe('connected');

    fetchMock.mockRejectedValue(new Error('timeout'));
    const bad = await connector.checkHealth();
    expect(bad.status).toBe('error');
    expect(bad.lastError).toBe('timeout');
  });

  it('connect() reflects health status and sync() pulls records end-to-end', async () => {
    const connector = new NetSuiteConnector(makeConfig());

    // Sequence of responses: health-check account page, then sync's calls:
    // accounts, 2x transactions, invoices, budgets
    const responses = [
      { ok: true, json: async () => ({ items: [], hasMore: false }) }, // health
      { ok: true, json: async () => accountPage }, // getAccounts
      { ok: true, json: async () => transactionPage }, // txns acct 1
      { ok: true, json: async () => transactionPage }, // txns acct 2
      { ok: true, json: async () => ({ items: [], hasMore: false }) }, // txns acct 3 (empty)
      { ok: true, json: async () => invoicePage }, // invoices
      { ok: true, json: async () => budgetPage }, // budgets
    ];
    fetchMock.mockImplementation(async () => responses.shift());

    expect(await connector.connect()).toBe(true);

    const result = await connector.sync({ direction: 'pull', batchSize: 50 });
    expect(result.success).toBe(true);
    expect(result.recordsSynced).toBe(3 + 2 + 2 + 0 + 1 + 2); // accounts + txns + invoices + budgets
  });

  it('sync() reports errors when pullData throws', async () => {
    const connector = new NetSuiteConnector(makeConfig());
    fetchMock.mockRejectedValue(new Error('kaboom'));

    const result = await connector.sync({ direction: 'pull' });
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('pushData is a no-op for NetSuite pulls', async () => {
    const connector = new NetSuiteConnector(makeConfig());
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ items: [], hasMore: false }) });
    const result = await connector.sync({ direction: 'push' });
    expect(result.recordsSynced).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
