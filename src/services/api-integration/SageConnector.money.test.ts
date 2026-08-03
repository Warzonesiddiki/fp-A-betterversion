/**
 * GAP-1 (F-0006) known-answer tests for SageConnector's money migration.
 *
 * Imported Sage GL debit, credit, and net-change values are currency. Connector
 * configuration and pagination counts are not money. Each fixed input asserts
 * the exact cent result with `toBe`; old Math.round/IEEE-754 output is noted.
 */

import { describe, expect, it } from 'vitest';
import { SageConnector } from './SageConnector';
import type { ConnectorConfig } from './types';

const config: ConnectorConfig = {
  id: 'sage-money-test',
  name: 'Sage money test',
  provider: 'sage',
  auth: {
    type: 'oauth2_sage',
    oauth2: {
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
      authorizationUrl: 'https://api.intacct.com/oauth2/authorize',
      tokenUrl: 'https://api.intacct.com/oauth2/token',
      scopes: ['general-ledger'],
      redirectUri: 'https://app.example.test/callback',
      sender: {
        companyId: 'TEST-CO',
        userId: 'test-user',
        password: 'test-password',
      },
    },
  },
};

function glEntry(recordNo: string, debit: number, credit: number) {
  return {
    RECORDNO: recordNo,
    BATCHNO: 'BATCH-1',
    JOURNAL: 'GJ',
    ENTRYDATE: '2026-01-31',
    ACCOUNTNO: '1000',
    DEBITAMOUNT: debit,
    CREDITAMOUNT: credit,
    CURRENCY: 'USD',
    WHENMODIFIED: '2026-01-31T00:00:00Z',
  };
}

describe('SageConnector — money known answers (GAP-1 / F-0006)', () => {
  it('rounds an imported half-cent debit with decimal half-up semantics (old Math.round: 1)', () => {
    const balance = new SageConnector(config).aggregateGLBalance([glEntry('1', 1.005, 0)], '1000');

    expect(balance.totalDebits).toBe(1.01);
    expect(balance.totalCredits).toBe(0);
    expect(balance.netChange).toBe(1.01);
  });

  it('rounds each imported GL row before calculating exact net change (old float: 0.99)', () => {
    const balance = new SageConnector(config).aggregateGLBalance(
      [glEntry('1', 1.005, 0), glEntry('2', 0, 0.005)],
      '1000'
    );

    expect(balance.totalDebits).toBe(1.01);
    expect(balance.totalCredits).toBe(0.01);
    expect(balance.netChange).toBe(1);
  });

  it('sums multiple debit and credit journal lines exactly', () => {
    const balance = new SageConnector(config).aggregateGLBalance(
      [glEntry('1', 0.1, 0), glEntry('2', 0.2, 0), glEntry('3', 0, 0.1)],
      '1000'
    );

    expect(balance.totalDebits).toBe(0.3);
    expect(balance.totalCredits).toBe(0.1);
    expect(balance.netChange).toBe(0.2);
    expect(balance.entryCount).toBe(3);
  });

  it('returns exact zero amounts for an empty GL import', () => {
    const balance = new SageConnector(config).aggregateGLBalance([], '1000');

    expect(balance.totalDebits).toBe(0);
    expect(balance.totalCredits).toBe(0);
    expect(balance.netChange).toBe(0);
    expect(balance.entryCount).toBe(0);
  });
});
