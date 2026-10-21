/**
 * D365 export-context defaults — the failure paths.
 *
 * WHY THIS EXISTS
 * ---------------
 * A SYNTHETIC D365-shaped export carries the legal entity as EXPORT CONTEXT, not
 * as a column, so `ingestGLRows` gained `defaultEntityId` / `defaultCurrency`
 * (2026-10-21). The happy path is proven by
 * `src/services/import/spineAcceptance.d365.integration.test.ts`; this suite
 * pins the boundary, because every one of these mistakes would otherwise turn a
 * missing dimension into a silently attributed financial row:
 *
 *   - dropping the default must NOT be silently allowed (the old requirement
 *     stays in force, so deleting the column is still a schema error);
 *   - a default naming an entity that is not in the supplied list is rejected;
 *   - a default currency that disagrees with `expectedCurrency` is rejected
 *     (this contract is single-currency);
 *   - a blank default is rejected rather than treated as "absent";
 *   - a real entity column ALWAYS wins over the default — the default fills an
 *     absent column, it never overwrites supplied data.
 *
 * "Missing is not zero" (VISION §3.6) applies to dimensions too: an entity can
 * come from context, but it can never come from nowhere.
 */
import { describe, expect, it } from 'vitest';
import { ingestGLRows } from './SmartImportMapper';

const BASE = {
  sourceId: 'd365-defaults',
  firstRowNumber: 2,
  knownAccountCodes: ['1000', '3000'],
  knownEntityIds: ['US01', 'DE01'],
  expectedCurrency: 'USD',
  dateOrder: 'ISO_ONLY' as const,
};

const D365_HEADERS = [
  'Transaction posting date',
  'Transaction number',
  'Main account',
  'Main account name',
  'Description',
  'Transaction currency',
  'Debit',
  'Credit',
];

/** One balanced two-line voucher in the documented D365 column order. */
const ROW: Record<string, string> = {
  'Transaction posting date': '2026-03-31',
  'Transaction number': 'US-J1',
  'Main account': '1000',
  'Main account name': 'Cash',
  Description: 'Opening',
  'Transaction currency': 'USD',
  Debit: '100.00',
  Credit: '0.00',
};
const OFFSET_ROW: Record<string, string> = {
  ...ROW,
  'Main account': '3000',
  'Main account name': 'Equity',
  Debit: '0.00',
  Credit: '100.00',
};

describe('D365 header aliases', () => {
  it('maps the documented GL-statement headers without ambiguity', () => {
    const r = ingestGLRows({
      ...BASE,
      headers: D365_HEADERS,
      rows: [ROW, OFFSET_ROW],
      defaultEntityId: 'US01',
    });
    expect(r.schemaErrors).toEqual([]);
    expect(r.mappings).toMatchObject({
      accountCode: 'Main account',
      postDate: 'Transaction posting date',
      journalId: 'Transaction number',
      currency: 'Transaction currency',
      debit: 'Debit',
      credit: 'Credit',
    });
    // "Main account name" must not win accountCode, and vice versa.
    expect(r.mappings.accountName).toBe('Main account name');
    expect(r.acceptedRows.length).toBe(2);
  });
});

describe('export-context defaults', () => {
  it('still requires an entity column when no default is supplied', () => {
    const r = ingestGLRows({ ...BASE, headers: D365_HEADERS, rows: [ROW] });
    expect(r.schemaErrors).toContain('Missing required column: entityId');
    expect(r.acceptedRows).toHaveLength(0);
  });

  it('accepts rows when an explicit default entity supplies the dimension', () => {
    const r = ingestGLRows({
      ...BASE,
      headers: D365_HEADERS,
      rows: [ROW, OFFSET_ROW],
      defaultEntityId: 'US01',
    });
    expect(r.schemaErrors).toEqual([]);
    expect(r.acceptedRows.map((a) => a.entityId)).toEqual(['US01', 'US01']);
  });

  it('rejects a default entity that is not in the supplied entity list', () => {
    const r = ingestGLRows({
      ...BASE,
      headers: D365_HEADERS,
      rows: [ROW],
      defaultEntityId: 'ZZ99',
    });
    expect(r.schemaErrors.join(' ')).toMatch(/Default entity is not in the supplied entity list/i);
  });

  it('rejects a blank default entity rather than treating it as absent', () => {
    const r = ingestGLRows({ ...BASE, headers: D365_HEADERS, rows: [ROW], defaultEntityId: '   ' });
    expect(r.schemaErrors.join(' ')).toMatch(/Default entity must be a non-empty string/i);
  });

  it('rejects a default currency that disagrees with the expected currency', () => {
    const r = ingestGLRows({
      ...BASE,
      headers: D365_HEADERS,
      rows: [ROW],
      defaultEntityId: 'US01',
      defaultCurrency: 'EUR',
    });
    expect(r.schemaErrors.join(' ')).toMatch(/must equal expected currency/i);
  });

  it('lets a supplied entity column win over the default', () => {
    const headers = [...D365_HEADERS, 'EntityId'];
    const rows = [
      { ...ROW, EntityId: 'DE01' },
      { ...OFFSET_ROW, EntityId: 'DE01' },
    ];
    const r = ingestGLRows({ ...BASE, headers, rows, defaultEntityId: 'US01' });
    expect(r.schemaErrors).toEqual([]);
    // DE01 came from the data, not from the context default.
    expect(r.acceptedRows.map((a) => a.entityId)).toEqual(['DE01', 'DE01']);
  });
});
