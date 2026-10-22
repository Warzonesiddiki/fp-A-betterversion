/**
 * AggregationDesigner × `Money` (DEC-055 trap, third engine copy).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `materialize()` receives `Map<string, unknown>` — deliberately untyped cell
 * values, because a cube cell can hold anything. The reader was
 *
 *     const numValue = typeof value === 'number' ? value : 0;
 *
 * so a `Money` cell — an OBJECT — fell through to `0` and the materialised
 * aggregate reported nothing. Silent, typed, green: the exact failure DEC-055
 * names, found here after the same line was fixed in `CubeEngine.aggregate`
 * and again in `CubeEngine.aggregateCells`.
 *
 * Existing tests in `AggregationDesigner.test.ts` assert `materialized` and
 * `cellCount`, both of which are TRUE for a materialised block of zeros. These
 * assert the aggregated VALUES, and twin them against the same cells supplied
 * as numbers.
 */
import { describe, expect, it } from 'vitest';
import { AggregationDesigner } from './AggregationDesigner';
import { asMoney } from '@/utils/money';

const CELL_KEY = 'cube=finance|Region=East|measure=Revenue';

function sumOf(cells: Map<string, unknown>): number {
  const designer = new AggregationDesigner();
  const def = designer.define('Revenue by Region', 'finance', ['Region'], ['Revenue'], 'sum');
  expect(designer.materialize(def.id, cells)).not.toBeNull();
  const result = designer.query(def.id);
  expect(result).not.toBeNull();
  expect(result!.cells).toHaveLength(1);
  return result!.cells[0]!.value;
}

describe('AggregationDesigner.materialize — a Money cell is read, never zeroed', () => {
  it('sums Money cells to their exact value (regression: every cell read as 0)', () => {
    const cells = new Map<string, unknown>([[CELL_KEY, asMoney(1234.56)]]);

    expect(sumOf(cells)).toBe(1234.56);
  });

  it('gives the same answer for numbers and for Money (twin)', () => {
    const asNumber = new Map<string, unknown>([[CELL_KEY, 1234.56]]);
    const asMoneyCell = new Map<string, unknown>([[CELL_KEY, asMoney(1234.56)]]);

    expect(sumOf(asMoneyCell)).toBe(sumOf(asNumber));
  });

  it('still treats a non-numeric value as 0 rather than inventing an amount', () => {
    expect(sumOf(new Map<string, unknown>([[CELL_KEY, 'not money']]))).toBe(0);
  });

  it('counts Money cells even when their value cannot be read as a number', () => {
    const designer = new AggregationDesigner();
    const def = designer.define('Revenue by Region', 'finance', ['Region'], ['Revenue'], 'count');
    designer.materialize(def.id, new Map<string, unknown>([[CELL_KEY, asMoney(10)]]));

    expect(designer.query(def.id)!.cells[0]!.value).toBe(1);
  });
});
