import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveTaxProvision, periodToQuarter, type TaxProvisionGLEntry } from './taxProvisionData';

/**
 * Regression suite for tax-provision derivation.
 *
 * The page this module replaced invented a four-jurisdiction provision from
 * hardcoded splits (Federal 70% @ 21%, CA 15% @ 8.84%, NY 10% @ 6.5%,
 * International 5% @ 12.5%), a deferred/current split from more ratios, and a
 * quarterly ETR trend of `18 + ((i * 3) % 5)`. It also applied Math.abs per
 * expense entry and ignored COGS (prefix 5) and interest (prefix 7), so
 * pre-tax income was overstated. Every test below pins one of those closed.
 */

const gl = (
  accountCode: string,
  debit: number,
  credit: number,
  period = '2026-01'
): TaxProvisionGLEntry => ({
  accountCode,
  debit,
  credit,
  period,
  date: `${period}-15`,
});

/**
 * Balanced ledger used across the money-safety sessions:
 *   owner contributes 500 cash; sells 1,000 cash; pays 400 COGS; pays 250 opex.
 * Expected pretax = 350. Adding a 70 tax posting gives ETR 20% and NI 280.
 */
function operatingLedger(withTax = false): TaxProvisionGLEntry[] {
  const rows: TaxProvisionGLEntry[] = [
    gl('1000', 500, 0),
    gl('3000', 0, 500),
    gl('1000', 1000, 0),
    gl('4000', 0, 1000),
    gl('5000', 400, 0),
    gl('1000', 0, 400),
    gl('6000', 250, 0),
    gl('1000', 0, 250),
  ];
  if (withTax) {
    rows.push(gl('8000', 70, 0), gl('1000', 0, 70));
  }
  return rows;
}

describe('deriveTaxProvision — book figures from the posted GL', () => {
  it('computes pretax as revenue − COGS − opex (the old page missed COGS)', () => {
    const d = deriveTaxProvision(operatingLedger());

    expect(d.revenue.toNumber()).toBe(1000);
    expect(d.cogs.toNumber()).toBe(400);
    expect(d.opex.toNumber()).toBe(250);
    expect(d.pretaxIncome.toNumber()).toBe(350);
    // The previous implementation used only prefix-6 expenses, so pretax was 750.
    expect(d.pretaxIncome.toNumber()).not.toBe(750);
  });

  it('includes posted interest in pretax and omits it when absent', () => {
    const withInterest = deriveTaxProvision([...operatingLedger(), gl('7000', 50, 0)]);
    expect(withInterest.hasInterest).toBe(true);
    expect(withInterest.interest.toNumber()).toBe(50);
    expect(withInterest.pretaxIncome.toNumber()).toBe(300);

    const without = deriveTaxProvision(operatingLedger());
    expect(without.hasInterest).toBe(false);
    expect(without.interest.toNumber()).toBe(0);
    expect(without.lines.find((l) => l.key === 'interest')?.amount).toBeNull();
  });

  it('reports posted tax, ETR and net income only when prefix-8 accounts exist', () => {
    const taxed = deriveTaxProvision(operatingLedger(true));
    expect(taxed.hasPostedTax).toBe(true);
    expect(taxed.postedTaxExpense?.toNumber()).toBe(70);
    expect(taxed.effectiveRatePct?.toNumber()).toBe(20);
    expect(taxed.netIncome?.toNumber()).toBe(280);

    const untaxed = deriveTaxProvision(operatingLedger());
    expect(untaxed.hasPostedTax).toBe(false);
    expect(untaxed.postedTaxExpense).toBeNull();
    expect(untaxed.effectiveRatePct).toBeNull();
    expect(untaxed.netIncome).toBeNull();
    expect(untaxed.unavailable.some((u) => u.label === 'Income tax expense')).toBe(true);
  });

  it('omits ETR rather than reporting zero when pretax is zero', () => {
    const d = deriveTaxProvision([gl('8000', 10, 0)]);
    expect(d.pretaxIncome.toNumber()).toBe(0);
    expect(d.postedTaxExpense?.toNumber()).toBe(10);
    expect(d.effectiveRatePct).toBeNull();
  });
});

describe('deriveTaxProvision — no fabricated provision', () => {
  it('never invents a jurisdiction table', () => {
    const d = deriveTaxProvision(operatingLedger(true));
    const labels = d.lines.map((l) => l.label).join(' | ');
    expect(labels).not.toMatch(/Federal|State \(CA\)|State \(NY\)|International/i);
    expect(d.unavailable.some((u) => u.label.includes('Jurisdiction'))).toBe(true);
  });

  it('never invents a current/deferred split', () => {
    const d = deriveTaxProvision(operatingLedger(true));
    expect(d.lines.every((l) => !/deferred|current tax/i.test(l.label))).toBe(true);
    expect(d.unavailable.some((u) => u.label.includes('deferred'))).toBe(true);
  });

  it('does not publish a quarterly seasonality curve the GL cannot support', () => {
    // A single-period ledger has one honest quarter, not four invented ones.
    const d = deriveTaxProvision(operatingLedger(true));
    expect(d.quarters).toHaveLength(1);
    expect(d.quarters[0]?.quarter).toBe('2026-Q1');
    expect(d.quarters[0]?.pretaxIncome.toNumber()).toBe(350);
    expect(d.quarters[0]?.effectiveRatePct?.toNumber()).toBe(20);
  });

  it('derives multi-quarter pretax from period tags instead of a seeded formula', () => {
    const rows = [
      gl('4000', 0, 100, '2026-01'),
      gl('4000', 0, 200, '2026-04'),
      gl('4000', 0, 400, '2026-07'),
      gl('8000', 21, 0, '2026-01'),
      gl('8000', 42, 0, '2026-04'),
    ];
    const d = deriveTaxProvision(rows);
    expect(d.quarters.map((q) => q.quarter)).toEqual(['2026-Q1', '2026-Q2', '2026-Q3']);
    expect(d.quarters[0]?.pretaxIncome.toNumber()).toBe(100);
    expect(d.quarters[0]?.effectiveRatePct?.toNumber()).toBe(21);
    expect(d.quarters[1]?.pretaxIncome.toNumber()).toBe(200);
    expect(d.quarters[1]?.effectiveRatePct?.toNumber()).toBe(21);
    expect(d.quarters[2]?.postedTaxExpense).toBeNull();
    // The old page used `18 + ((i * 3) % 5)` → 18, 21, 24, 22 for every entity.
    expect(d.quarters.map((q) => q.effectiveRatePct?.toNumber())).not.toEqual([18, 21, 24]);
  });
});

describe('contra and reversing entries', () => {
  it('nets a credit memo against revenue instead of adding to it', () => {
    const d = deriveTaxProvision([
      gl('4000', 0, 1000),
      gl('4000', 150, 0), // sales return
    ]);
    // Math.abs per entry would give 1150.
    expect(d.revenue.toNumber()).toBe(850);
    expect(d.pretaxIncome.toNumber()).toBe(850);
  });

  it('nets a reversing entry against opex instead of doubling it', () => {
    const d = deriveTaxProvision([gl('4000', 0, 1000), gl('6000', 250, 0), gl('6000', 0, 250)]);
    expect(d.opex.toNumber()).toBe(0);
    expect(d.pretaxIncome.toNumber()).toBe(1000);
  });

  it('lets a tax refund reduce posted tax rather than inflating it', () => {
    const d = deriveTaxProvision([
      gl('4000', 0, 1000),
      gl('8000', 70, 0),
      gl('8000', 0, 20), // refund / reversing accrual
    ]);
    expect(d.postedTaxExpense?.toNumber()).toBe(50);
    expect(d.netIncome?.toNumber()).toBe(950);
  });
});

describe('waterfall steps do not double-count net income', () => {
  it('is pretax minus tax, not pretax minus tax plus net income', () => {
    const d = deriveTaxProvision(operatingLedger(true));
    const sum = d.waterfall.reduce((s, step) => s + step.value, 0);
    expect(d.waterfall.map((s) => s.name)).toEqual(['Pre-Tax Income', 'Income Tax']);
    expect(sum).toBe(280);
  });

  it('is just pretax when no tax is posted', () => {
    const d = deriveTaxProvision(operatingLedger());
    expect(d.waterfall).toEqual([{ name: 'Pre-Tax Income', value: 350 }]);
  });
});

describe('decimal exactness (K18)', () => {
  it('sums repeating cents without float drift', () => {
    const d = deriveTaxProvision([gl('4000', 0, 0.1), gl('4000', 0, 0.2), gl('5000', 0.3, 0)]);
    expect(d.revenue.toString()).toBe('0.3');
    expect(d.pretaxIncome.toString()).toBe('0');
  });

  it('holds exactness across many small entries', () => {
    const rows = Array.from({ length: 1000 }, () => gl('4000', 0, 0.01));
    expect(deriveTaxProvision(rows).revenue.toNumber()).toBe(10);
  });

  it('computes ETR exactly on a repeating quotient', () => {
    const d = deriveTaxProvision([gl('4000', 0, 300), gl('8000', 70, 0)]);
    // 70 / 300 * 100 = 23.3... ; Decimal must not become 23.333333333333336.
    expect(d.effectiveRatePct?.toString()).toBe('23.33333333333333333333333333333333333333');
  });
});

describe('periodToQuarter', () => {
  it('maps calendar months onto fiscal-style year-quarters', () => {
    expect(periodToQuarter('2026-01')).toBe('2026-Q1');
    expect(periodToQuarter('2026-04-15')).toBe('2026-Q2');
    expect(periodToQuarter('2026-12')).toBe('2026-Q4');
  });

  it('rejects unparseable periods rather than inventing a bucket', () => {
    expect(periodToQuarter('unknown')).toBeNull();
    expect(periodToQuarter('FY26')).toBeNull();
    expect(periodToQuarter('2026-13')).toBeNull();
  });
});

describe('empty and degenerate ledgers', () => {
  it('returns zeroed totals for an empty ledger', () => {
    const d = deriveTaxProvision([]);
    expect(d.revenue.toNumber()).toBe(0);
    expect(d.pretaxIncome.toNumber()).toBe(0);
    expect(d.hasPostedTax).toBe(false);
    expect(d.quarters).toEqual([]);
  });

  it('ignores entries with no account code', () => {
    const d = deriveTaxProvision([{ debit: 999, credit: 0 }, gl('4000', 0, 500)]);
    expect(d.revenue.toNumber()).toBe(500);
  });
});

/** Strip comments so prose describing a defect never satisfies a guard against it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards against reintroduced defects', () => {
  const source = codeOnly(readFileSync('src/pages/tax/taxProvisionData.ts', 'utf-8'));
  const page = codeOnly(readFileSync('src/pages/tax/TaxProvisionPage.tsx', 'utf-8'));

  it('contains no Math.abs (it discards contra entries)', () => {
    expect(source).not.toMatch(/Math\.abs/);
    expect(page).not.toMatch(/Math\.abs/);
  });

  it('contains no hardcoded allocation ratios', () => {
    expect(source).not.toMatch(/[*]\s*0\.\d+/);
    expect(source).not.toMatch(/\.times\(\s*0\.\d+\s*\)/);
    expect(page).not.toMatch(/[*]\s*0\.\d+/);
  });

  it('does not hardcode statutory rates or invented jurisdictions', () => {
    // Object-literal assignments, not prose that names the defect.
    expect(source).not.toMatch(/taxRate\s*:/);
    expect(page).not.toMatch(/taxRate\s*:/);
    expect(source).not.toMatch(/jurisdiction\s*:\s*['"]/);
    expect(page).not.toMatch(/jurisdiction\s*:\s*['"]/);
    expect(source).not.toMatch(/State \(CA\)|State \(NY\)/);
    expect(page).not.toMatch(/State \(CA\)|State \(NY\)/);
  });

  it('does not seed a quarterly ETR series', () => {
    expect(source).not.toMatch(/18\s*\+/);
    expect(page).not.toMatch(/18\s*\+/);
    expect(page).not.toMatch(/% 5/);
  });

  it('the page consumes the derivation instead of recomputing it', () => {
    expect(readFileSync('src/pages/tax/TaxProvisionPage.tsx', 'utf-8')).toMatch(
      /deriveTaxProvision/
    );
  });
});
