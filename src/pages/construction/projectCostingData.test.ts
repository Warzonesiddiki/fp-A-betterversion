import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveProjectCosting, type ProjectCostingGLEntry } from './projectCostingData';

/**
 * Regression suite for project-costing derivation.
 *
 * The page this module replaced invented $58.2M total costs, 92.4% budget
 * utilisation, $1.24M pending change orders, a CPI of 0.98, Downtown Plaza /
 * Skyway Bridge / Tech Hub change orders, and a CSI ledger with $1.2M / +8.4%
 * rows. None of those figures came from a ledger. Every test below pins one
 * of those closed.
 */

const gl = (
  accountCode: string,
  debit: number,
  credit: number,
  extra: Partial<ProjectCostingGLEntry> = {}
): ProjectCostingGLEntry => ({
  accountCode,
  debit,
  credit,
  ...extra,
});

function postedJob(): ProjectCostingGLEntry[] {
  return [
    gl('4000', 0, 1000, { accountName: 'Contract revenue' }),
    gl('5100', 400, 0, { accountName: 'Direct labor', entityId: 'JOB-01' }),
    gl('5200', 250, 0, { accountName: 'Materials', entityId: 'JOB-01' }),
    gl('1300', 300, 0, { accountName: 'WIP' }),
    gl('4600', 0, 280, { accountName: 'Progress billings' }),
  ];
}

describe('deriveProjectCosting — posted figures from the GL', () => {
  it('sums credit-normal revenue and debit-normal costs (the old page ignored the GL)', () => {
    const d = deriveProjectCosting(postedJob());
    expect(d.revenue).toBe(1000);
    expect(d.constructionCosts).toBe(650);
    expect(d.grossMarginPct).toBe(35);
    expect(d.wip).toBe(300);
    expect(d.billings).toBe(280);
    expect(d.overUnderBilled).toBe(-20);
  });

  it('omits WIP / billings / over-under rather than reporting zero when those prefixes are absent', () => {
    const d = deriveProjectCosting([gl('4000', 0, 1000), gl('5100', 400, 0)]);
    expect(d.wip).toBeNull();
    expect(d.billings).toBeNull();
    expect(d.overUnderBilled).toBeNull();
    expect(d.unavailable.some((u) => u.label === 'WIP')).toBe(true);
    expect(d.unavailable.some((u) => u.label === 'Progress billings')).toBe(true);
  });

  it('omits margin rather than reporting zero when there is no revenue', () => {
    const d = deriveProjectCosting([gl('5100', 400, 0)]);
    expect(d.revenue).toBe(0);
    expect(d.grossMarginPct).toBeNull();
  });

  it('groups posted costs by account code and does not invent a budget or variance', () => {
    const d = deriveProjectCosting(postedJob());
    expect(d.costAccounts).toEqual([
      { id: '5100', code: '5100', category: 'Direct labor', actual: 400 },
      { id: '5200', code: '5200', category: 'Materials', actual: 250 },
    ]);
    expect(d.costAccounts.every((r) => !('budget' in r) && !('variance' in r))).toBe(true);
  });

  it('groups tagged costs by entity and does not invent job names', () => {
    const d = deriveProjectCosting(postedJob());
    expect(d.costByProject).toEqual([{ id: 'JOB-01', name: 'JOB-01', actual: 650 }]);
    expect(d.costByProject.some((r) => /Downtown|Skyway|Tech Hub/i.test(r.name))).toBe(false);
  });

  it('omits the project split when no entity or department is tagged', () => {
    const d = deriveProjectCosting([gl('5100', 400, 0)]);
    expect(d.costByProject).toEqual([]);
    expect(d.unavailable.some((u) => u.label === 'Project split')).toBe(true);
  });
});

describe('contra and reversing entries', () => {
  it('nets a credit memo against cost instead of adding to it', () => {
    const d = deriveProjectCosting([
      gl('5100', 400, 0, { accountName: 'Labor' }),
      gl('5100', 0, 50, { accountName: 'Labor' }),
    ]);
    // Math.abs per entry would give 450.
    expect(d.constructionCosts).toBe(350);
    expect(d.costAccounts[0]?.actual).toBe(350);
  });

  it('nets a sales return against revenue', () => {
    const d = deriveProjectCosting([gl('4000', 0, 1000), gl('4000', 150, 0)]);
    expect(d.revenue).toBe(850);
  });
});

describe('decimal exactness (K18)', () => {
  it('sums repeating cents without float drift', () => {
    const d = deriveProjectCosting([gl('5100', 0.1, 0), gl('5100', 0.2, 0), gl('4000', 0, 0.3)]);
    expect(d.constructionCosts).toBe(0.3);
    expect(d.revenue).toBe(0.3);
    expect(d.grossMarginPct).toBe(0);
  });
});

describe('empty ledger', () => {
  it('returns zeroed totals and the full disclosure list', () => {
    const d = deriveProjectCosting([]);
    expect(d.revenue).toBe(0);
    expect(d.constructionCosts).toBe(0);
    expect(d.costAccounts).toEqual([]);
    expect(d.unavailable.some((u) => u.label === 'Change orders')).toBe(true);
    expect(d.unavailable.some((u) => u.label === 'CSI cost-code budget')).toBe(true);
    expect(d.unavailable.some((u) => u.label === 'Cost performance index')).toBe(true);
  });
});

/** Strip comments so prose describing a defect never satisfies a guard against it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards against reintroduced defects', () => {
  const source = codeOnly(readFileSync('src/pages/construction/projectCostingData.ts', 'utf-8'));
  const page = codeOnly(readFileSync('src/pages/construction/ProjectCostingPage.tsx', 'utf-8'));
  const store = codeOnly(readFileSync('src/store/constructionStore.ts', 'utf-8'));

  it('contains no Math.abs (it discards contra entries)', () => {
    expect(source).not.toMatch(/Math\.abs/);
    expect(page).not.toMatch(/Math\.abs/);
  });

  it('does not invent named projects or CSI quotes', () => {
    expect(source).not.toMatch(/Downtown Plaza|Skyway Bridge|Tech Hub/);
    expect(page).not.toMatch(/Downtown Plaza|Skyway Bridge|Tech Hub/);
    expect(store).not.toMatch(/Downtown Plaza|Skyway Bridge|Tech Hub/);
    expect(page).not.toMatch(/03-3000|05-1000|CO-402/);
    expect(store).not.toMatch(/CO-402|03-3000/);
  });

  it('does not hardcode the retired KPI literals', () => {
    expect(page).not.toMatch(/\$58\.2M|\$1\.24M|92\.4%/);
    expect(source).not.toMatch(/\$58\.2M|\$1\.24M|92\.4%/);
  });

  it('does not call ConstructionEngine.calculateStats (1.5× backlog invention)', () => {
    expect(page).not.toMatch(/calculateStats/);
    expect(source).not.toMatch(/calculateStats/);
    expect(source).not.toMatch(/1\.5/);
  });

  it('the page consumes the derivation instead of recomputing it', () => {
    expect(readFileSync('src/pages/construction/ProjectCostingPage.tsx', 'utf-8')).toMatch(
      /deriveProjectCosting/
    );
  });
});
