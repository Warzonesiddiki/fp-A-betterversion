import { describe, expect, it } from 'vitest';
import { SmartImportMapper } from './SmartImportMapper';

const headers = ['GL Account', 'Posting Date', 'Debit', 'Credit', 'Company', 'Currency', 'Voucher'];
const rows = (overrides: Record<string, string>[] = []) => [
  {
    'GL Account': '1000',
    'Posting Date': '2026-09-30',
    Debit: '1,250.00',
    Credit: '',
    Company: 'PARENT',
    Currency: 'USD',
    Voucher: 'J1',
  },
  {
    'GL Account': '4000',
    'Posting Date': '2026-09-30',
    Debit: '',
    Credit: '1,250.00',
    Company: 'PARENT',
    Currency: 'USD',
    Voucher: 'J1',
  },
  ...overrides,
];
const config = {
  headers,
  knownAccountCodes: ['1000', '4000'],
  knownEntityIds: ['PARENT'],
  expectedCurrency: 'USD',
  dateOrder: 'MDY' as const,
  sourceId: 'ERP-2026-09',
};

describe('SmartImportMapper.ingest — exact validation boundary', () => {
  it('auto-maps canonical ERP headers, preserves source lines and returns exact strings', () => {
    const result = SmartImportMapper.ingest({ ...config, rows: rows() });
    expect(result.schemaErrors).toEqual([]);
    expect(result.canPost).toBe(true);
    expect(result.quarantinedRows).toEqual([]);
    expect(result.acceptedRows.map((r) => [r.sourceRow, r.accountCode, r.debit, r.credit])).toEqual(
      [
        [2, '1000', '1250.00', '0.00'],
        [3, '4000', '0.00', '1250.00'],
      ]
    );
    expect(result.controlTotals).toEqual({
      debit: '1250.00',
      credit: '1250.00',
      imbalance: '0.00',
    });
  });
  it('does not round through Number or lose cents beyond the safe integer limit', () => {
    const r = rows();
    r[0]!.Debit = '9,007,199,254,740,993.01';
    r[1]!.Credit = '9,007,199,254,740,993.01';
    const result = SmartImportMapper.ingest({ ...config, rows: r });
    expect(result.canPost).toBe(true);
    expect(result.controlTotals.debit).toBe('9007199254740993.01');
    expect(result.acceptedRows[0]?.debit).toBe('9007199254740993.01');
  });
  it('preserves 0 and never truncates corrupt currency cells', () => {
    const r = rows();
    r[0]!.Debit = '0';
    r[1]!.Credit = '123garbage';
    const result = SmartImportMapper.ingest({ ...config, rows: r });
    expect(result.acceptedRows[0]?.debit).toBe('0.00');
    expect(result.quarantinedRows[0]?.reasons.map((r) => r.code)).toContain('INVALID_AMOUNT');
    expect(result.canPost).toBe(false);
  });
  it('quarantines raw rows with true line numbers and every reason; balanced survivors do not authorize posting', () => {
    const bad = {
      'GL Account': 'UNKNOWN',
      'Posting Date': '2026-02-30',
      Debit: 'bad',
      Credit: '',
      Company: '',
      Currency: 'EUR',
      Voucher: 'J2',
    };
    const result = SmartImportMapper.ingest({ ...config, rows: rows([bad]), firstRowNumber: 8 });
    expect(result.acceptedRows).toHaveLength(2);
    expect(result.quarantinedRows).toHaveLength(1);
    expect(result.quarantinedRows[0]?.sourceRow).toBe(10);
    expect(result.quarantinedRows[0]?.raw).toEqual(bad);
    expect(result.quarantinedRows[0]?.reasons.map((r) => r.code)).toEqual(
      expect.arrayContaining([
        'UNKNOWN_ACCOUNT',
        'INVALID_DATE',
        'INVALID_AMOUNT',
        'MISSING_ENTITY',
        'CURRENCY_MISMATCH',
      ])
    );
    expect(result.controlTotals.imbalance).toBe('0.00');
    expect(result.canPost).toBe(false);
  });
  it('requires an explicit date dialect instead of guessing ambiguous day/month order', () => {
    const r = rows();
    r.forEach((row) => {
      row['Posting Date'] = '03/04/2026';
    });
    const us = SmartImportMapper.ingest({ ...config, rows: r, dateOrder: 'MDY' });
    const eu = SmartImportMapper.ingest({ ...config, rows: r, dateOrder: 'DMY' });
    const strict = SmartImportMapper.ingest({ ...config, rows: r, dateOrder: 'ISO_ONLY' });
    expect(us.acceptedRows[0]?.postDate).toBe('2026-03-04');
    expect(eu.acceptedRows[0]?.postDate).toBe('2026-04-03');
    expect(strict.canPost).toBe(false);
  });
  it('normalizes signed single amounts with parentheses and trailing minus using an explicit sign convention', () => {
    const h = ['Account Code', 'Date', 'Amount', 'Entity', 'Currency'];
    const r = [
      {
        'Account Code': '1000',
        Date: '30/09/2026',
        Amount: '1.250,00',
        Entity: 'PARENT',
        Currency: 'USD',
      },
      {
        'Account Code': '4000',
        Date: '30/09/2026',
        Amount: '1.250,00-',
        Entity: 'PARENT',
        Currency: 'USD',
      },
    ];
    const result = SmartImportMapper.ingest({
      ...config,
      headers: h,
      rows: r,
      dateOrder: 'DMY',
      amountConvention: 'positive-debit',
    });
    expect(result.canPost).toBe(true);
    expect(result.acceptedRows.map((r) => [r.debit, r.credit])).toEqual([
      ['1250.00', '0.00'],
      ['0.00', '1250.00'],
    ]);
    r[1]!.Amount = '(1,250.00)';
    expect(
      SmartImportMapper.ingest({
        ...config,
        headers: h,
        rows: r,
        dateOrder: 'DMY',
        amountConvention: 'positive-credit',
      }).acceptedRows.map((r) => [r.debit, r.credit])
    ).toEqual([
      ['0.00', '1250.00'],
      ['1250.00', '0.00'],
    ]);
    expect(
      SmartImportMapper.ingest({ ...config, headers: h, rows: r }).schemaErrors.join(';')
    ).toMatch(/sign convention/i);
  });
  it('reports exact imbalanced voucher IDs even when the whole file balances', () => {
    const r = rows();
    r[1]!.Voucher = 'J2';
    const result = SmartImportMapper.ingest({ ...config, rows: r });
    expect(result.controlTotals.imbalance).toBe('0.00');
    expect(result.unbalancedVouchers.map((v) => [v.journalId, v.imbalance])).toEqual([
      ['J1', '1250.00'],
      ['J2', '-1250.00'],
    ]);
    expect(result.canPost).toBe(false);
  });
  it('does not silently round sub-cent financial input', () => {
    const r = rows();
    r[0]!.Debit = '1.234,567';
    const result = SmartImportMapper.ingest({ ...config, rows: r });
    expect(result.quarantinedRows[0]?.reasons[0]?.code).toBe('INVALID_AMOUNT');
  });
  it('rejects negative debit/credit columns, unknown entities and missing currency', () => {
    const r = rows();
    r[0]!.Debit = '(100)';
    r[0]!.Company = 'UNKNOWN';
    r[0]!.Currency = '';
    const result = SmartImportMapper.ingest({ ...config, rows: r });
    expect(result.quarantinedRows[0]?.reasons.map((r) => r.code)).toEqual(
      expect.arrayContaining(['INVALID_AMOUNT', 'UNKNOWN_ENTITY', 'CURRENCY_MISMATCH'])
    );
  });
  it('rejects colliding mapped headers rather than silently taking the first match', () => {
    const result = SmartImportMapper.ingest({
      ...config,
      headers: [...headers, 'Account Code'],
      rows: rows(),
    });
    expect(result.schemaErrors.join(';')).toMatch(/accountCode/);
    expect(result.canPost).toBe(false);
    expect(result.quarantinedRows).toHaveLength(2);
  });
  it('rejects mappings that reuse one source column as both debit and credit', () => {
    const result = SmartImportMapper.ingest({
      ...config,
      rows: rows(),
      mappings: { debit: 'Debit', credit: 'Debit' },
    });
    expect(result.canPost).toBe(false);
    expect(result.schemaErrors.join(';')).toMatch(/multiple fields/);
    expect(result.quarantinedRows).toHaveLength(2);
  });
  it('sums fractional cents exactly and reports an independent cent imbalance', () => {
    const r = rows();
    r[0]!.Debit = '0.10';
    r[1]!.Credit = '0.30';
    r.push({ ...r[0]!, Debit: '0.20' });
    const result = SmartImportMapper.ingest({ ...config, rows: r });
    expect(result.controlTotals).toEqual({ debit: '0.30', credit: '0.30', imbalance: '0.00' });
    expect(result.canPost).toBe(true);
    r[1]!.Credit = '0.31';
    const unbalanced = SmartImportMapper.ingest({ ...config, rows: r });
    expect(unbalanced.controlTotals.imbalance).toBe('-0.01');
    expect(unbalanced.unbalancedVouchers[0]?.imbalance).toBe('-0.01');
    expect(unbalanced.canPost).toBe(false);
  });
  it('does not turn unmapped empty-header content into a fabricated journal ID', () => {
    const r = rows().map((row) => ({ ...row, '': 'not-a-journal' }));
    const result = SmartImportMapper.ingest({
      ...config,
      headers: headers.filter((h) => h !== 'Voucher'),
      rows: r,
    });
    expect(result.canPost).toBe(true);
    expect(result.acceptedRows.map((r) => r.journalId)).toEqual(['', '']);
  });
  it('handles empty input and iterable chunks deterministically without mutating source data', () => {
    expect(SmartImportMapper.ingest({ ...config, rows: [] }).canPost).toBe(false);
    const input = rows();
    const before = JSON.stringify(input);
    function* stream() {
      yield* input;
    }
    const a = SmartImportMapper.ingest({ ...config, rows: stream() });
    expect(a).toEqual(SmartImportMapper.ingest({ ...config, rows: stream() }));
    expect(JSON.stringify(input)).toBe(before);
  });
  it('honors explicit physical rowNumbers and rejects non-increasing or mismatched rowNumbers', () => {
    const r = rows([
      {
        'GL Account': '9999',
        'Posting Date': '2026-09-30',
        Debit: '10.00',
        Credit: '',
        Company: 'PARENT',
        Currency: 'USD',
        Voucher: 'J2',
      },
    ]);
    const valid = SmartImportMapper.ingest({ ...config, rows: r, rowNumbers: [4, 9, 15] });
    expect(valid.acceptedRows.map((row) => row.sourceRow)).toEqual([4, 9]);
    expect(valid.quarantinedRows[0]?.sourceRow).toBe(15);

    const nonMonotonic = SmartImportMapper.ingest({ ...config, rows: r, rowNumbers: [4, 4, 15] });
    expect(nonMonotonic.schemaErrors.join(';')).toMatch(/strictly increasing/i);
    expect(nonMonotonic.canPost).toBe(false);

    const mismatched = SmartImportMapper.ingest({ ...config, rows: r, rowNumbers: [4, 9] });
    expect(mismatched.schemaErrors.join(';')).toMatch(/count/i);
    expect(mismatched.canPost).toBe(false);
  });
});
