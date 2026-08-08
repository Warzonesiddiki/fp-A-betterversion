import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SageConnector } from './SageConnector';
import type { ConnectorConfig } from './types';

// ---------------------------------------------------------------------------
// RestApiClient mock (SageConnector talks to the client, which wraps axios)
// ---------------------------------------------------------------------------

const clientMock = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const getOAuthTokens = vi.fn();
  const setOAuthTokens = vi.fn();
  return {
    get,
    post,
    getOAuthTokens,
    setOAuthTokens,
    RestApiClient: vi.fn(function (this: unknown) {
      Object.assign(this, { get, post, getOAuthTokens, setOAuthTokens });
    }),
  };
});

vi.mock('./RestApiClient', () => ({
  RestApiClient: clientMock.RestApiClient,
}));

function makeConfig(): ConnectorConfig {
  return {
    id: 'sage-1',
    name: 'Sage Intacct Prod',
    provider: 'sage',
    auth: {
      type: 'oauth2_sage',
      oauth2: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        authorizationUrl: 'https://api.intacct.com/oauth2/auth',
        tokenUrl: 'https://api.intacct.com/oauth2/token',
        scopes: ['read'],
        redirectUri: 'https://app.example.com/callback',
        sender: { companyId: 'IAID-1', userId: 'finplan', password: 'pw' },
      },
    } as unknown as ConnectorConfig['auth'],
  };
}

const envelope = <T>(items: T[], extra: Record<string, unknown> = {}) => ({
  data: { result: { items, ...extra } },
});

const glAccount = (over: Record<string, unknown> = {}) => ({
  RECORDNO: 'acct-1',
  TITLE: 'Cash',
  ACCOUNTTYPE: 'Bank',
  CURRENCY: 'USD',
  STATUS: 'active',
  WHENMODIFIED: '2024-01-15T00:00:00Z',
  ...over,
});

const glEntry = (over: Record<string, unknown> = {}) => ({
  RECORDNO: 'gl-1',
  ACCOUNTNO: '1000',
  ENTRYDATE: '2024-01-10',
  DEBITAMOUNT: 100,
  CREDITAMOUNT: 0,
  DESCRIPTION: 'Opening entry',
  JOURNAL: 'JE',
  DOCNUMBER: 'JE-1',
  ...over,
});

describe('SageConnector — branch sweep', () => {
  let connector: SageConnector;

  beforeEach(() => {
    clientMock.get.mockReset();
    clientMock.post.mockReset();
    clientMock.getOAuthTokens.mockReset().mockReturnValue(null);
    clientMock.setOAuthTokens.mockReset();
    connector = new SageConnector(makeConfig());
  });

  it('requires an oauth2_sage payload with sender credentials', () => {
    expect(() => new SageConnector(makeConfig())).not.toThrow();

    expect(
      () => new SageConnector({ ...makeConfig(), auth: undefined } as unknown as ConnectorConfig)
    ).toThrow(/SageConnector requires/);

    expect(
      () =>
        new SageConnector({
          ...makeConfig(),
          auth: { type: 'oauth2_sage', oauth2: { clientId: 'x' } },
        } as unknown as ConnectorConfig)
    ).toThrow(/sender/);
  });

  it('exchangeCodeForTokens returns tokens and defaults type/expiry', async () => {
    clientMock.post.mockResolvedValue({
      data: { access_token: 'at', refresh_token: 'rt' },
    });
    const tokens = await connector.exchangeCodeForTokens('code123', 'https://cb');
    expect(tokens).toMatchObject({ accessToken: 'at', refreshToken: 'rt', tokenType: 'Bearer' });
    expect(typeof tokens.expiresAt).toBe('number');
    const [url, body] = clientMock.post.mock.calls[0]!;
    expect(url).toBe('https://api.intacct.com/oauth2/token');
    expect(String(body)).toContain('grant_type=authorization_code');
    expect(String(body)).toContain('code=code123');
  });

  it('exchangeCodeForTokens surfaces failures with context', async () => {
    clientMock.post.mockResolvedValue({ data: {} });
    await expect(connector.exchangeCodeForTokens('c', 'r')).rejects.toThrow(
      /Sage OAuth2 code exchange failed: Sage token endpoint returned no access_token/
    );
  });

  it('refreshAccessToken throws when no refresh token is available', async () => {
    await expect(connector.refreshAccessToken()).rejects.toThrow(/no refresh token available/);
  });

  it('refreshAccessToken refreshes and rotates tokens', async () => {
    clientMock.getOAuthTokens.mockReturnValue({ refreshToken: 'old-rt' });
    clientMock.post.mockResolvedValue({
      data: { access_token: 'new-at', refresh_token: 'new-rt', token_type: 'Bearer' },
    });
    const tokens = await connector.refreshAccessToken();
    expect(tokens.accessToken).toBe('new-at');
    expect(tokens.refreshToken).toBe('new-rt');
    expect(clientMock.post.mock.calls[0]![1]).toContain('grant_type=refresh_token');
  });

  it('performHealthCheck reports connected and parses rate-limit headers', async () => {
    clientMock.get.mockResolvedValue({
      data: { result: { items: [] } },
      headers: { 'x-ratelimit-remaining': '120', 'x-ratelimit-reset': '60' },
    });
    const health = await connector.checkHealth();
    expect(health.status).toBe('connected');
    expect(health.rateLimitRemaining).toBe(120);
    expect(health.rateLimitReset).toBe(60000);
  });

  it('performHealthCheck reports faults with the fault description', async () => {
    clientMock.get.mockResolvedValue({
      data: { fault: { description: 'Permission denied' } },
      headers: {},
    });
    const health = await connector.checkHealth();
    expect(health.status).toBe('error');
    expect(health.lastError).toBe('Permission denied');
  });

  it('performHealthCheck falls back to detail description and catch path', async () => {
    clientMock.get.mockResolvedValue({
      data: { fault: { detail: { description: 'Detailed fault' } } },
      headers: {},
    });
    const health = await connector.checkHealth();
    expect(health.status).toBe('error');
    expect(health.lastError).toBe('Detailed fault');

    clientMock.get.mockRejectedValue(new Error('network'));
    const failed = await connector.checkHealth();
    expect(failed.status).toBe('error');
    expect(failed.lastError).toBe('network');
  });

  it('getAccounts maps Sage accounts and pagination', async () => {
    clientMock.get.mockResolvedValue(
      envelope(
        [
          glAccount(),
          glAccount({ ACCOUNTTYPE: 'Income', RECORDNO: 'r2', TITLE: 'Rev' }),
          glAccount({ ACCOUNTTYPE: 'Bogus' }),
        ],
        { totalCount: 5, numPages: 2 }
      )
    );
    const result = await connector.getAccounts({ page: 1, pageSize: 25 });

    expect(clientMock.get.mock.calls[0]![1]).toMatchObject({ pagesize: 25, page: 1 });
    expect(result.items).toHaveLength(3);
    expect(result.items[0]!.type).toBe('asset');
    expect(result.items[1]!.type).toBe('revenue');
    expect(result.items[2]!.type).toBe('asset');
    expect(result.items[0]!.active).toBe(true);
    expect(result.items[0]!.currency).toBe('USD');
    expect(result.total).toBe(5);
    expect(result.hasNext).toBe(true);
  });

  it('getAccounts returns an empty page on failure and maps inactive/unknown dates', async () => {
    clientMock.get.mockRejectedValue(new Error('down'));
    const empty = await connector.getAccounts();
    expect(empty.items).toEqual([]);
    expect(empty.total).toBe(0);

    clientMock.get.mockResolvedValue(
      envelope([glAccount({ STATUS: 'inactive', WHENMODIFIED: undefined })])
    );
    const mapped = await connector.getAccounts();
    expect(mapped.items[0]!.active).toBe(false);
    expect(typeof mapped.items[0]!.lastUpdated).toBe('number');
  });

  it('getTransactions sanitizes the account id and maps debit/credit entries', async () => {
    clientMock.post.mockResolvedValue(
      envelope([
        glEntry(),
        glEntry({
          RECORDNO: 'gl-2',
          DEBITAMOUNT: 0,
          CREDITAMOUNT: 25.5,
          DESCRIPTION: null,
          JOURNAL: null,
          DOCNUMBER: null,
        }),
      ])
    );
    const result = await connector.getTransactions('A1000');
    expect(String(clientMock.post.mock.calls[0]![1].query)).toContain('A1000');
    expect(result.items[0]).toMatchObject({ type: 'debit', amount: 100, reference: 'JE-1' });
    expect(result.items[1]).toMatchObject({
      type: 'credit',
      amount: 25.5,
      description: 'GL Entry',
    });

    // SQL-injection-ish input gets stripped of special characters
    clientMock.post.mockResolvedValue(envelope([]));
    await connector.getTransactions("1' OR '1'='1");
    expect(String(clientMock.post.mock.calls[1]![1].query)).toContain('ACCOUNTNO = ');
    expect(String(clientMock.post.mock.calls[1]![1].query)).not.toContain("' OR '");
  });

  it('getTransactions falls back to an empty page on error', async () => {
    clientMock.post.mockRejectedValue(new Error('boom'));
    const result = await connector.getTransactions('1');
    expect(result.items).toEqual([]);
  });

  it('getInvoices maps AR invoices and invoice statuses', async () => {
    clientMock.get.mockResolvedValue(
      envelope([
        {
          RECORDNO: 'inv1',
          RECORDID: 'INV-1',
          CUSTOMERID: 'c1',
          DATE: '2024-01-01',
          DUEDATE: '2024-02-01',
          STATE: 'Paid',
          TOTAMOUNT: 500,
          CURRENCY: 'USD',
        },
        {
          RECORDNO: 'inv2',
          RECORDID: 'INV-2',
          CUSTOMERID: 'c2',
          DATE: '2024-01-02',
          DUEDATE: '2024-02-02',
          STATE: 'Pending',
          TOTAMOUNT: 200,
        },
        {
          RECORDNO: 'inv3',
          RECORDID: 'INV-3',
          CUSTOMERID: 'c3',
          DATE: '2024-01-03',
          DUEDATE: '2024-02-03',
          STATE: 'Voided',
          TOTAMOUNT: 100,
        },
        {
          RECORDNO: 'inv4',
          RECORDID: 'INV-4',
          CUSTOMERID: 'c4',
          DATE: '2024-01-04',
          DUEDATE: '2024-02-04',
          STATE: 'Weird',
          TOTAMOUNT: 50,
        },
      ])
    );
    const result = await connector.getInvoices();
    expect(result.items.map((i) => i.status)).toEqual(['paid', 'sent', 'void', 'draft']);
    expect(result.items[0]!.total).toBe(500);
    expect(result.items[1]!.currency).toBe('USD');
  });

  it('getVendors and getCustomers pass through raw records', async () => {
    clientMock.get.mockResolvedValueOnce(envelope([{ RECORDNO: 'v1', NAME: 'Vendor' }]));
    const vendors = await connector.getVendors();
    expect(vendors.items[0]).toMatchObject({ RECORDNO: 'v1', NAME: 'Vendor' });

    clientMock.get.mockResolvedValueOnce(envelope([{ RECORDNO: 'cu1', NAME: 'Customer' }]));
    const customers = await connector.getCustomers();
    expect(customers.items[0]).toMatchObject({ RECORDNO: 'cu1' });

    clientMock.get.mockRejectedValueOnce(new Error('x'));
    expect((await connector.getVendors()).items).toEqual([]);
  });

  it('getBudgets maps budget headers with empty entries', async () => {
    clientMock.get.mockResolvedValue(
      envelope([{ RECORDNO: 'b1', TITLE: 'FY2024', FISCALYEAR: '2024' }])
    );
    const result = await connector.getBudgets();
    expect(result.items[0]).toEqual({
      externalId: 'b1',
      name: 'FY2024',
      fiscalYear: '2024',
      entries: [],
    });
  });

  it('aggregateGLBalance is a pure decimal-backed roll-up', () => {
    const summary = connector.aggregateGLBalance(
      [
        { DEBITAMOUNT: 100.1, CREDITAMOUNT: 0 },
        { DEBITAMOUNT: 0, CREDITAMOUNT: 40.2 },
        { DEBITAMOUNT: 10.05, CREDITAMOUNT: 0 },
      ],
      'acct-100'
    );
    expect(summary.totalDebits).toBe(110.15);
    expect(summary.totalCredits).toBe(40.2);
    expect(summary.netChange).toBe(69.95);
    expect(summary.entryCount).toBe(3);
    expect(summary.accountId).toBe('acct-100');

    const noAccount = connector.aggregateGLBalance([]);
    expect(noAccount.accountId).toBeNull();
    expect(noAccount.totalDebits).toBe(0);
    expect(noAccount.entryCount).toBe(0);
  });

  it('sync pulls records end-to-end and push is a no-op', async () => {
    clientMock.get.mockImplementation(async (path: string) => {
      if (path === '/objects/GLAccount')
        return envelope([
          glAccount(),
          glAccount({ RECORDNO: 'acct-2', TITLE: 'AP', ACCOUNTTYPE: 'Accounts Payable' }),
        ]);
      if (path === '/objects/ARInvoice')
        return envelope([
          {
            RECORDNO: 'inv1',
            RECORDID: 'I1',
            CUSTOMERID: 'c',
            DATE: 'd',
            DUEDATE: 'd',
            STATE: 'Posted',
            TOTAMOUNT: 10,
          },
        ]);
      if (path === '/objects/Budget')
        return envelope([{ RECORDNO: 'b1', TITLE: 'B', FISCALYEAR: '2024' }]);
      return envelope([]);
    });
    clientMock.post.mockResolvedValue(envelope([glEntry()]));

    const pulled = await connector.sync({ direction: 'pull', batchSize: 10 });
    expect(pulled.success).toBe(true);
    expect(pulled.recordsSynced).toBe(2 + 2 + 1 + 1); // accounts + txns + invoices + budgets

    const pushed = await connector.sync({ direction: 'push' });
    expect(pushed.recordsSynced).toBe(0);
  });

  it('connect returns true when healthy and false when the health check fails', async () => {
    clientMock.get.mockResolvedValue({ data: { result: { items: [] } }, headers: {} });
    expect(await connector.connect()).toBe(true);

    clientMock.get.mockRejectedValue(new Error('down'));
    expect(await connector.connect()).toBe(false);
  });
});
