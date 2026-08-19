import { describe, it, expect } from 'vitest';
import {
  deriveValueBasedCare,
  type ProgramInput,
  type QualityMetricInput,
  type SavingsEntryInput,
} from './valueBasedCareData';

const METRICS: QualityMetricInput[] = [
  { subject: 'Readmissions', A: 80, B: 75, fullMark: 100 },
  { subject: 'Safety', A: 45, B: 50, fullMark: 50 },
];

const SAVINGS: SavingsEntryInput[] = [
  { category: 'Orthopedics', target: 2000000, actual: 1850000 },
  { category: 'Cardiology', target: 1500000, actual: 1600000 },
];

const PROGRAMS: ProgramInput[] = [
  {
    id: 'p1',
    program: 'Recorded ACO',
    population: '1,000',
    qualityScore: '90%',
    sharedSavings: '+$50,000',
    status: 'High',
  },
];

describe('deriveValueBasedCare', () => {
  it('returns null when nothing is recorded', () => {
    expect(deriveValueBasedCare([], [], [])).toBeNull();
  });

  it('weights the quality score by full mark — ratio of sums, not mean of percents', () => {
    const d = deriveValueBasedCare(METRICS, [], [])!;
    // Σ A ÷ Σ fullMark = 125 / 150 = 83.33%. A mean of the two dimension
    // percentages (80% and 90%) would wrongly report 85.
    expect(d.aggregateQualityScore).toBe(83.33);
  });

  it('derives per-bundle savings as target − actual', () => {
    const d = deriveValueBasedCare([], SAVINGS, [])!;
    expect(d.savingsRows[0]!.savings).toBe(150000);
    expect(d.savingsRows[1]!.savings).toBe(-100000);
    expect(d.netSharedSavings).toBe(50000);
  });

  it('ignores a hand-entered savings field that disagrees with target/actual', () => {
    const d = deriveValueBasedCare(
      [],
      [{ category: 'X', target: 1000, actual: 900, savings: 999999 } as SavingsEntryInput],
      []
    )!;
    expect(d.savingsRows[0]!.savings).toBe(100);
    expect(d.netSharedSavings).toBe(100);
  });

  it('aggregates money decimally — no IEEE-754 drift', () => {
    // Float: 1.1 + 2.2 = 3.3000000000000003.
    const drift: SavingsEntryInput[] = [
      { category: 'A', target: 1.1, actual: 0 },
      { category: 'B', target: 2.2, actual: 0 },
    ];
    expect(deriveValueBasedCare([], drift, [])!.netSharedSavings).toBe(3.3);
  });

  it('emits null quality score when no full mark is recorded', () => {
    const noMarks: QualityMetricInput[] = [{ subject: 'X', A: 10, B: 5, fullMark: 0 }];
    expect(deriveValueBasedCare(noMarks, [], [])!.aggregateQualityScore).toBeNull();
  });

  it('passes programs through as recorded', () => {
    expect(deriveValueBasedCare([], [], PROGRAMS)!.programs).toEqual(PROGRAMS);
  });
});
