import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveCreditRisk, type CreditRiskGLEntry } from './creditRiskData';

const gl = (
  accountCode: string,
  debit: number,
  credit: number,
  extra: Partial<CreditRiskGLEntry> = {}
): CreditRiskGLEntry => ({
  accountCode,
  debit,
  credit,
  ...extra,
});

/** Owner funds 500 cash; sells 1,000; pays 400 COGS and 250 opex. Cash = 850. */
function operatingLedger(entityId?: string): CreditRiskGLEntry[] {
  const tag = entityId ? { entityId } : {};
  return [
    gl('1000', 500, 0, tag),
    gl('3000', 0, 500, tag),
    gl('1000', 1000, 0, tag),
    gl('4000', 0, 1000, tag),
    gl('5000', 400, 0, tag),
    gl('1000', 0, 400, tag),
    gl('6000', 250, 0, tag),
    gl('1000', 0, 250, tag),
  ];
}

describe('deriveCreditRisk — posted figures, no invented scorecard', () => {
  it('nets assets debit-normal (the old page abs’d every line and overstated cash)', () => {
    const d = deriveCreditRisk(operatingLedger());
    expect(d.totalAssets).toBe(850);
    expect(d.totalRevenue).toBe(1000);
    expect(d.totalNetIncome).toBe(350);
    expect(d.totalAssets).not.toBe(2150);
  });

  it('includes COGS and opex in net income (the old page treated prefix 5 as opex and missed 6)', () => {
    const row = deriveCreditRisk(operatingLedger()).entities[0]!;
    expect(row.cogs).toBe(400);
    expect(row.opex).toBe(250);
    expect(row.netIncome).toBe(350);
  });

  it('omits current ratio rather than inventing 2.5 / 1.5 when 11/12 and 21 are absent', () => {
    const row = deriveCreditRisk([gl('1500', 100, 0), gl('2500', 0, 40)]).entities[0]!;
    // 1500 is PP&E (not 10–12); 2500 is long-term (not 20–21).
    expect(row.currentRatio).toBeNull();
    expect(row.currentAssets).toBeNull();
    expect(row.currentLiabilities).toBeNull();
  });

  it('computes current ratio from 10xx / 20xx when both exist', () => {
    const row = deriveCreditRisk([gl('1000', 200, 0), gl('2000', 0, 80)]).entities[0]!;
    expect(row.currentAssets).toBe(200);
    expect(row.currentLiabilities).toBe(80);
    expect(row.currentRatio).toBe(2.5);
  });

  it('omits interest coverage rather than inventing interest as 5% of opex', () => {
    const d = deriveCreditRisk(operatingLedger());
    expect(d.entities[0]!.interestCoverage).toBeNull();
    expect(d.entities[0]!.interest).toBeNull();
    expect(d.unavailable.some((u) => u.label === 'Interest coverage')).toBe(true);
    // Old formula: (1000 − 400) / (400 × 0.05) = 30, then clamped to 20.
    expect(d.entities[0]!.interestCoverage).not.toBe(20);
    expect(d.entities[0]!.interestCoverage).not.toBe(30);
  });

  it('reports coverage from posted prefix-7 interest', () => {
    const row = deriveCreditRisk([...operatingLedger(), gl('7000', 70, 0)]).entities[0]!;
    // EBIT = 1000 − 400 − 250 = 350; 350 / 70 = 5.
    expect(row.interest).toBe(70);
    expect(row.interestCoverage).toBe(5);
    expect(row.netIncome).toBe(280);
  });

  it('computes ROA as NI / assets, not (rev − prefix5) / abs-assets', () => {
    const row = deriveCreditRisk(operatingLedger()).entities[0]!;
    // 350 / 850 ≈ 0.411765
    expect(row.returnOnAssets).toBeCloseTo(350 / 850, 5);
  });

  it('omits D/E when equity is zero rather than inventing 2.0', () => {
    const row = deriveCreditRisk([gl('2000', 0, 100)]).entities[0]!;
    expect(row.equity).toBe(0);
    expect(row.debtToEquity).toBeNull();
  });

  it('splits tagged entities and does not invent years-in-business', () => {
    const d = deriveCreditRisk([
      ...operatingLedger('E-1'),
      gl('4000', 0, 200, { entityId: 'E-2' }),
    ]);
    expect(d.entities.map((e) => e.id)).toEqual(['E-1', 'E-2']);
    expect(d.entities.every((e) => !('yearsInBusiness' in e))).toBe(true);
    expect(d.entities.every((e) => !('expectedLoss' in e) && !('pd' in e))).toBe(true);
  });
});

describe('contra entries', () => {
  it('nets a sales return instead of adding to revenue', () => {
    const row = deriveCreditRisk([gl('4000', 0, 1000), gl('4000', 150, 0)]).entities[0]!;
    expect(row.revenue).toBe(850);
  });
});

describe('decimal exactness (K18)', () => {
  it('sums repeating cents without float drift', () => {
    const d = deriveCreditRisk([gl('4000', 0, 0.1), gl('4000', 0, 0.2), gl('5000', 0.3, 0)]);
    expect(d.totalRevenue).toBe(0.3);
    expect(d.totalNetIncome).toBe(0);
  });
});

function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards against reintroduced defects', () => {
  const source = codeOnly(readFileSync('src/pages/credit/creditRiskData.ts', 'utf-8'));
  const page = codeOnly(readFileSync('src/pages/credit/CreditRiskPage.tsx', 'utf-8'));

  it('contains no Math.abs', () => {
    expect(source).not.toMatch(/Math\.abs/);
    expect(page).not.toMatch(/Math\.abs/);
  });

  it('does not invent interest as a fraction of opex or clamp-fill ratios', () => {
    expect(source).not.toMatch(/0\.05/);
    expect(page).not.toMatch(/0\.05/);
    expect(source).not.toMatch(/1000000/);
    expect(page).not.toMatch(/1000000/);
    expect(page).not.toMatch(/\*\s*1\.2|\*\s*0\.7/);
    expect(source).not.toMatch(/yearsInBusiness/);
    expect(page).not.toMatch(/yearsInBusiness/);
  });

  it('does not call CreditRiskEngine with invented facility inputs', () => {
    expect(page).not.toMatch(/CreditRiskEngine/);
    expect(page).not.toMatch(/creditScore|expectedLoss|exposureAtDefault|lossGivenDefault/);
    expect(source).not.toMatch(/CreditRiskEngine/);
  });

  it('the page consumes the derivation instead of recomputing it', () => {
    expect(readFileSync('src/pages/credit/CreditRiskPage.tsx', 'utf-8')).toMatch(
      /deriveCreditRisk/
    );
  });
});
