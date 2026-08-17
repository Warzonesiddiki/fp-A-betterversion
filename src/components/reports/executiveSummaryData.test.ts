import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveExecutiveSummary, type ExecutiveSummaryGLEntry } from './executiveSummaryData';

const gl = (
  accountCode: string,
  debit: number,
  credit: number
): ExecutiveSummaryGLEntry => ({
  accountCode,
  debit,
  credit,
});

function operatingLedger(): ExecutiveSummaryGLEntry[] {
  return [
    gl('1000', 500, 0),
    gl('3000', 0, 500),
    gl('1000', 1000, 0),
    gl('4000', 0, 1000),
    gl('5000', 400, 0),
    gl('1000', 0, 400),
    gl('6000', 250, 0),
    gl('1000', 0, 250),
  ];
}

describe('deriveExecutiveSummary — posted figures, no invented pack', () => {
  it('computes revenue, operating income and cash from the GL', () => {
    const d = deriveExecutiveSummary(operatingLedger());
    expect(d.revenue).toBe(1000);
    expect(d.cogs).toBe(400);
    expect(d.opex).toBe(250);
    expect(d.operatingIncome).toBe(350);
    expect(d.cash).toBe(850);
  });

  it('omits cash rather than reporting zero when account 1000 is absent', () => {
    const d = deriveExecutiveSummary([gl('4000', 0, 1000)]);
    expect(d.cash).toBeNull();
  });

  it('does not emit an EBITDA or budget-variance field', () => {
    const d = deriveExecutiveSummary(operatingLedger());
    expect((d as unknown as { ebitda?: number }).ebitda).toBeUndefined();
    expect((d as unknown as { budgetVariance?: number }).budgetVariance).toBeUndefined();
    expect(d.unavailable.some((u) => u.label === 'EBITDA')).toBe(true);
    expect(d.unavailable.some((u) => u.label === 'Budget variance')).toBe(true);
  });
});

describe('contra and exactness', () => {
  it('nets a sales return', () => {
    expect(deriveExecutiveSummary([gl('4000', 0, 1000), gl('4000', 150, 0)]).revenue).toBe(850);
  });

  it('sums 0.1 + 0.2 without float drift', () => {
    const d = deriveExecutiveSummary([gl('4000', 0, 0.1), gl('4000', 0, 0.2)]);
    expect(d.revenue).toBe(0.3);
  });
});

function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards against reintroduced defects', () => {
  const source = codeOnly(readFileSync('src/components/reports/executiveSummaryData.ts', 'utf-8'));
  const page = codeOnly(readFileSync('src/components/reports/ExecutiveSummary.tsx', 'utf-8'));

  it('contains no Math.abs', () => {
    expect(source).not.toMatch(/Math\.abs/);
    expect(page).not.toMatch(/Math\.abs/);
  });

  it('does not hardcode the retired pack figures', () => {
    expect(page).not.toMatch(/\$4\.2M|\$1\.1M|\$850k|\+12%|\+4%|-2%/);
    expect(source).not.toMatch(/\$4\.2M|\$1\.1M|\$850k/);
  });

  it('does not invent a SaaS bookings narrative', () => {
    expect(page).not.toMatch(/SaaS bookings|marketing spend|AR collections/);
  });

  it('the component consumes the derivation', () => {
    expect(readFileSync('src/components/reports/ExecutiveSummary.tsx', 'utf-8')).toMatch(
      /deriveExecutiveSummary/
    );
  });
});
