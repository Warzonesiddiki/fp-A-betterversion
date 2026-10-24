import { describe, it, expect } from 'vitest';
import { AutoCommentaryEngine, type LineItem } from './AutoCommentaryEngine';

/**
 * GOVERNANCE EVIDENCE for cap:ai.verified-facts-gate
 *
 * The AutoCommentaryEngine generates management commentary from posted actuals
 * and budget. The narrative gate (gateNarrative) verifies that all numbers in
 * the generated narrative are supported by verified facts (line items).
 *
 * The governance dimension here is SAFETY — the AI narrative gate ensures that
 * no unverified financial numbers leak into management commentary. If the gate
 * fails, fabricated numbers could appear in reports presented to decision-makers.
 *
 * Tested dimensions:
 * 1. Narrative gating (generateSectionNarrative gates unsupported numbers)
 * 2. Money primitive safety (decimal arithmetic, no float drift)
 * 3. Zero-budget handling (no variance percentage when budget is zero)
 * 4. Variance direction (above/below, never favorable/unfavorable)
 * 5. Significance threshold (variances below threshold noted as "broadly in line")
 * 6. Template interpolation (currency formatting only for money keys)
 * 7. Determinism
 */

function makeLineItems(name: string, actual: number, budget: number, priorYear?: number): LineItem {
  return { name, actual, budget, priorYear };
}

describe('AutoCommentaryEngine — GOVERNANCE (ai.verified-facts-gate)', () => {
  describe('1. Narrative gating', () => {
    it('generateSectionNarrative gates computed numbers not in verified facts', () => {
      const items = [makeLineItems('Revenue', 120000, 100000), makeLineItems('COGS', 60000, 50000)];
      const narrative = AutoCommentaryEngine.generateSectionNarrative('Revenue', items, '2026-Q1');

      expect(narrative).toBeTruthy();
      // The gate blocks computed numbers (variance %, individual variances) that aren't in the facts
      expect(narrative).toContain('[GATED:');
    });

    it('generateSectionNarrative returns safe fallback for empty line items', () => {
      const narrative = AutoCommentaryEngine.generateSectionNarrative('Revenue', [], '2026-Q1');

      expect(narrative).toContain('No data available');
    });

    it('generateSectionNarrative includes total actual in narrative', () => {
      const items = [makeLineItems('Revenue', 120000, 100000)];
      const narrative = AutoCommentaryEngine.generateSectionNarrative('Revenue', items, '2026-Q1');

      expect(narrative).toContain('$120,000');
    });
  });

  describe('2. Money primitive safety', () => {
    it('generateVarianceCommentary uses decimal arithmetic for variance', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        100000.1,
        100000,
        'Revenue',
        '2026-Q1'
      );

      // fmtCurrency uses maxDecimals: 0 — rounds to nearest dollar
      expect(commentary).toContain('$100,000');
      expect(commentary).toBeTruthy();
    });

    it('generateVarianceCommentary handles large numbers without float drift', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        1000000000.5,
        1000000000,
        'Revenue',
        '2026-Q1'
      );

      // 1000000000.5 rounds to $1,000,000,001 (maxDecimals: 0)
      expect(commentary).toContain('$1,000,000,001');
    });
  });

  describe('3. Zero-budget handling', () => {
    it('generateVarianceCommentary omits variance percentage when budget is zero', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        100000,
        0,
        'Revenue',
        '2026-Q1'
      );

      expect(commentary).toContain('budget is zero');
      expect(commentary).not.toMatch(/variance.*%/i);
    });

    it('generateSectionNarrative omits variance percentage when budget is zero', () => {
      const items = [makeLineItems('Revenue', 100000, 0)];
      const narrative = AutoCommentaryEngine.generateSectionNarrative('Revenue', items, '2026-Q1');

      expect(narrative).toContain('budget is zero');
    });

    it('generateVarianceCommentary omits YoY percentage when prior year is zero', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        100000,
        90000,
        'Revenue',
        '2026-Q1',
        { priorYear: 0 }
      );

      expect(commentary).toContain('prior-year base is zero');
    });
  });

  describe('4. Variance direction', () => {
    it('generateVarianceCommentary uses "above budget" for positive variance', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        120000,
        100000,
        'Revenue',
        '2026-Q1'
      );

      expect(commentary).toContain('above budget');
    });

    it('generateVarianceCommentary uses "below budget" for negative variance', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        80000,
        100000,
        'Revenue',
        '2026-Q1'
      );

      expect(commentary).toContain('below budget');
    });

    it('generateVarianceCommentary never uses "favorable" or "unfavorable"', () => {
      const aboveBudget = AutoCommentaryEngine.generateVarianceCommentary(
        120000,
        100000,
        'Revenue',
        '2026-Q1'
      );
      const belowBudget = AutoCommentaryEngine.generateVarianceCommentary(
        80000,
        100000,
        'Revenue',
        '2026-Q1'
      );

      expect(aboveBudget).not.toMatch(/favorable|unfavorable/i);
      expect(belowBudget).not.toMatch(/favorable|unfavorable/i);
    });

    it('generateSectionNarrative never uses "favorable" or "unfavorable"', () => {
      const items = [makeLineItems('Revenue', 120000, 100000), makeLineItems('COGS', 60000, 50000)];
      const narrative = AutoCommentaryEngine.generateSectionNarrative('Revenue', items, '2026-Q1');

      expect(narrative).not.toMatch(/favorable|unfavorable/i);
    });
  });

  describe('5. Significance threshold', () => {
    it('generateVarianceCommentary notes "broadly in line" for small variances', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        101000,
        100000,
        'Revenue',
        '2026-Q1'
      );

      // 1% variance < 5% threshold
      expect(commentary).toContain('broadly in line');
    });

    it('generateVarianceCommentary notes significant variance for large variances', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        120000,
        100000,
        'Revenue',
        '2026-Q1'
      );

      // 20% variance > 5% threshold
      expect(commentary).toContain('above budget');
      expect(commentary).not.toContain('broadly in line');
    });
  });

  describe('6. Template interpolation', () => {
    it('interpolate formats money keys as currency', () => {
      const result = AutoCommentaryEngine.interpolate('Revenue: [amount]', { amount: 123456.78 });

      expect(result).toContain('$123,457'); // maxDecimals: 0 rounds to dollar
    });

    it('interpolate does NOT format non-money keys as currency', () => {
      const result = AutoCommentaryEngine.interpolate('Count: [count]', { count: 15 });

      expect(result).toContain('15');
      expect(result).not.toContain('$15');
    });

    it('interpolate handles non-finite values', () => {
      const result = AutoCommentaryEngine.interpolate('Value: [amount]', { amount: NaN });

      expect(result).toContain('—');
    });

    it('interpolate replaces all instances of a placeholder', () => {
      const result = AutoCommentaryEngine.interpolate('[x] and [x]', { x: 42 });

      expect(result).toBe('42 and 42');
    });

    it('interpolate handles string values', () => {
      const result = AutoCommentaryEngine.interpolate('Name: [name]', { name: 'Revenue' });

      expect(result).toContain('Revenue');
    });
  });

  describe('7. Determinism', () => {
    it('generateVarianceCommentary produces identical output for identical inputs', () => {
      const c1 = AutoCommentaryEngine.generateVarianceCommentary(
        120000,
        100000,
        'Revenue',
        '2026-Q1'
      );
      const c2 = AutoCommentaryEngine.generateVarianceCommentary(
        120000,
        100000,
        'Revenue',
        '2026-Q1'
      );

      expect(c1).toBe(c2);
    });

    it('generateSectionNarrative produces identical output for identical inputs', () => {
      const items = [
        makeLineItems('Revenue', 120000, 100000, 110000),
        makeLineItems('COGS', 60000, 50000, 55000),
      ];
      const n1 = AutoCommentaryEngine.generateSectionNarrative('Revenue', items, '2026-Q1');
      const n2 = AutoCommentaryEngine.generateSectionNarrative('Revenue', items, '2026-Q1');

      expect(n1).toBe(n2);
    });
  });

  describe('8. Year-over-year comparison', () => {
    it('generateVarianceCommentary includes YoY comparison when priorYear provided', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        120000,
        100000,
        'Revenue',
        '2026-Q1',
        { priorYear: 110000 }
      );

      expect(commentary).toContain('prior year');
      expect(commentary).toContain('increase');
    });

    it('generateSectionNarrative includes YoY comparison when all items have priorYear', () => {
      const items = [
        makeLineItems('Revenue', 120000, 100000, 110000),
        makeLineItems('COGS', 60000, 50000, 55000),
      ];
      const narrative = AutoCommentaryEngine.generateSectionNarrative('Revenue', items, '2026-Q1');

      // YoY text is present (even if gated — the gate blocks computed numbers)
      expect(narrative).toContain('Year-over-year');
    });

    it('generateSectionNarrative omits YoY when not all items have priorYear', () => {
      const items = [
        makeLineItems('Revenue', 120000, 100000, 110000),
        makeLineItems('COGS', 60000, 50000),
      ];
      const narrative = AutoCommentaryEngine.generateSectionNarrative('Revenue', items, '2026-Q1');

      expect(narrative).not.toContain('Year-over-year');
    });
  });
});
