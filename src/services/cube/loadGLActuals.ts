import { toDecimal, roundTo } from '@/utils/money';
import type { CubeCell } from '@/types/cube-types';

/**
 * Phase 14 — GL → cube loader (the designer's missing wire).
 *
 * The report designer's cube initialized EMPTY: cubes were
 * registered but no code anywhere loaded the ledger into them, so
 * the designer could only ever show hand-typed planning cells. This
 * builder turns posted GL entries into GL_Actuals cube cells —
 * summed with exact money arithmetic by (Account, Entity, Time,
 * Currency) under Scenario 'Actual', measures debit / credit /
 * netChange — ready for `bulkWriteCells`. The tie-out test proves a
 * cube query over these cells reproduces the direct GL sums to the
 * cent, which is what "designer verification" (Phase 9 remainder)
 * means: same ledger, same numbers, two paths.
 */

export interface GLActualsEntry {
  accountCode?: string;
  entity?: string;
  entityId?: string;
  period?: string;
  date?: string;
  currency?: string;
  debit?: number;
  credit?: number;
}

export interface GLActualsCell {
  cube: 'GL_Actuals';
  cell: CubeCell;
}

const MEASURES = ['debit', 'credit', 'netChange'] as const;

export function buildGLActualsCells(entries: readonly GLActualsEntry[]): GLActualsCell[] {
  type Key = string;
  const sums = new Map<Key, { coords: Record<string, string>; debit: number; credit: number }>();

  for (const e of entries) {
    const account = (e.accountCode ?? '').trim();
    if (!account) continue;
    const time = (e.period || (e.date ?? '').slice(0, 7) || '').trim();
    if (!time) continue;
    const coords: Record<string, string> = {
      Account: account,
      Entity: (e.entity ?? e.entityId ?? '').trim() || 'Unassigned',
      Time: time,
      Scenario: 'Actual',
      Currency: (e.currency ?? '').trim() || 'Reporting',
    };
    const key = [coords.Account, coords.Entity, coords.Time, coords.Currency].join('|');
    const bucket = sums.get(key) ?? { coords, debit: 0, credit: 0 };
    bucket.debit = roundTo(toDecimal(bucket.debit).plus(toDecimal(e.debit ?? 0)), 2);
    bucket.credit = roundTo(toDecimal(bucket.credit).plus(toDecimal(e.credit ?? 0)), 2);
    sums.set(key, bucket);
  }

  const cells: GLActualsCell[] = [];
  for (const { coords, debit, credit } of sums.values()) {
    const values: Record<(typeof MEASURES)[number], number> = {
      debit,
      credit,
      netChange: roundTo(toDecimal(debit).minus(toDecimal(credit)), 2),
    };
    for (const measure of MEASURES) {
      const value = values[measure];
      if (value === 0) continue;
      cells.push({
        cube: 'GL_Actuals',
        cell: { coords, measure, value, dataType: 'imported' },
      });
    }
  }
  return cells.sort((a, b) =>
    JSON.stringify(a.cell.coords).localeCompare(JSON.stringify(b.cell.coords))
  );
}
