import { describe, it, expect } from 'vitest';
import { ConsolidationAdjustmentsEngine } from './ConsolidationAdjustmentsEngine';

describe('ConsolidationAdjustmentsEngine (money migration)', () => {
  it('eliminateIntercompany and goodwill return exact cents', () => {
    ConsolidationAdjustmentsEngine.reset();
    const elim = ConsolidationAdjustmentsEngine.eliminateIntercompany('1400', '2400', 125000.75, 'E1', '2026-06');
    expect(elim.amount).toBe(125000.75);

    const gw = ConsolidationAdjustmentsEngine.recordGoodwill(5000000, 4200000, 'E2', '2026-06');
    expect(gw.amount).toBe(800000.00);
  });

  it('calculateNCI returns exact cents', () => {
    const nci = ConsolidationAdjustmentsEngine.calculateNCI(2000000, 0.25, 'E3', '2026-06');
    expect(nci.amount).toBe(500000.00);
  });
});