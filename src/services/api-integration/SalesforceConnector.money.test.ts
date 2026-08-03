/**
 * GAP-1 (F-0006) known-answer tests for SalesforceConnector's money migration.
 *
 * Opportunity revenue aggregation (pipeline/bestCase/commit/closed/omitted,
 * total, and the probability-weighted forecast) operates on currency-bearing
 * Opportunity.Amount values imported from Salesforce. Probability percentages
 * and record counts are not money. Each fixed input asserts the exact cent
 * result with `toBe`; the pre-migration IEEE-754 output is recorded inline.
 */

import { describe, expect, it } from 'vitest';
import { SalesforceConnector } from './SalesforceConnector';
import type { ConnectorConfig } from './types';

const config: ConnectorConfig = {
  id: 'sf-money-test',
  name: 'Salesforce money test',
  provider: 'salesforce',
  auth: {
    type: 'oauth2',
    oauth2: {
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      scopes: ['api'],
      redirectUri: 'https://app.example.test/callback',
    },
  },
};

function opportunity(id: string, amount: number, probability: number, category: string) {
  return {
    attributes: { type: 'Opportunity', url: '' },
    Id: id,
    Name: `Opp ${id}`,
    AccountId: null,
    StageName: 'Prospecting',
    Amount: amount,
    Probability: probability,
    CloseDate: '2026-12-31',
    CreatedDate: '2026-01-01T00:00:00Z',
    LastModifiedDate: '2026-01-01T00:00:00Z',
    IsClosed: false,
    IsWon: false,
    ForecastCategory: null,
    ForecastCategoryName: category,
    OwnerId: '005xx',
    Description: null,
    LeadSource: null,
    Type: null,
    NextStep: null,
  };
}

describe('SalesforceConnector — money known answers (GAP-1 / F-0006)', () => {
  const connector = new SalesforceConnector(config);

  it('sums pipeline buckets exactly (old float: 0.30000000000000004)', () => {
    const forecast = connector.aggregateForecast([
      opportunity('1', 0.1, 20, 'Pipeline'),
      opportunity('2', 0.2, 20, 'Pipeline'),
    ]);

    expect(forecast.pipeline).toBe(0.3);
    expect(forecast.total).toBe(0.3);
  });

  it('rounds an imported half-cent opportunity amount with decimal half-up semantics (old float: 1.005)', () => {
    const forecast = connector.aggregateForecast([opportunity('1', 1.005, 100, 'Closed')]);

    expect(forecast.closed).toBe(1.01);
    expect(forecast.total).toBe(1.01);
  });

  it('computes the probability-weighted forecast with exact decimal products (old float: 0.15000000000000002)', () => {
    const forecast = connector.aggregateForecast([
      opportunity('1', 0.1, 50, 'Pipeline'),
      opportunity('2', 0.2, 50, 'Pipeline'),
    ]);

    expect(forecast.weightedForecast).toBe(0.15);
  });

  it('cents the weighted forecast with half-up rounding (old float: 0.375)', () => {
    const forecast = connector.aggregateForecast([opportunity('1', 0.75, 50, 'Commit')]);

    // 0.75 × 50% = 0.375 → half-up to cents = 0.38 (0.375 is exactly
    // representable in IEEE-754, so the old float code returned 0.375 raw).
    expect(forecast.commit).toBe(0.75);
    expect(forecast.weightedForecast).toBe(0.38);
  });

  it('keeps omitted amounts in the total (old float: 0.6000000000000001)', () => {
    const forecast = connector.aggregateForecast([
      opportunity('1', 0.1, 0, 'Omitted'),
      opportunity('2', 0.2, 0, 'Omitted'),
      opportunity('3', 0.3, 0, 'Omitted'),
    ]);

    expect(forecast.omitted).toBe(0.6);
    expect(forecast.total).toBe(0.6);
    expect(forecast.weightedForecast).toBe(0);
  });

  it('returns exact zero aggregates for an empty forecast', () => {
    const forecast = connector.aggregateForecast([]);

    expect(forecast.pipeline).toBe(0);
    expect(forecast.bestCase).toBe(0);
    expect(forecast.commit).toBe(0);
    expect(forecast.closed).toBe(0);
    expect(forecast.omitted).toBe(0);
    expect(forecast.total).toBe(0);
    expect(forecast.weightedForecast).toBe(0);
  });
});
