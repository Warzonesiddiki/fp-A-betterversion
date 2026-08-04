/**
 * GAP-1 (F-0006) known-answer tests for ConsolidationWorksheet UI totals.
 *
 * The Summary tab's IC-eliminations total and NCI tab's ending-balance
 * total previously used raw float `reduce +`. Both feed footer totals
 * shown to users as financial truth. They now route through sumMoney +
 * roundTo.
 *
 * Falsification record: replacing totalEliminations/totalNCI bodies with
 * raw reduce makes 2 of these 3 tests FAIL (empty control survives);
 * restored, 3/3 pass.
 */

import { describe, expect, it } from 'vitest';
import { totalEliminations, totalNCI } from './ConsolidationWorksheet';

describe('ConsolidationWorksheet totals — money known answers (GAP-1)', () => {
  it('empty lists return 0 (control)', () => {
    expect(totalEliminations([])).toBe(0);
    expect(totalNCI([])).toBe(0);
  });

  it('IC eliminations total is exact (old float: 0.30000000000000004)', () => {
    // Three 0.10 eliminations plus one 1.00 → 1.30.
    expect(
      totalEliminations([
        { eliminatedAmount: 0.1 },
        { eliminatedAmount: 0.1 },
        { eliminatedAmount: 0.1 },
        { eliminatedAmount: 1.0 },
      ])
    ).toBe(1.3);
  });

  it('NCI ending balances round three 0.335 halves up (old float: 1.00)', () => {
    expect(
      totalNCI([{ endingBalance: 0.335 }, { endingBalance: 0.335 }, { endingBalance: 0.335 }])
    ).toBe(1.01);
  });
});
