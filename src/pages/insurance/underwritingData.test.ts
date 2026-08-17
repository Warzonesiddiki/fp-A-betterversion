import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveUnderwriting, type UnderwritingGLEntry } from './underwritingData';

const gl = (accountCode: string, debit: number, credit: number): UnderwritingGLEntry => ({
  accountCode,
  debit,
  credit,
});

describe('deriveUnderwriting — posted figures from the GL', () => {
  it('computes premium, claims, expense and the combined ratio', () => {
    const d = deriveUnderwriting([gl('4000', 0, 1000), gl('5100', 400, 0), gl('6000', 250, 0)]);
    expect(d.premium).toBe(1000);
    expect(d.claims).toBe(400);
    expect(d.expense).toBe(250);
    expect(d.underwritingIncome).toBe(350);
    expect(d.lossRatioPct).toBe(40);
    expect(d.expenseRatioPct).toBe(25);
    expect(d.combinedRatioPct).toBe(65);
  });

  it('omits ratios rather than reporting zero when there is no premium', () => {
    const d = deriveUnderwriting([gl('5100', 400, 0)]);
    expect(d.premium).toBe(0);
    expect(d.lossRatioPct).toBeNull();
    expect(d.expenseRatioPct).toBeNull();
    expect(d.combinedRatioPct).toBeNull();
  });

  it('does not invent net written as 85% of premium or policy count as premium/360', () => {
    const d = deriveUnderwriting([gl('4000', 0, 36000)]);
    expect(d.premium).toBe(36000);
    expect((d as unknown as { netWrittenPremium?: number }).netWrittenPremium).toBeUndefined();
    expect((d as unknown as { policyCount?: number }).policyCount).toBeUndefined();
    // 36000 * 0.85 = 30600; 36000 / 360 = 100 — neither is emitted.
    expect(JSON.stringify(d)).not.toMatch(/30600|"policyCount":\s*100/);
  });
});

describe('contra entries', () => {
  it('nets a premium refund instead of adding to it', () => {
    const d = deriveUnderwriting([gl('4000', 0, 1000), gl('4000', 150, 0)]);
    expect(d.premium).toBe(850);
  });
});

describe('decimal exactness (K18)', () => {
  it('sums repeating cents without float drift', () => {
    const d = deriveUnderwriting([gl('4000', 0, 0.1), gl('4000', 0, 0.2), gl('5100', 0.3, 0)]);
    expect(d.premium).toBe(0.3);
    expect(d.claims).toBe(0.3);
    expect(d.lossRatioPct).toBe(100);
  });
});

describe('empty ledger', () => {
  it('returns zeroed totals and the filing / pick / adequacy disclosures', () => {
    const d = deriveUnderwriting([]);
    expect(d.premium).toBe(0);
    expect(d.unavailable.some((u) => u.label === 'Rate adequacy')).toBe(true);
    expect(d.unavailable.some((u) => u.label === 'Loss picks')).toBe(true);
    expect(d.unavailable.some((u) => u.label === 'Rate filings')).toBe(true);
  });
});

function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards against reintroduced defects', () => {
  const source = codeOnly(readFileSync('src/pages/insurance/underwritingData.ts', 'utf-8'));
  const page = codeOnly(readFileSync('src/pages/insurance/UnderwritingPage.tsx', 'utf-8'));
  const store = codeOnly(readFileSync('src/store/insuranceStore.ts', 'utf-8'));

  it('contains no Math.abs', () => {
    expect(source).not.toMatch(/Math\.abs/);
    expect(page).not.toMatch(/Math\.abs/);
  });

  it('does not invent rate-adequacy or filing quotes', () => {
    expect(page).not.toMatch(/96\.4%|61\.4%|\+8\.4%|\+12\.2%|RF-401|CA-2026-012/);
    expect(store).not.toMatch(/RF-401|CA-2026-012|\+8\.4%/);
    expect(source).not.toMatch(/0\.85|360/);
  });

  it('does not call InsuranceEngine.calculateStats (0.85× / 360 invention)', () => {
    expect(page).not.toMatch(/calculateStats/);
    expect(source).not.toMatch(/calculateStats/);
  });

  it('the page consumes the derivation instead of recomputing it', () => {
    expect(readFileSync('src/pages/insurance/UnderwritingPage.tsx', 'utf-8')).toMatch(
      /deriveUnderwriting/
    );
  });
});
