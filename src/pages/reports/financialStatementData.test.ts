import { describe, it, expect } from 'vitest';
import {
  deriveStatementData,
  type StatementBudgetLine,
  type StatementGLEntry,
} from './financialStatementData';

const gl = (accountCode: string, debit: number, credit: number): StatementGLEntry => ({
  accountCode,
  debit,
  credit,
});

const budget = (accountCode: string, amount: number): StatementBudgetLine => ({
  accountCode,
  amount,
});

describe('deriveStatementData — P&L derivation', () => {
  it('derives revenue, COGS, gross profit and EBITDA from posted entries', () => {
    const { data } = deriveStatementData([
      gl('4000', 0, 1000),
      gl('5000', 400, 0),
      gl('6000', 250, 0),
    ]);

    expect(data['totalrevenue_actual']).toBe(1000);
    expect(data['totalcogs_actual']).toBe(400);
    expect(data['grossprofit_actual']).toBe(600);
    expect(data['totaloperatingexpenses_actual']).toBe(250);
    expect(data['ebitda_actual']).toBe(350);
  });

  it('nets contra entries within a prefix instead of summing absolute values', () => {
    // A sales return (debit to revenue) must REDUCE revenue. The previous
    // implementation used Math.abs and inflated both revenue and costs.
    const { data } = deriveStatementData([
      gl('4000', 0, 1000),
      gl('4100', 150, 0), // sales returns
      gl('5000', 400, 0),
      gl('5100', 0, 50), // vendor credit
    ]);

    expect(data['totalrevenue_actual']).toBe(850);
    expect(data['totalcogs_actual']).toBe(350);
    expect(data['grossprofit_actual']).toBe(500);
  });

  it('computes margins as percentages of revenue', () => {
    const { data } = deriveStatementData([gl('4000', 0, 1000), gl('5000', 250, 0)]);

    expect(data['grossmargin_actual']).toBe(75);
  });

  it('omits margins rather than reporting zero when revenue is zero', () => {
    const { data } = deriveStatementData([gl('5000', 400, 0)]);

    expect(data['grossmargin_actual']).toBeUndefined();
    expect(data['netmargin_actual']).toBeUndefined();
  });

  it('flows interest and tax into pre-tax and net income when posted', () => {
    const { data } = deriveStatementData([
      gl('4000', 0, 1000),
      gl('5000', 400, 0),
      gl('6000', 200, 0),
      gl('7000', 50, 0), // interest expense
      gl('8000', 70, 0), // income tax
    ]);

    expect(data['ebitda_actual']).toBe(400);
    expect(data['interestexpense_actual']).toBe(50);
    expect(data['pretaxincome_actual']).toBe(350);
    expect(data['incometax_actual']).toBe(70);
    expect(data['netincome_actual']).toBe(280);
  });

  it('does not emit interest or tax lines when those accounts are absent', () => {
    const { data, unavailable } = deriveStatementData([gl('4000', 0, 1000)]);

    expect(data['interestexpense_actual']).toBeUndefined();
    expect(data['incometax_actual']).toBeUndefined();
    // Net income still articulates: with no interest/tax it equals EBITDA.
    expect(data['netincome_actual']).toBe(1000);
    expect(unavailable.some((u) => u.label.includes('Interest'))).toBe(true);
  });
});

describe('deriveStatementData — no fabricated values', () => {
  it('never invents P&L component splits from ratios', () => {
    const { data } = deriveStatementData([
      gl('4000', 0, 1000),
      gl('5000', 400, 0),
      gl('6000', 250, 0),
    ]);

    // The removed implementation emitted revenue*0.7 / revenue*0.3 etc.
    for (const key of [
      'productrevenue_actual',
      'servicerevenue_actual',
      'materialcosts_actual',
      'directlabor_actual',
      'manufacturingoverhead_actual',
      'salesmarketing_actual',
      'researchdevelopment_actual',
      'generaladministrative_actual',
    ]) {
      expect(data[key]).toBeUndefined();
    }
  });

  it('never invents balance-sheet captions from ratios of total assets', () => {
    const { data } = deriveStatementData([gl('1000', 900, 0), gl('2000', 0, 400), gl('3000', 0, 500)]);

    expect(data['totalassets_current']).toBe(900);
    expect(data['totalliabilities_current']).toBe(400);
    expect(data['totalstockholdersequity_current']).toBe(500);
    expect(data['totalliabilitiesequity_current']).toBe(900);

    // Previously cash = assets*0.15, receivables = assets*0.1, etc.
    for (const key of [
      'cashequivalents_current',
      'accountsreceivable_current',
      'inventory_current',
      'goodwill_current',
      'netppe_current',
      'accountspayable_current',
      'longtermdebt_current',
      'retainedearnings_current',
    ]) {
      expect(data[key]).toBeUndefined();
    }
  });

  it('does not publish a quarterly cash-flow profile the GL cannot support', () => {
    const { data } = deriveStatementData([gl('4000', 0, 1000)]);

    // Previously netIncome*0.22/0.25/0.27/0.26 — a fabricated seasonality curve.
    for (const key of ['netincome_q1', 'netincome_q2', 'netincome_q3', 'netincome_q4']) {
      expect(data[key]).toBeUndefined();
    }
    expect(data['netincome_fy']).toBe(1000);
  });

  it('omits all budget columns when no budget is posted', () => {
    const { data, hasBudget, unavailable } = deriveStatementData([
      gl('4000', 0, 1000),
      gl('5000', 400, 0),
    ]);

    expect(hasBudget).toBe(false);
    // Previously budget = revenue*0.95 and variancePct was hardcoded to 5.3.
    for (const key of [
      'totalrevenue_budget',
      'totalrevenue_variance',
      'totalrevenue_variancePct',
      'totalrevenue_status',
    ]) {
      expect(data[key]).toBeUndefined();
    }
    expect(unavailable.some((u) => u.label === 'Budget vs Actual')).toBe(true);
  });
});

describe('deriveStatementData — Budget vs Actual', () => {
  const entries = [gl('4000', 0, 1000), gl('5000', 400, 0), gl('6000', 250, 0)];

  it('uses posted budget line items and computes real variances', () => {
    const { data, hasBudget } = deriveStatementData(entries, [
      budget('4000', 900),
      budget('5000', 380),
      budget('6000', 300),
    ]);

    expect(hasBudget).toBe(true);
    expect(data['totalrevenue_budget']).toBe(900);
    expect(data['totalrevenue_variance']).toBe(100);
    expect(data['totalrevenue_variancePct']).toBeCloseTo(11.111, 3);
  });

  it('marks revenue above budget favourable and cost above budget unfavourable', () => {
    const { data } = deriveStatementData(entries, [
      budget('4000', 900), // actual 1000 -> over budget -> favourable
      budget('5000', 380), // actual 400 -> over budget -> unfavourable
      budget('6000', 300), // actual 250 -> under budget -> favourable
    ]);

    expect(data['totalrevenue_status']).toBe(1);
    expect(data['costofgoodssold_status']).toBe(-1);
    expect(data['totalopex_status']).toBe(1);
  });

  it('derives budgeted gross profit and EBITDA from budgeted components', () => {
    const { data } = deriveStatementData(entries, [
      budget('4000', 900),
      budget('5000', 380),
      budget('6000', 300),
    ]);

    expect(data['grossprofit_budget']).toBe(520);
    expect(data['ebitda_budget']).toBe(220);
    expect(data['grossmargin_budget']).toBeCloseTo(57.778, 3);
  });

  it('emits partial budget coverage without inventing the missing lines', () => {
    const { data, hasBudget } = deriveStatementData(entries, [budget('4000', 900)]);

    expect(hasBudget).toBe(true);
    expect(data['totalrevenue_budget']).toBe(900);
    expect(data['costofgoodssold_budget']).toBeUndefined();
    expect(data['grossprofit_budget']).toBeUndefined();
    expect(data['ebitda_budget']).toBeUndefined();
  });
});

describe('deriveStatementData — decimal correctness (K18)', () => {
  it('sums repeating cent amounts without float drift', () => {
    // 0.1 + 0.2 !== 0.3 in IEEE-754; the decimal path must be exact.
    const { data } = deriveStatementData([
      gl('4000', 0, 0.1),
      gl('4000', 0, 0.2),
      gl('5000', 0.3, 0),
    ]);

    expect(data['totalrevenue_actual']).toBe(0.3);
    expect(data['grossprofit_actual']).toBe(0);
  });

  it('keeps large ledgers of cent values exact', () => {
    const entries = Array.from({ length: 1000 }, () => gl('4000', 0, 0.01));
    const { data } = deriveStatementData(entries);

    expect(data['totalrevenue_actual']).toBe(10);
  });

  it('balances assets against liabilities plus equity exactly', () => {
    const { data } = deriveStatementData([
      gl('1000', 1234.56, 0),
      gl('2000', 0, 234.56),
      gl('3000', 0, 1000),
    ]);

    expect(data['totalassets_current']).toBe(1234.56);
    expect(data['totalliabilitiesequity_current']).toBe(1234.56);
  });

  it('treats missing debit/credit fields as zero rather than NaN', () => {
    const { data } = deriveStatementData([
      { accountCode: '4000', credit: 500 },
      { accountCode: '4000' },
    ]);

    expect(data['totalrevenue_actual']).toBe(500);
  });

  it('ignores entries with no account code', () => {
    const { data } = deriveStatementData([gl('4000', 0, 500), { debit: 999, credit: 0 }]);

    expect(data['totalrevenue_actual']).toBe(500);
    expect(data['totalassets_current']).toBe(0);
  });

  it('returns an empty-but-valid result for an empty ledger', () => {
    const { data, hasBudget } = deriveStatementData([]);

    expect(data['totalrevenue_actual']).toBe(0);
    expect(data['grossmargin_actual']).toBeUndefined();
    expect(hasBudget).toBe(false);
  });
});

describe('no fabricated-ratio regression guard', () => {
  it('keeps the derivation module free of hardcoded ratio literals', async () => {
    // The removed implementation fabricated statement lines with literals such
    // as `assets * 0.15` and a hardcoded 5.3% variance. This guard fails if any
    // such multiplier reappears in the derivation source.
    const fs = await import('node:fs/promises');
    const src = await fs.readFile('src/pages/reports/financialStatementData.ts', 'utf8');
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const ratioMultipliers = code.match(/\*\s*0?\.\d+|\.times\(\s*0?\.\d+/g) ?? [];
    expect(ratioMultipliers).toEqual([]);
  });
});
