/**
 * SensitivityEngine.ext.test.ts — tornado/spider/data-table/elasticity known
 * answers (MISSION D wave 2, 2026-08-07).
 */
import { describe, expect, it } from 'vitest';
import { SensitivityEngine, type SensitivityVariable } from './SensitivityEngine';

const revenue = (v: Record<string, number>): number => v.price * v.quantity;

const vars: SensitivityVariable[] = [
  { name: 'price', baseValue: 10, lowValue: 8, highValue: 12 },
  { name: 'quantity', baseValue: 100, lowValue: 80, highValue: 120 },
];

const base = { price: 10, quantity: 100 };

describe('SensitivityEngine — tornado', () => {
  it('ranks variables by swing descending', () => {
    const wide: SensitivityVariable[] = [
      { name: 'price', baseValue: 10, lowValue: 8, highValue: 12 },
      { name: 'quantity', baseValue: 100, lowValue: 50, highValue: 150 },
    ];
    const items = SensitivityEngine.tornado(wide, revenue, base);
    expect(items).toHaveLength(2);
    expect(items[0]!.name).toBe('quantity'); // swing 1000 > price swing 400
    expect(items[0]!.rank).toBe(1);
    expect(items[1]!.rank).toBe(2);
    // price: 8*100=800 .. 12*100=1200 → swing 400; quantity: 10*50..10*150 → 1000
    expect(items[0]!.swing).toBe(1000);
    expect(items[0]!.lowOutput).toBe(500);
    expect(items[0]!.highOutput).toBe(1500);
    expect(items[1]!.swing).toBe(400);
    expect(items[1]!.baseValue).toBe(10);
  });
});

describe('SensitivityEngine — spider', () => {
  it('produces steps points per variable with % variation', () => {
    const spider = SensitivityEngine.spider(vars, revenue, base, 5);
    expect(spider.size).toBe(2);
    const price = spider.get('price')!;
    expect(price).toHaveLength(5);
    // variations: -20%, -10%, 0%, +10%, +20%
    expect(price.map((p) => p.variation)).toEqual([-20, -10, 0, 10, 20]);
    expect(price[0]!.output).toBe(800);
    expect(price[4]!.output).toBe(1200);
    // quantity variations at base price: same percentages
    const qty = spider.get('quantity')!;
    expect(qty[0]!.output).toBe(800);
    expect(qty[2]!.output).toBe(1000);
  });
});

describe('SensitivityEngine — data table', () => {
  it('varies two variables simultaneously over a grid', () => {
    const table = SensitivityEngine.dataTable(
      'price',
      [8, 10, 12],
      'quantity',
      [50, 100],
      revenue,
      base
    );
    expect(table.outputs).toEqual([
      [400, 800],
      [500, 1000],
      [600, 1200],
    ]);
    expect(table.rowValues).toEqual([8, 10, 12]);
    expect(table.columnValues).toEqual([50, 100]);
  });
});

describe('SensitivityEngine — elasticity', () => {
  const linear = (v: Record<string, number>): number => v.x * 2;

  it('unit elasticity for a proportional model', () => {
    const out = SensitivityEngine.elasticity(
      [{ name: 'x', baseValue: 10, lowValue: 5, highValue: 15 }],
      linear,
      { x: 10 }
    );
    expect(out[0]!.elasticity).toBeCloseTo(1, 6);
    expect(out[0]!.interpretation).toBe('Moderately sensitive');
  });

  it('classifies sensitivity bands', () => {
    const out = SensitivityEngine.elasticity(
      [
        { name: 'q', baseValue: 10, lowValue: 5, highValue: 15 },
        { name: 'y', baseValue: 10, lowValue: 5, highValue: 15 },
      ],
      (v) => v.q * v.q + v.y * 0.1,
      { q: 10, y: 10 }
    );
    const byName = Object.fromEntries(out.map((o) => [o.name, o]));
    // quadratic: 1% in q → ~2% in output → highly sensitive
    expect(byName.q!.elasticity).toBeCloseTo(2, 1);
    expect(byName.q!.interpretation).toBe('Highly sensitive');
    // damped linear term: 1% in y → <1% in output → low
    expect(byName.y!.elasticity).toBeCloseTo(0.1 / 10.1, 3);
    expect(byName.y!.interpretation).toBe('Low sensitivity');
  });
});
