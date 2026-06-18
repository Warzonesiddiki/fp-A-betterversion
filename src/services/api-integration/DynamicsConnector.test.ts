/**
 * DynamicsConnector test suite
 *
 * PATCH 24 — Microsoft Dataverse Web API v9.2 connector.
 *
 * Coverage (vitest):
 * - Construction: 3 tests (success, missing oauth2_dataverse, missing dataverse)
 * - OAuth2 client_credentials exchange: 2 tests (success, error)
 * - OAuth2 refresh (re-acquires): 2 tests (success, no refresh token in response)
 * - performHealthCheck: 3 tests (connected via WhoAmI, missing UserId, network failure)
 * - getAccounts: 1 test (3 accounts with industry mapping)
 * - getInvoices: 1 test (2 invoices with status mapping)
 * - getProducts: 1 test (2 products returned raw)
 * - getOpportunities: 1 test (3 opportunities returned raw)
 * - aggregateDynamicsRevenue: 3 tests (open+won+lost, stage weight fallback, empty)
 * - getForecastCategory: 2 tests (valid + invalid)
 *
 * Total: 18 vitest tests across 10 describe blocks.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamicsConnector } from './DynamicsConnector';
import type { ConnectorConfig } from './types';

// ─── Mock client ──────────────────────────────────────────────────────────────

type MockClient = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  setAuthToken: ReturnType<typeof vi.fn>;
  clearAuthToken: ReturnType<typeof vi.fn>;
};

function makeMockClient(): MockClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  };
}

const validConfig: ConnectorConfig = {
  id: 'dyn-test',
  name: 'Dynamics Test',
  baseUrl: 'https://contoso.crm.dynamics.com/api/data/v9.2',
  auth: {
    type: 'oauth2_dataverse',
    oauth2: {
      clientId: 'cid',
      clientSecret: 'csecret',
      tokenUrl:
        'https://login.microsoftonline.com/00000000-0000-0000-0000-000000000000/oauth2/v2.0/token',
      scopes: ['https://contoso.crm.dynamics.com/.default'],
      dataverse: {
        tenantId: '00000000-0000-0000-0000-000000000000',
        orgUrl: 'https://contoso.crm.dynamics.com',
      },
    },
  },
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────

let mockClient: MockClient;

beforeEach(() => {
  mockClient = makeMockClient();
  // Inject mock into the BaseConnector. The BaseConnector creates its own
  // RestApiClient in the constructor; we replace the `client` property
  // by reaching for a small workaround: build the connector first then
  // override client. Since `client` is protected, cast through `unknown`.
  // (This pattern is used in SageConnector.test.ts as well.)
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper: build a connector whose protected `client` is replaced with the mock.
function makeConnector(config: ConnectorConfig = validConfig): DynamicsConnector {
  const connector = new DynamicsConnector(config);
  (connector as unknown as { client: MockClient }).client = mockClient;
  return connector;
}

// ─── Construction ─────────────────────────────────────────────────────────────

describe('DynamicsConnector — construction', () => {
  it('constructs successfully with valid oauth2_dataverse config', () => {
    const c = new DynamicsConnector(validConfig);
    expect(c.id).toBe('dyn-test');
    expect(c.name).toBe('Dynamics Test');
  });

  it('throws if auth.type is not oauth2_dataverse', () => {
    const bad = {
      ...validConfig,
      auth: { type: 'oauth2_x', oauth2: validConfig.auth.oauth2 },
    } as unknown as ConnectorConfig;
    expect(() => new DynamicsConnector(bad)).toThrow(/oauth2_dataverse/);
  });

  it('throws if dataverse.tenantId is missing', () => {
    const bad = {
      ...validConfig,
      auth: {
        type: 'oauth2_dataverse' as const,
        oauth2: {
          ...validConfig.auth.oauth2,
          dataverse: {
            tenantId: '',
            orgUrl: 'https://contoso.crm.dynamics.com',
          },
        },
      },
    } as unknown as ConnectorConfig;
    expect(() => new DynamicsConnector(bad)).toThrow(/tenantId/);
  });
});

// ─── OAuth2 client_credentials ────────────────────────────────────────────────

describe('DynamicsConnector — OAuth2 client_credentials exchange', () => {
  it('exchanges client_credentials successfully and returns access token', async () => {
    mockClient.post.mockResolvedValueOnce({
      data: {
        token_type: 'Bearer',
        expires_in: 3600,
        access_token: 'tok-abc',
      },
    });

    const c = makeConnector();
    const result = await c.exchangeCodeForTokens();

    expect(result.accessToken).toBe('tok-abc');
    expect(result.refreshToken).toBeNull(); // client_credentials never returns refresh
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(mockClient.post).toHaveBeenCalledTimes(1);
  });

  it('throws when token endpoint returns no access_token', async () => {
    mockClient.post.mockResolvedValueOnce({ data: { token_type: 'Bearer' } });

    const c = makeConnector();
    await expect(c.exchangeCodeForTokens()).rejects.toThrow(/no access_token/);
  });
});

// ─── OAuth2 refresh (re-acquires via client_credentials) ─────────────────────

describe('DynamicsConnector — OAuth2 refresh', () => {
  it('re-acquires access token via exchangeCodeForTokens', async () => {
    mockClient.post.mockResolvedValueOnce({
      data: {
        token_type: 'Bearer',
        expires_in: 3600,
        access_token: 'tok-refreshed',
      },
    });

    const c = makeConnector();
    const result = await c.refreshAccessToken();

    expect(result.accessToken).toBe('tok-refreshed');
    expect(result.refreshToken).toBeNull();
  });

  it('propagates errors from the token endpoint', async () => {
    mockClient.post.mockRejectedValueOnce(new Error('401 invalid_client'));

    const c = makeConnector();
    await expect(c.refreshAccessToken()).rejects.toThrow(/401 invalid_client/);
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────

describe('DynamicsConnector — performHealthCheck', () => {
  it('returns connected when WhoAmI returns a UserId', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: { UserId: 'u-1', BusinessUnitId: 'bu-1' },
    });

    const c = makeConnector();
    const health = await c.checkHealth();

    expect(health.status).toBe('connected');
    expect(health.lastError).toBeUndefined();
  });

  it('returns error when WhoAmI returns no UserId', async () => {
    mockClient.get.mockResolvedValueOnce({ data: {} });

    const c = makeConnector();
    const health = await c.checkHealth();

    expect(health.status).toBe('error');
    expect(health.lastError).toMatch(/WhoAmI/);
  });

  it('returns error when request fails', async () => {
    mockClient.get.mockRejectedValueOnce(new Error('network down'));

    const c = makeConnector();
    const health = await c.checkHealth();

    expect(health.status).toBe('error');
    expect(health.lastError).toMatch(/network down/);
  });
});

// ─── getAccounts ──────────────────────────────────────────────────────────────

describe('DynamicsConnector — getAccounts', () => {
  it('returns mapped accounts with industry labels', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: {
        value: [
          {
            accountid: 'a1',
            name: 'Acme Corp',
            industrycode: 22, // Manufacturing
            revenue: 5_000_000,
            numberofemployees: 250,
            statecode: 0,
            _transactioncurrencyid_value: 'USD',
            createdon: '2025-01-01T00:00:00Z',
            modifiedon: '2025-06-01T00:00:00Z',
          },
          {
            accountid: 'a2',
            name: 'Globex',
            industrycode: 30, // Software
            statecode: 1,
            _transactioncurrencyid_value: 'EUR',
            createdon: '2025-01-01T00:00:00Z',
            modifiedon: '2025-06-01T00:00:00Z',
          },
          {
            accountid: 'a3',
            name: 'Initech',
            industrycode: 999, // unknown
            statecode: 0,
            _transactioncurrencyid_value: 'USD',
            createdon: '2025-01-01T00:00:00Z',
            modifiedon: '2025-06-01T00:00:00Z',
          },
        ],
      },
    });

    const c = makeConnector();
    const result = await c.getAccounts({ page: 1, pageSize: 50 });

    expect(result.items).toHaveLength(3);
    expect(result.items[0]?.subtype).toBe('Manufacturing');
    expect(result.items[0]?.active).toBe(true);
    expect(result.items[1]?.subtype).toBe('Software');
    expect(result.items[1]?.active).toBe(false);
    expect(result.items[1]?.currency).toBe('EUR');
    expect(result.items[2]?.subtype).toBe('Other'); // unknown → Other
    expect(result.pageSize).toBe(50);
  });
});

// ─── getInvoices ──────────────────────────────────────────────────────────────

describe('DynamicsConnector — getInvoices', () => {
  it('returns mapped invoices with status code mapping', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: {
        value: [
          {
            invoiceid: 'inv-1',
            invoicenumber: 'INV-1001',
            name: 'Q1 hardware',
            customerid_account_accountid: 'a1',
            totalamount: 12_500,
            totaltax: 1_000,
            statuscode: 1, // draft
            statecode: 0,
            invoiceid_date: '2026-03-01T00:00:00Z',
            duedate: '2026-03-31T00:00:00Z',
            createdon: '2026-03-01T00:00:00Z',
            modifiedon: '2026-03-01T00:00:00Z',
          },
          {
            invoiceid: 'inv-2',
            invoicenumber: 'INV-1002',
            name: 'Annual license',
            customerid_account_accountid: 'a1',
            totalamount: 100_000,
            totaltax: 0,
            statuscode: 3, // paid
            statecode: 0,
            invoiceid_date: '2026-01-15T00:00:00Z',
            duedate: '2026-02-15T00:00:00Z',
            createdon: '2026-01-15T00:00:00Z',
            modifiedon: '2026-01-15T00:00:00Z',
          },
        ],
      },
    });

    const c = makeConnector();
    const result = await c.getInvoices();

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.status).toBe('draft');
    expect(result.items[0]?.subtotal).toBe(11_500); // 12500 - 1000
    expect(result.items[1]?.status).toBe('paid');
    expect(result.items[1]?.subtotal).toBe(100_000);
  });
});

// ─── getProducts ──────────────────────────────────────────────────────────────

describe('DynamicsConnector — getProducts', () => {
  it('returns raw products from the catalog', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: {
        value: [
          {
            productid: 'p1',
            productnumber: 'SKU-001',
            name: 'Widget',
            price: 19.99,
            standardcost: 8,
            productstructure: 1,
            statecode: 0,
            createdon: '2025-01-01T00:00:00Z',
            modifiedon: '2025-01-01T00:00:00Z',
          },
          {
            productid: 'p2',
            productnumber: 'SKU-002',
            name: 'Service plan',
            price: 199,
            productstructure: 1,
            statecode: 0,
            createdon: '2025-01-01T00:00:00Z',
            modifiedon: '2025-01-01T00:00:00Z',
          },
        ],
      },
    });

    const c = makeConnector();
    const result = await c.getProducts();

    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.productnumber).toBe('SKU-001');
    expect(result.items[1]?.name).toBe('Service plan');
  });
});

// ─── getOpportunities ─────────────────────────────────────────────────────────

describe('DynamicsConnector — getOpportunities', () => {
  it('returns raw opportunities from the pipeline', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: {
        value: [
          {
            opportunityid: 'o1',
            name: 'Big deal',
            customerid_account_accountid: 'a1',
            estimatedvalue: 250_000,
            closeprobability: 60,
            statecode: 0,
            statuscode: 1,
            salesstagecode: 3,
            _transactioncurrencyid_value: 'USD',
            createdon: '2026-01-01T00:00:00Z',
            modifiedon: '2026-06-01T00:00:00Z',
          },
          {
            opportunityid: 'o2',
            name: 'Renewal',
            estimatedvalue: 100_000,
            closeprobability: 90,
            statecode: 0,
            statuscode: 1,
            salesstagecode: 4,
            createdon: '2026-01-01T00:00:00Z',
            modifiedon: '2026-06-01T00:00:00Z',
          },
          {
            opportunityid: 'o3',
            name: 'Closed lost',
            estimatedvalue: 50_000,
            closeprobability: 0,
            statecode: 2, // lost
            statuscode: 4,
            createdon: '2026-01-01T00:00:00Z',
            modifiedon: '2026-06-01T00:00:00Z',
          },
        ],
      },
    });

    const c = makeConnector();
    const result = await c.getOpportunities();

    expect(result.items).toHaveLength(3);
    expect(result.items[0]?.estimatedvalue).toBe(250_000);
    expect(result.items[2]?.statecode).toBe(2);
  });
});

// ─── aggregateDynamicsRevenue (PURE FUNCTION) ───────────────────────────────

describe('DynamicsConnector — aggregateDynamicsRevenue (pure)', () => {
  it('rolls up open, won, lost opportunities with closeprobability weighting', () => {
    const c = makeConnector();
    const result = c.aggregateDynamicsRevenue([
      {
        opportunityid: 'o1',
        name: 'A',
        estimatedvalue: 100_000,
        closeprobability: 50,
        statecode: 0,
        statuscode: 1,
        salesstagecode: 3,
        _transactioncurrencyid_value: 'USD',
        createdon: '',
        modifiedon: '',
      },
      {
        opportunityid: 'o2',
        name: 'B',
        estimatedvalue: 200_000,
        closeprobability: 100,
        statecode: 1, // won
        statuscode: 3,
        _transactioncurrencyid_value: 'USD',
        createdon: '',
        modifiedon: '',
      },
      {
        opportunityid: 'o3',
        name: 'C',
        estimatedvalue: 50_000,
        closeprobability: 0,
        statecode: 2, // lost
        statuscode: 4,
        _transactioncurrencyid_value: 'USD',
        createdon: '',
        modifiedon: '',
      },
    ]);

    expect(result.openCount).toBe(1);
    expect(result.wonCount).toBe(1);
    expect(result.lostCount).toBe(1);
    expect(result.openPipeline).toBe(100_000);
    expect(result.weightedForecast).toBe(50_000); // 100k * 0.5
    expect(result.closedRevenue).toBe(200_000);
    expect(result.currencyBreakdown.USD).toBe(200_000);
  });

  it('falls back to OPPORTUNITY_STAGE_WEIGHT when closeprobability is 0', () => {
    const c = makeConnector();
    const result = c.aggregateDynamicsRevenue([
      {
        opportunityid: 'o1',
        name: 'A',
        estimatedvalue: 100_000,
        closeprobability: 0,
        statecode: 0,
        statuscode: 1,
        salesstagecode: 2, // Develop → 0.25
        createdon: '',
        modifiedon: '',
      },
    ]);

    expect(result.openCount).toBe(1);
    expect(result.weightedForecast).toBe(25_000); // 100k * 0.25
  });

  it('returns zero rollup for empty opportunity list', () => {
    const c = makeConnector();
    const result = c.aggregateDynamicsRevenue([]);

    expect(result.openCount).toBe(0);
    expect(result.wonCount).toBe(0);
    expect(result.lostCount).toBe(0);
    expect(result.openPipeline).toBe(0);
    expect(result.weightedForecast).toBe(0);
    expect(result.closedRevenue).toBe(0);
    expect(result.currencyBreakdown).toEqual({});
  });
});

// ─── getForecastCategory ─────────────────────────────────────────────────────

describe('DynamicsConnector — getForecastCategory', () => {
  it('maps known sales stage codes to forecast category labels', () => {
    const c = makeConnector();
    expect(c.getForecastCategory(1)).toBe('Pipeline');
    expect(c.getForecastCategory(3)).toBe('BestCase');
    expect(c.getForecastCategory(4)).toBe('Commit');
    expect(c.getForecastCategory(5)).toBe('Closed');
  });

  it('returns Unknown for unknown or undefined stage codes', () => {
    const c = makeConnector();
    expect(c.getForecastCategory(999)).toBe('Unknown');
    expect(c.getForecastCategory(undefined)).toBe('Unknown');
  });
});
