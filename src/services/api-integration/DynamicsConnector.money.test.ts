/**
 * GAP-1 (F-0006) known-answer tests for DynamicsConnector's money migration.
 *
 * Opportunity revenue aggregation (openPipeline, weightedForecast,
 * closedRevenue, currencyBreakdown) and the invoice subtotal (total − tax)
 * are currency-bearing values imported from Dataverse. Opportunity counts,
 * probability percentages, stage weights, and pagination offsets are not
 * money. Each fixed input asserts the exact cent result with `toBe`; the
 * pre-migration IEEE-754 output is recorded inline.
 */

import { describe, expect, it, vi } from 'vitest';
import { DynamicsConnector, type DynamicsOpportunity } from './DynamicsConnector';
import type { ConnectorConfig } from './types';

const config: ConnectorConfig = {
  id: 'dyn-money-test',
  name: 'Dynamics money test',
  provider: 'dynamics',
  auth: {
    type: 'oauth2_dataverse',
    oauth2: {
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
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

type MockClient = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  setAuthToken: ReturnType<typeof vi.fn>;
  clearAuthToken: ReturnType<typeof vi.fn>;
};

function makeConnector(): { connector: DynamicsConnector; mockClient: MockClient } {
  const connector = new DynamicsConnector(config);
  const mockClient: MockClient = {
    get: vi.fn(),
    post: vi.fn(),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
  };
  // Replace the protected RestApiClient with a mock (same pattern as the
  // existing DynamicsConnector.test.ts) for the HTTP-backed getInvoices case.
  (connector as unknown as { client: MockClient }).client = mockClient;
  return { connector, mockClient };
}

function opportunity(
  id: string,
  estimatedvalue: number,
  statecode: number,
  extras: Partial<DynamicsOpportunity> = {}
): DynamicsOpportunity {
  return {
    opportunityid: id,
    name: `Opp ${id}`,
    estimatedvalue,
    closeprobability: 0,
    statecode,
    statuscode: 1,
    createdon: '2026-01-01T00:00:00Z',
    modifiedon: '2026-01-01T00:00:00Z',
    ...extras,
  };
}

describe('DynamicsConnector — money known answers (GAP-1 / F-0006)', () => {
  it('sums open pipeline exactly (old float: 0.30000000000000004)', () => {
    const result = new DynamicsConnector(config).aggregateDynamicsRevenue([
      opportunity('o1', 0.1, 0),
      opportunity('o2', 0.2, 0),
    ]);

    expect(result.openCount).toBe(2);
    expect(result.openPipeline).toBe(0.3);
    expect(result.weightedForecast).toBe(0); // no probability and no stage weight
    expect(result.closedRevenue).toBe(0);
  });

  it('rounds an imported half-cent opportunity value with decimal half-up semantics (old float: 1.005)', () => {
    const result = new DynamicsConnector(config).aggregateDynamicsRevenue([
      opportunity('o1', 1.005, 1, { _transactioncurrencyid_value: 'USD' }),
    ]);

    expect(result.closedRevenue).toBe(1.01);
    expect(result.currencyBreakdown).toEqual({ USD: 1.01 });
  });

  it('computes the probability-weighted forecast with exact decimal products (old float: 0.15000000000000002)', () => {
    const result = new DynamicsConnector(config).aggregateDynamicsRevenue([
      opportunity('o1', 0.1, 0, { closeprobability: 50 }),
      opportunity('o2', 0.2, 0, { closeprobability: 50 }),
    ]);

    expect(result.weightedForecast).toBe(0.15);
  });

  it('uses the stage-weight fallback with exact decimal products (old float: 0.030000000000000006)', () => {
    const result = new DynamicsConnector(config).aggregateDynamicsRevenue([
      opportunity('o1', 0.1, 0, { closeprobability: 0, salesstagecode: 1 }), // Qualify → 0.1
      opportunity('o2', 0.2, 0, { closeprobability: 0, salesstagecode: 1 }),
    ]);

    expect(result.weightedForecast).toBe(0.03);
  });

  it('rounds the imported value before weighting and cents the weighted total (old float: 0.5025)', () => {
    const result = new DynamicsConnector(config).aggregateDynamicsRevenue([
      opportunity('o1', 1.005, 0, { closeprobability: 50 }),
    ]);

    // roundTo(1.005) = 1.01; 1.01 × 50% = 0.505 → half-up cents = 0.51
    expect(result.weightedForecast).toBe(0.51);
  });

  it('sums closed revenue and the currency breakdown exactly (old float: 0.6000000000000001)', () => {
    const result = new DynamicsConnector(config).aggregateDynamicsRevenue([
      opportunity('o1', 0.1, 1, { _transactioncurrencyid_value: 'USD' }),
      opportunity('o2', 0.2, 1, { _transactioncurrencyid_value: 'USD' }),
      opportunity('o3', 0.3, 1, { _transactioncurrencyid_value: 'USD' }),
    ]);

    expect(result.closedRevenue).toBe(0.6);
    expect(result.currencyBreakdown).toEqual({ USD: 0.6 });
  });

  it('returns exact zero aggregates for an empty opportunity list', () => {
    const result = new DynamicsConnector(config).aggregateDynamicsRevenue([]);

    expect(result.openCount).toBe(0);
    expect(result.wonCount).toBe(0);
    expect(result.lostCount).toBe(0);
    expect(result.openPipeline).toBe(0);
    expect(result.weightedForecast).toBe(0);
    expect(result.closedRevenue).toBe(0);
    expect(result.currencyBreakdown).toEqual({});
  });

  it('subtracts invoice tax exactly for the subtotal (old float: 0.19999999999999998)', async () => {
    const { connector, mockClient } = makeConnector();
    mockClient.get.mockResolvedValueOnce({
      data: {
        value: [
          {
            invoiceid: 'inv-1',
            invoicenumber: 'INV-1',
            name: 'Invoice 1',
            customerid_account_accountid: 'a1',
            totalamount: 0.3,
            totaltax: 0.1,
            statuscode: 1,
            statecode: 0,
            invoiceid_date: '2026-01-01T00:00:00Z',
            duedate: '2026-01-31T00:00:00Z',
            createdon: '2026-01-01T00:00:00Z',
            modifiedon: '2026-01-01T00:00:00Z',
          },
        ],
      },
    });

    const result = await connector.getInvoices();

    expect(result.items[0]?.subtotal).toBe(0.2);
    expect(result.items[0]?.total).toBe(0.3);
    expect(result.items[0]?.tax).toBe(0.1);
  });
});
