/**
 * Phase 3 answer key (plan §10 Phase 3 exit): a planted-exception ledger
 * whose expected findings are known exactly, a clean ledger that must
 * produce none, and a determinism contract — same ledger, same rules,
 * run twice → identical output.
 *
 * Each planted item uses dedicated accounts so findings cannot cross-fire
 * accidentally; where two rules legitimately fire on one journal
 * (one-sided journals are also unbalanced) both keys are expected.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runExceptionRules, type ExceptionEntryInput } from './runExceptionRules';
import { setClock, resetClock } from '@/utils/clock';

const FIXED = '2026-10-15T09:30:00.000Z';

function e(
  id: string,
  journalId: string,
  date: string,
  accountCode: string,
  debit: number,
  credit: number,
  extra: Partial<ExceptionEntryInput> = {}
): ExceptionEntryInput {
  return {
    id,
    journalId,
    date,
    period: date.slice(0, 7),
    accountCode,
    accountName: accountCode,
    debit,
    credit,
    description: `Entry ${id}`,
    reference: journalId,
    provenance: { batchId: 'batch-planted', sourceFile: 'planted.csv', sourceRow: 2 },
    ...extra,
  };
}

/** Clean core: balanced, weekday, evidenced, both periods, small counts. */
const CLEAN: ExceptionEntryInput[] = [
  e('c1', 'J-A', '2026-01-05', '1010', 1000, 0),
  e('c2', 'J-A', '2026-01-05', '4010', 0, 1000),
  e('c3', 'J-B', '2026-01-06', '6010', 250.75, 0),
  e('c4', 'J-B', '2026-01-06', '1010', 0, 250.75),
  e('c5', 'J-C', '2026-02-02', '1010', 1100, 0),
  e('c6', 'J-C', '2026-02-02', '4010', 0, 1100),
  e('c7', 'J-D', '2026-02-03', '6010', 250.75, 0),
  e('c8', 'J-D', '2026-02-03', '1010', 0, 250.75),
];

const PLANTED: ExceptionEntryInput[] = [
  ...CLEAN,
  // R-006 unbalanced journal (500 Dr vs 450 Cr)
  e('u1', 'J-U1', '2026-01-07', '2010', 500, 0),
  e('u2', 'J-U1', '2026-01-07', '3010', 0, 450),
  // R-007 duplicates (identical account/date/amounts/reference, two journals)
  e('d1', 'J-DUP1', '2026-01-08', '6020', 175.5, 0, { reference: 'DUP-1' }),
  e('d2', 'J-DUP1', '2026-01-08', '1020', 0, 175.5, { reference: 'DUP-1' }),
  e('d3', 'J-DUP2', '2026-01-08', '6020', 175.5, 0, { reference: 'DUP-1' }),
  e('d4', 'J-DUP2', '2026-01-08', '1020', 0, 175.5, { reference: 'DUP-1' }),
  // R-008 one-sided journal (also unbalanced → R-006 fires too, by design)
  e('s1', 'J-S1', '2026-01-09', '6030', 80, 0),
  e('s2', 'J-S1', '2026-01-09', '6040', 20, 0),
  // R-009 both sides on one line (journal still balances)
  e('b1', 'J-B1', '2026-01-12', '4020', 60, 60),
  // R-010 zero-amount line
  e('z1', 'J-Z1', '2026-01-13', '1030', 0, 0),
  // R-011 large round amounts
  e('r1', 'J-R1', '2026-01-14', '6050', 25000, 0),
  e('r2', 'J-R1', '2026-01-14', '1040', 0, 25000),
  // R-012 weekend posting (2026-01-03 is a Saturday)
  e('w1', 'J-W1', '2026-01-03', '1050', 300, 0),
  e('w2', 'J-W1', '2026-01-03', '4030', 0, 300),
  // R-013 period (2026-02) differs from date month (2026-01); J-M0 anchors
  // both accounts in January so R-016 stays silent for them.
  e('m0a', 'J-M0', '2026-01-14', '1060', 10, 0),
  e('m0b', 'J-M0', '2026-01-14', '4040', 0, 10),
  e('m1', 'J-M1', '2026-01-15', '1060', 125, 0, { period: '2026-02' }),
  e('m2', 'J-M1', '2026-01-15', '4040', 0, 125, { period: '2026-02' }),
  // R-014 missing description / missing reference
  e('n1', 'J-N1', '2026-01-16', '6060', 90, 0, { description: '  ' }),
  e('n2', 'J-N1', '2026-01-16', '1070', 0, 90, { reference: '' }),
  // R-015 dormancy: 2025-06-02 → 2026-01-19 is 231 days
  e('g0a', 'J-G0', '2025-06-02', '6070', 120, 0),
  e('g0b', 'J-G0', '2025-06-02', '1080', 0, 120),
  e('g1a', 'J-G1', '2026-01-19', '6070', 120, 0),
  e('g1b', 'J-G1', '2026-01-19', '1080', 0, 120),
  // R-016 new accounts first posting in the latest period (2026-02)
  e('v1', 'J-NEW', '2026-02-17', '6080', 45, 0),
  e('v2', 'J-NEW', '2026-02-17', '1090', 0, 45),
];

const EXPECTED_KEYS = [
  'R-006:J-S1:2026-01',
  'R-006:J-U1:2026-01',
  'R-007:1020:2026-01:2026-01-08|0|175.5|DUP-1',
  'R-007:6020:2026-01:2026-01-08|175.5|0|DUP-1',
  'R-008:J-S1:2026-01',
  'R-009:4020:2026-01:b1',
  'R-010:1030:2026-01:z1',
  'R-011:1040:2026-01:r2',
  'R-011:6050:2026-01:r1',
  'R-012:1050:2026-01:w1',
  'R-012:4030:2026-01:w2',
  'R-013:1060:2026-02:m1',
  'R-013:4040:2026-02:m2',
  'R-014:1070:2026-01:n2',
  'R-014:6060:2026-01:n1',
  'R-015:1080:2026-01:g1b',
  'R-015:6070:2026-01:g1a',
  'R-016:1090:2026-02',
  'R-016:6080:2026-02',
].sort();

describe('runExceptionRules — planted-exception answer key', () => {
  beforeEach(() => setClock(FIXED));
  afterEach(() => resetClock());

  it('clean ledger produces zero findings (no false positives)', () => {
    const result = runExceptionRules(CLEAN);
    expect(result.findings).toEqual([]);
    expect(result.examinedEntries).toBe(CLEAN.length);
  });

  it('planted ledger produces exactly the expected finding keys (full recall, no extras)', () => {
    const result = runExceptionRules(PLANTED);
    expect(result.findings.map((f) => f.findingKey).sort()).toEqual(EXPECTED_KEYS);
  });

  it('determinism: two runs over the same ledger are identical', () => {
    const first = runExceptionRules(PLANTED);
    const second = runExceptionRules(PLANTED);
    expect(second).toEqual(first);
  });

  it('findings carry evidence: source batch · row and entry ids', () => {
    const result = runExceptionRules(PLANTED);
    const dup = result.findings.find((f) => f.findingKey.startsWith('R-007:6020'));
    expect(dup?.evidenceRows).toEqual(['d1', 'd3']);
    expect(dup?.metadata?.sourceRefs).toEqual(['batch-planted · row 2', 'batch-planted · row 2']);
    const unbal = result.findings.find((f) => f.findingKey === 'R-006:J-U1:2026-01');
    expect(unbal?.observedValue).toBe(50);
  });

  it('unjournalled entries are counted as skipped for journal rules, never silently grouped', () => {
    const entries = [
      e('x1', '', '2026-01-05', '1010', 100, 0, { journalId: undefined, reference: '' }),
    ];
    const result = runExceptionRules(entries);
    expect(result.skippedJournalEntries).toBe(1);
    expect(result.findings.filter((f) => f.ruleId === 'R-006')).toEqual([]);
  });
});

describe('runExceptionRules — R-017 median/MAD outliers', () => {
  beforeEach(() => setClock(FIXED));
  afterEach(() => resetClock());

  it('flags only the amount far from the account median', () => {
    const amounts = [100, 102, 98, 101, 99, 5000];
    const entries: ExceptionEntryInput[] = amounts.flatMap((amount, i) => [
      e(`o${i}a`, `J-O${i}`, `2026-01-0${5 + i}`, '7010', amount, 0),
      e(`o${i}b`, `J-O${i}`, `2026-01-0${5 + i}`, `81${10 + i}`, 0, amount),
    ]);
    const result = runExceptionRules(entries);
    const outliers = result.findings.filter((f) => f.ruleId === 'R-017');
    expect(outliers.map((f) => f.findingKey)).toEqual(['R-017:7010:2026-01:o5a']);
    expect(outliers[0]?.expectedValue).toBe(100.5);
  });
});
