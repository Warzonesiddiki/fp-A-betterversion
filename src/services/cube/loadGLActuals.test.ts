import { describe, it, expect } from 'vitest';
import { CubeEngine } from '@/engines/CubeEngine';
import { buildGLActualsCells, type GLActualsEntry } from './loadGLActuals';

/**
 * Phase 14 designer verification (Phase 9 remainder): the cube the
 * report designer renders must reproduce the ledger. Load GL entries
 * as cube cells exactly as the store initializes GL_Actuals, query
 * by Account, and tie every figure to the direct GL sum.
 */

const ENTRIES: GLActualsEntry[] = [
  { accountCode: '4010', period: '2026-01', debit: 0, credit: 1000 },
  { accountCode: '4010', period: '2026-01', debit: 0, credit: 250.5 },
  { accountCode: '4010', period: '2026-02', debit: 0, credit: 500 },
  { accountCode: '5010', period: '2026-01', debit: 300, credit: 0 },
  { accountCode: '5010', period: '2026-01', debit: 25.25, credit: 0 },
  { accountCode: '1000', period: '2026-01', debit: 925.25, credit: 0 },
];

describe('buildGLActualsCells', () => {
  it('aggregates by account/entity/time with exact money sums', () => {
    const cells = buildGLActualsCells(ENTRIES);
    const jan4010Credit = cells.find(
      (c) =>
        c.cell.coords.Account === '4010' &&
        c.cell.coords.Time === '2026-01' &&
        c.cell.measure === 'credit'
    );
    expect(jan4010Credit?.cell.value).toBe(1250.5);
    const jan5010Net = cells.find(
      (c) =>
        c.cell.coords.Account === '5010' &&
        c.cell.coords.Time === '2026-01' &&
        c.cell.measure === 'netChange'
    );
    expect(jan5010Net?.cell.value).toBe(325.25);
  });
});

describe('cube tie-out against the direct GL sums', () => {
  it('query by Account reproduces per-account debit/credit totals to the cent', async () => {
    const engine = new CubeEngine();
    engine.registerSystemDimensions();
    engine.registerCube(
      'GL_Actuals',
      ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
      [
        { name: 'debit', dataType: 'numeric', aggregation: 'sum' },
        { name: 'credit', dataType: 'numeric', aggregation: 'sum' },
        { name: 'netChange', dataType: 'numeric', aggregation: 'sum' },
      ]
    );
    for (const { cube, cell } of buildGLActualsCells(ENTRIES)) {
      await engine.writeCell(cube, cell);
    }

    const queryMeasure = (measure: string) =>
      new Map(
        engine
          .query({
            cube: 'GL_Actuals',
            rows: ['Account'],
            columns: [],
            filters: [],
            measures: [measure],
            aggregation: 'sum',
          })
          .rows.map((r) => [r.label, r.values[0]])
      );

    // Direct GL sums: 4010 Cr 1,750.50; 5010 Dr 325.25; 1000 Dr 925.25.
    const debits = queryMeasure('debit');
    const credits = queryMeasure('credit');
    expect(debits.get('4010') ?? 0).toBe(0);
    expect(credits.get('4010')).toBe(1750.5);
    expect(debits.get('5010')).toBe(325.25);
    expect(credits.get('5010') ?? 0).toBe(0);
    expect(debits.get('1000')).toBe(925.25);
  });
});
