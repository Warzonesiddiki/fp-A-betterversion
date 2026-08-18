import { describe, it, expect } from 'vitest';
import {
  addMonths,
  deriveRollingForecast,
  MIN_MONTHS_FOR_GROWTH,
  type RollingForecastGLEntry,
} from './rollingForecastModel';

/**
 * Known-answer tests for the rolling forecast.
 *
 * Seeded ledger — revenue grows exactly 10% a month, expenses exactly 10%:
 *   2026-01  revenue 100,000 (credit 4000)   expenses 50,000 (debit 6000)
 *   2026-02  revenue 110,000                 expenses 55,000
 *   2026-03  revenue 121,000                 expenses 60,500
 *   2026-04  revenue 133,100                 expenses 66,550
 * Mean MoM growth is therefore exactly 10% on both series, and the one-step
 * projection from April is 146,410 / 73,205.
 */
function month(m: string, revenue: number, expenses: number): RollingForecastGLEntry[] {
  return [
    { accountCode: '4000', debit: 0, credit: revenue, period: m },
    { accountCode: '6000', debit: expenses, credit: 0, period: m },
  ];
}

const LEDGER: RollingForecastGLEntry[] = [
  ...month('2026-01', 100000, 50000),
  ...month('2026-02', 110000, 55000),
  ...month('2026-03', 121000, 60500),
  ...month('2026-04', 133100, 66550),
];

describe('addMonths', () => {
  it('rolls the year over without Date arithmetic', () => {
    expect(addMonths('2026-01', 1)).toBe('2026-02');
    expect(addMonths('2026-11', 2)).toBe('2027-01');
    expect(addMonths('2026-12', 13)).toBe('2028-01');
  });
});

describe('deriveRollingForecast — actuals', () => {
  it('sums P&L by natural balance and ignores balance-sheet postings', () => {
    const withBalanceSheet = [
      ...LEDGER,
      { accountCode: '1000', debit: 999999, credit: 0, period: '2026-04' },
    ];
    const f = deriveRollingForecast(withBalanceSheet, 12)!;
    // The old page accumulated debit − credit over every account, so cash and
    // revenue both entered the trend and revenue entered it negative.
    expect(f.postedRevenue).toBe(464100);
    expect(f.postedExpenses).toBe(232050);
    expect(f.postedNetIncome).toBe(232050);
    expect(f.actualMonths).toBe(4);
  });

  it('marks posted months as actual and keeps them in order', () => {
    const f = deriveRollingForecast(LEDGER, 12)!;
    const actuals = f.series.filter((p) => p.kind === 'actual');
    expect(actuals.map((p) => p.month)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04']);
    expect(actuals[0]!.revenue).toBe(100000);
    expect(actuals[0]!.netIncome).toBe(50000);
  });

  it('returns null when no P&L month is posted', () => {
    expect(deriveRollingForecast([], 12)).toBeNull();
    expect(
      deriveRollingForecast([{ accountCode: '1000', debit: 5, credit: 0, period: '2026-01' }], 12)
    ).toBeNull();
  });

  it('honours the trailing window', () => {
    const f = deriveRollingForecast(LEDGER, 2)!;
    expect(f.actualMonths).toBe(2);
    expect(f.postedRevenue).toBe(254100); // March + April only
  });
});

describe('deriveRollingForecast — projection', () => {
  it('derives the growth rate without rounding the sum first', () => {
    const f = deriveRollingForecast(LEDGER, 12)!;
    expect(f.revenueGrowthPercent).toBe(10);
    expect(f.expenseGrowthPercent).toBe(10);
  });

  it('projects revenue and expenses separately and derives net income', () => {
    const f = deriveRollingForecast(LEDGER, 12)!;
    const projected = f.series.filter((p) => p.kind === 'projected');
    expect(projected[0]!.month).toBe('2026-05');
    expect(projected[0]!.revenue).toBe(146410);
    expect(projected[0]!.expenses).toBe(73205);
    expect(projected[0]!.netIncome).toBe(73205);
  });

  it('states its method', () => {
    const f = deriveRollingForecast(LEDGER, 12)!;
    expect(f.projectionMethod).toMatch(/Compound extrapolation of the mean month-over-month/);
    expect(f.projectionMethod).toMatch(/Net income is derived/);
  });

  it('refuses to project from too little history', () => {
    const short = [...month('2026-01', 100, 50), ...month('2026-02', 110, 55)];
    const f = deriveRollingForecast(short, 12)!;
    expect(f.actualMonths).toBeLessThan(MIN_MONTHS_FOR_GROWTH);
    expect(f.revenueGrowthPercent).toBeNull();
    expect(f.projectedRevenue).toBeNull();
    expect(f.series.every((p) => p.kind === 'actual')).toBe(true);
    expect(f.unavailable.map((u) => u.label)).toContain('Projection');
  });

  it('refuses to derive growth off a non-positive base', () => {
    const zeroBase = [
      ...month('2026-01', 0, 0),
      ...month('2026-02', 0, 0),
      ...month('2026-03', 0, 0),
    ];
    const f = deriveRollingForecast(zeroBase, 12)!;
    expect(f.revenueGrowthPercent).toBeNull();
    expect(f.projectedRevenue).toBeNull();
  });
});

describe('deriveRollingForecast — accuracy is backtested, not asserted', () => {
  it('scores the method against what was actually posted', () => {
    const f = deriveRollingForecast(LEDGER, 12)!;
    // Fit on Jan–Mar (10% growth), predict April: 121,000 * 1.1 = 133,100,
    // which is exactly what posted, so the error is zero.
    expect(f.backtest).toHaveLength(1);
    expect(f.backtest[0]).toEqual({
      month: '2026-04',
      actual: 133100,
      predicted: 133100,
      errorPercent: 0,
    });
    expect(f.backtestAccuracyPercent).toBe(100);
    expect(f.backtestSampleCount).toBe(1);
  });

  it('penalises a method that misses', () => {
    const noisy = [
      ...month('2026-01', 100000, 10),
      ...month('2026-02', 110000, 10),
      ...month('2026-03', 121000, 10),
      ...month('2026-04', 100000, 10), // predicted 133,100, actual 100,000
    ];
    const f = deriveRollingForecast(noisy, 12)!;
    // |100,000 − 133,100| / 100,000 = 33.1% error -> 66.9% accuracy
    expect(f.backtest[0]!.errorPercent).toBe(33.1);
    expect(f.backtestAccuracyPercent).toBe(66.9);
  });

  it('never reports accuracy as a share of small month-over-month moves', () => {
    // The old KPI counted months whose actual moved <10% and called it accuracy;
    // on this steady 10% series that rule returns 0% while the method is perfect.
    const f = deriveRollingForecast(LEDGER, 12)!;
    expect(f.backtestAccuracyPercent).toBe(100);
  });

  it('reports null accuracy and says why with too little history', () => {
    const short = [...month('2026-01', 100, 50), ...month('2026-02', 110, 55)];
    const f = deriveRollingForecast(short, 12)!;
    expect(f.backtestAccuracyPercent).toBeNull();
    expect(f.backtestSampleCount).toBe(0);
    expect(f.unavailable.map((u) => u.label)).toContain('Method accuracy');
  });

  it('always declares the confidence interval unavailable', () => {
    const f = deriveRollingForecast(LEDGER, 12)!;
    expect(f.unavailable.map((u) => u.label)).toContain('Confidence interval');
    expect(JSON.stringify(f)).not.toContain('8.5');
  });
});
