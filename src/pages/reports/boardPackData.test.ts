import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeBoardPackReport } from '@/pages/reports/boardPackData';
import type { GLEntry } from '@/types';

function makeEntry(code: string, debit: number, credit: number): GLEntry {
  return {
    id: `e-${code}-${debit}-${credit}`,
    accountCode: code,
    accountName: `Account ${code}`,
    debit,
    credit,
    netChange: debit - credit,
  } as GLEntry;
}

describe('boardPackData source guards', () => {
  const src = readFileSync('src/pages/reports/boardPackData.ts', 'utf8');
  const page = readFileSync('src/pages/reports/BoardPackPage.tsx', 'utf8');

  it('does not seed Travel / Software / Supplies currency literals', () => {
    expect(page).not.toMatch(/\(\$12,400\)/);
    expect(page).not.toMatch(/\(\$8,200\)/);
    expect(page).not.toMatch(/\$3,500/);
    expect(src).not.toMatch(/\(\$12,400\)/);
  });

  it('does not seed the $4.5M commentary', () => {
    expect(page).not.toMatch(/\$4\.5M/);
    expect(page).not.toMatch(/22% YoY/);
  });

  it('does not Math.abs a GL movement', () => {
    expect(src).not.toMatch(/Math\.abs/);
  });
});

describe('boardPackData known answers', () => {
  it('gross margin uses COGS only, not all expenses', () => {
    const report = computeBoardPackReport(
      [makeEntry('4000', 0, 2000), makeEntry('5000', 500, 0), makeEntry('6000', 300, 0)],
      []
    );
    expect(report?.grossMargin).toBe(75);
    expect(report?.expenses).toBe(800);
    expect(report?.netIncome).toBe(1200);
  });
});
