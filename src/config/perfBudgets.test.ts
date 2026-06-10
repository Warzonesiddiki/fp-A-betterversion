import { describe, it, expect } from 'vitest';
import { PAGE_RENDER_BUDGETS, INFRA_BUDGETS, FMP_TARGET_MS } from '@/config/perfBudgets';

describe('perfBudgets', () => {
  it('all pages budgeted at 100ms FMP', () => {
    for (const [page, budget] of Object.entries(PAGE_RENDER_BUDGETS)) {
      expect(budget, page).toBe(FMP_TARGET_MS);
    }
  });

  it('covers the 46 page-render tasks', () => {
    expect(Object.keys(PAGE_RENDER_BUDGETS).length).toBe(46);
  });

  it('image optimization budget enforced', () => {
    expect(INFRA_BUDGETS.imageOptimization.maxHeroKb).toBeLessThanOrEqual(200);
    expect(INFRA_BUDGETS.imageOptimization.formats).toContain('webp');
  });

  it('font subsetting budget enforced', () => {
    expect(INFRA_BUDGETS.fontSubsetting.maxSubsetRatio).toBeLessThanOrEqual(0.5);
  });

  it('critical CSS inlining budget enforced', () => {
    expect(INFRA_BUDGETS.criticalCssInlining.maxKb).toBeLessThanOrEqual(14);
    expect(INFRA_BUDGETS.criticalCssInlining.aboveFoldOnly).toBe(true);
  });

  it('resource hints (preconnect) budget enforced', () => {
    expect(INFRA_BUDGETS.resourceHints.maxPreconnect).toBeLessThanOrEqual(4);
  });
});
