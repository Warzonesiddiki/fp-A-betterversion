/**
 * CubeEngine × `Money` (DEC-055 trap, second and third occurrence).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * A cube cell is typed `number | string | Date | boolean`, but a `Money` reaches
 * it at runtime whenever a ledger amount is written through. `Money` is an
 * OBJECT, so the natural reader —
 *
 *     typeof cell.value === 'number' ? cell.value : 0
 *
 * — returns the FALLBACK for a `Money`. That is a silent zero: no throw, no type
 * error, a green build and an empty report.
 *
 * The same trap was found twice in this engine: in `aggregate()` and in
 * `aggregateCells()`, which backs `query()`. Fixing one left the other reading
 * every money cell as 0, so both paths are pinned here, at the same values.
 *
 * Twin discipline: the SAME cells are written once as numbers and once as
 * `Money`, and both must produce the SAME aggregates. A test that only used
 * `Money` input would pass on a build that zeroed the number path; a test that
 * only used numbers would pass on the bug this file exists for.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { CubeEngine } from './CubeEngine';
import { asMoney, type Money } from '@/utils/money';
import type { CellDataType } from '@/types/cube-types';

const MEASURE = 'amount';
const DATA_TYPE: CellDataType = 'input';

/** A cube with one dimension and two members, ready for two cells. */
function makeEngine(): CubeEngine {
  const engine = new CubeEngine();
  engine.registerDimension('Account', 'system');
  engine.registerCube(
    'Financials',
    ['Account'],
    [{ name: MEASURE, dataType: 'numeric', aggregation: 'sum' }]
  );
  for (const code of ['4000', '5000']) {
    engine.addMember('Account', {
      code,
      name: `Account ${code}`,
      hierarchy: 'default',
      level: 0,
      isLeaf: true,
      isActive: true,
      attributes: {},
      sortOrder: 1,
    });
  }
  return engine;
}

async function write(engine: CubeEngine, code: string, value: number | Money): Promise<void> {
  await engine.writeCell('Financials', {
    coords: { Account: `Account:${code}` },
    measure: MEASURE,
    // `CubeCell.value` does not admit `Money`; that is precisely why the trap
    // is invisible to the compiler and has to be pinned by a test.
    value: value as never,
    dataType: DATA_TYPE,
  });
}

/** Populate 4000 = 1,000.00 and 5000 = 2,500.50, in the requested shape. */
async function populate(engine: CubeEngine, shape: 'number' | 'money'): Promise<void> {
  const as = (amount: number) => (shape === 'money' ? asMoney(amount) : amount);
  await write(engine, '4000', as(1000));
  await write(engine, '5000', as(2500.5));
}

describe('CubeEngine — a Money cell is read, never zeroed', () => {
  let engine: CubeEngine;

  beforeEach(() => {
    engine = makeEngine();
  });

  describe('query() — aggregateCells', () => {
    it('sums Money cells to their exact value (regression: read as 0)', async () => {
      await populate(engine, 'money');

      const result = engine.query({
        cube: 'Financials',
        rows: ['Account'],
        columns: [],
        filters: [],
        measures: [MEASURE],
        includeGrandTotal: true,
      });

      // Two rows, each carrying its own amount — not 0.
      expect(result.rows).toHaveLength(2);
      expect(result.rows.map((row) => row.values[0])).toEqual([1000, 2500.5]);
      expect(result.grandTotal?.[0]).toBe(3500.5);
    });

    it('gives the same answer for numbers and for Money (twin)', async () => {
      const numeric = makeEngine();
      await populate(numeric, 'number');
      const fromNumbers = numeric.query({
        cube: 'Financials',
        rows: ['Account'],
        columns: [],
        filters: [],
        measures: [MEASURE],
        includeGrandTotal: true,
      });

      await populate(engine, 'money');
      const fromMoney = engine.query({
        cube: 'Financials',
        rows: ['Account'],
        columns: [],
        filters: [],
        measures: [MEASURE],
        includeGrandTotal: true,
      });

      expect(fromMoney.rows).toEqual(fromNumbers.rows);
      expect(fromMoney.grandTotal).toEqual(fromNumbers.grandTotal);
    });

    it('leaves a non-numeric value at 0 rather than inventing an amount', async () => {
      await write(engine, '4000', 1000);
      await engine.writeCell('Financials', {
        coords: { Account: 'Account:5000' },
        measure: MEASURE,
        value: 'not money',
        dataType: DATA_TYPE,
      });

      const result = engine.query({
        cube: 'Financials',
        rows: ['Account'],
        columns: [],
        filters: [],
        measures: [MEASURE],
      });

      expect(result.rows.map((row) => row.values[0])).toEqual([1000, 0]);
    });
  });

  describe('aggregate() — the single-coordinate path', () => {
    it('sums Money cells exactly', async () => {
      await populate(engine, 'money');

      expect(engine.aggregate('Financials', { Account: 'Account:4000' }, MEASURE)).toBe(1000);
      expect(engine.aggregate('Financials', { Account: 'Account:5000' }, MEASURE)).toBe(2500.5);
    });

    it('gives the same answer for numbers and for Money (twin)', async () => {
      const numeric = makeEngine();
      await populate(numeric, 'number');
      await populate(engine, 'money');

      for (const code of ['4000', '5000']) {
        const coords = { Account: `Account:${code}` };
        expect(engine.aggregate('Financials', coords, MEASURE)).toBe(
          numeric.aggregate('Financials', coords, MEASURE)
        );
      }
    });
  });
});
