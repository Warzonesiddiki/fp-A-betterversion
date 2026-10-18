/**
 * Phase 4 slice of Phase 3: the aggregate catalogue rules R-001…R-004 get
 * real evaluators now that monthly baselines exist. R-005 stays PROPOSED
 * in the catalogue and is never run — a rule that cannot run is not
 * presented as running.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runAggregateRules, type AggregateEntryInput } from './runAggregateRules';
import { setClock, resetClock } from '@/utils/clock';

const FIXED = '2026-10-15T09:30:00.000Z';

function e(
  id: string,
  date: string,
  accountCode: string,
  debit: number,
  credit: number
): AggregateEntryInput {
  return { id, date, period: date.slice(0, 7), accountCode, debit, credit };
}

describe('runAggregateRules', () => {
  beforeEach(() => setClock(FIXED));
  afterEach(() => resetClock());

  it('R-001: revenue 30% above the prior-months baseline fires once, for that month', () => {
    const entries = [
      e('r1', '2025-11-03', '4010', 0, 100_000),
      e('r2', '2025-12-01', '4010', 0, 100_000),
      e('r3', '2026-01-05', '4010', 0, 130_000), // +30% vs 100k baseline
      e('r4', '2026-02-02', '4010', 0, 131_000), // +19% vs 110k baseline → silent
    ];
    const findings = runAggregateRules(entries).filter((f) => f.ruleId === 'R-001');
    expect(findings.map((f) => f.findingKey)).toEqual(['R-001:revenue:2026-01']);
    expect(findings[0]?.observedValue).toBe(130_000);
    expect(findings[0]?.expectedValue).toBe(100_000);
  });

  it('R-002: opex spike above 50% month-over-month fires', () => {
    const entries = [
      e('x1', '2026-01-05', '6010', 10_000, 0),
      e('x2', '2026-02-02', '6010', 16_000, 0), // +60%
      e('x3', '2026-03-02', '6010', 16_500, 0), // +3% → silent
    ];
    const findings = runAggregateRules(entries).filter((f) => f.ruleId === 'R-002');
    expect(findings.map((f) => f.findingKey)).toEqual(['R-002:cost:2026-02']);
  });

  it('R-003: revenue drop beyond 30% vs prior year fires', () => {
    const entries = [
      e('y1', '2025-03-03', '4010', 0, 100_000),
      e('y2', '2026-03-02', '4010', 0, 60_000), // −40% YoY
    ];
    const findings = runAggregateRules(entries).filter((f) => f.ruleId === 'R-003');
    expect(findings.map((f) => f.findingKey)).toEqual(['R-003:revenue:2026-03']);
  });

  it('R-004: an account month far outside its own history (z > 3) fires', () => {
    const movements = [100, 102, 99, 101, 500];
    const entries = movements.map((amount, i) =>
      e(`z${i}`, `2026-0${i + 1}-05`, '1010', amount, 0)
    );
    const findings = runAggregateRules(entries).filter((f) => f.ruleId === 'R-004');
    expect(findings.map((f) => f.findingKey)).toEqual(['R-004:1010:2026-05']);
  });

  it('nothing fires on a stable ledger, R-005 (PROPOSED) never runs, output is deterministic', () => {
    const entries = [
      e('s1', '2026-01-05', '4010', 0, 100_000),
      e('s2', '2026-02-02', '4010', 0, 101_000),
      e('s3', '2026-01-06', '6010', 10_000, 0),
      e('s4', '2026-02-03', '6010', 10_100, 0),
    ];
    const first = runAggregateRules(entries);
    expect(first).toEqual([]);
    const planted = [
      e('r1', '2025-11-03', '4010', 0, 100_000),
      e('r3', '2026-01-05', '4010', 0, 150_000),
    ];
    expect(runAggregateRules(planted)).toEqual(runAggregateRules(planted));
    expect(runAggregateRules(planted).some((f) => f.ruleId === 'R-005')).toBe(false);
  });
});
