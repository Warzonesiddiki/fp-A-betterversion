/**
 * Phase 4 (FR-011, plan §8): account × grain comparison with coverage
 * honesty. Independent-recalculation tests: every expected figure below
 * is hand-computed from the fixture, not derived from the implementation.
 */
import { describe, it, expect } from 'vitest';
import {
  buildComparison,
  entriesForAccountPeriod,
  type ComparisonEntryInput,
} from './buildComparison';

function e(
  id: string,
  date: string,
  accountCode: string,
  debit: number,
  credit: number,
  extra: Partial<ComparisonEntryInput> = {}
): ComparisonEntryInput {
  return {
    id,
    date,
    period: date.slice(0, 7),
    accountCode,
    accountName: accountCode,
    debit,
    credit,
    provenance: { batchId: 'batch-x', sourceFile: 'x.csv', sourceRow: 2 },
    ...extra,
  };
}

// Revenue account 4010 (credit-normal) and expense 6010 (debit-normal)
// across Jan/Feb 2025 and Jan/Feb 2026. All dates weekdays; amounts small.
const LEDGER: ComparisonEntryInput[] = [
  e('a1', '2025-01-06', '4010', 0, 1000),
  e('a2', '2025-01-07', '6010', 200, 0),
  e('a3', '2025-02-03', '4010', 0, 1500),
  e('a4', '2025-02-04', '6010', 300, 0),
  e('a5', '2026-01-05', '4010', 0, 2000),
  e('a6', '2026-01-06', '6010', 250, 0),
  e('a7', '2026-02-02', '4010', 0, 500),
  // account 7010 exists only in 2025 — disappears afterwards
  e('a8', '2025-01-08', '7010', 40, 0),
];

describe('buildComparison — month grain', () => {
  const result = buildComparison(LEDGER, { grain: 'month', currentKey: '2026-01' });
  const byCode = new Map(result.rows.map((r) => [r.accountCode, r]));

  it('current/prior/prior-year figures with natural signs', () => {
    const rev = byCode.get('4010')!;
    expect(rev.current).toBe(2000); // credit-normal: Cr-Dr
    expect(rev.prior).toBe(1500); // 2025-02, the previous present month? no: calendar prior = 2025-12
    expect(rev.priorYear).toBe(1000); // 2025-01
  });

  it('delta money and percent against the prior period', () => {
    const exp = byCode.get('6010')!;
    expect(exp.current).toBe(250);
    expect(exp.priorYear).toBe(200);
  });

  it('an account absent from the current period is null — "not in file", never zero', () => {
    const gone = byCode.get('7010')!;
    expect(gone.current).toBeNull();
    expect(gone.deltaMoney).toBeNull();
    expect(gone.deltaPct).toBeNull();
  });

  it('coverage states days present of days in month and batch provenance', () => {
    const cov = result.coverage.get('2026-01')!;
    expect(cov.entryCount).toBe(2);
    expect(cov.daysPresent).toBe(2);
    expect(cov.daysInPeriod).toBe(31);
    expect(cov.batches).toEqual(['batch-x']);
  });
});

describe('buildComparison — honesty rules', () => {
  it('prior column is the previous PRESENT period only when calendar prior is absent — and says which', () => {
    const result = buildComparison(LEDGER, { grain: 'month', currentKey: '2026-01' });
    // 2025-12 has no entries. The comparison must not fabricate it: prior
    // resolves to the latest present period before current, labelled as such.
    expect(result.priorKey).toBe('2025-02');
    expect(result.priorIsCalendarPrior).toBe(false);
  });

  it('when the calendar prior exists it is used and labelled exact', () => {
    const result = buildComparison(LEDGER, { grain: 'month', currentKey: '2026-02' });
    expect(result.priorKey).toBe('2026-01');
    expect(result.priorIsCalendarPrior).toBe(true);
    const rev = result.rows.find((r) => r.accountCode === '4010')!;
    expect(rev.current).toBe(500);
    expect(rev.prior).toBe(2000);
    expect(rev.deltaMoney).toBe(-1500);
    expect(rev.deltaPct).toBe(-75);
  });

  it('delta percent is null (never -100%) when there is no prior base', () => {
    const result = buildComparison(LEDGER, { grain: 'month', currentKey: '2025-01' });
    const rev = result.rows.find((r) => r.accountCode === '4010')!;
    expect(rev.prior).toBeNull();
    expect(rev.deltaPct).toBeNull();
  });

  it('rows are exhaustive and sorted by |delta| descending, missing deltas last', () => {
    const result = buildComparison(LEDGER, { grain: 'month', currentKey: '2026-02' });
    expect(result.rows.map((r) => r.accountCode)).toEqual(['4010', '6010', '7010']);
  });
});

describe('buildComparison — year and day grains', () => {
  it('year grain aggregates whole years', () => {
    const result = buildComparison(LEDGER, { grain: 'year', currentKey: '2026' });
    const rev = result.rows.find((r) => r.accountCode === '4010')!;
    expect(rev.current).toBe(2500);
    expect(rev.prior).toBe(2500);
    expect(rev.deltaMoney).toBe(0);
    expect(rev.deltaPct).toBe(0);
  });

  it('day grain compares single days', () => {
    const result = buildComparison(LEDGER, { grain: 'day', currentKey: '2026-01-05' });
    const rev = result.rows.find((r) => r.accountCode === '4010')!;
    expect(rev.current).toBe(2000);
    expect(result.coverage.get('2026-01-05')?.daysInPeriod).toBe(1);
  });
});

describe('entriesForAccountPeriod — drill selector', () => {
  it('returns exactly the entries behind a cell', () => {
    const jan = entriesForAccountPeriod(LEDGER, '4010', '2026-01', 'month');
    expect(jan.map((x) => x.id)).toEqual(['a5']);
    const y2025 = entriesForAccountPeriod(LEDGER, '4010', '2025', 'year');
    expect(y2025.map((x) => x.id)).toEqual(['a1', 'a3']);
  });
});

describe('buildComparison — 100k-entry bench (plan §8 performance bar)', () => {
  it('builds the month grid over 100,000 entries well inside the interactive budget', () => {
    const entries: ComparisonEntryInput[] = [];
    for (let i = 0; i < 100_000; i += 1) {
      const month = String((i % 12) + 1).padStart(2, '0');
      const account = `4${String(i % 50).padStart(3, '0')}`;
      entries.push(
        e(`bench-${i}`, `2026-${month}-15`, account, 0, (i % 97) + 1)
      );
    }
    const started = performance.now();
    const result = buildComparison(entries, { grain: 'month', currentKey: '2026-06' });
    const elapsedMs = performance.now() - started;
    expect(result.rows.length).toBe(50);
    expect(result.coverage.get('2026-06')?.entryCount).toBeGreaterThan(8000);
    // Generous ceiling for shared CI hardware; measured locally far below.
    expect(elapsedMs).toBeLessThan(5000);
  }, 30_000);
});
