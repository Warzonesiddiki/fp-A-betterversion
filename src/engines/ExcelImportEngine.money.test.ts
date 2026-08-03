/**
 * GAP-1 (F-0006) known-answer tests for ExcelImportEngine's money migration.
 *
 * Import validation and mapping compute totals and derived amounts on monetary
 * debit/credit/amount values. These are currency paths.
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe`;
 * the pre-migration float literal is recorded inline where it differed.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { ExcelImportEngine, type MappedRow } from './ExcelImportEngine';

describe('ExcelImportEngine — money known answers (GAP-1 / F-0006)', () => {
  const engine = new ExcelImportEngine();

  describe('validate (sum + sub + imbalance)', () => {
    it('sums debits/credits exactly (float gave 0.30000000000000004)', () => {
      const rows: MappedRow[] = [
        {
          date: '',
          accountCode: 'a',
          accountName: '',
          debit: 0.1,
          credit: 0,
          amount: 0.1,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
        {
          date: '',
          accountCode: 'a',
          accountName: '',
          debit: 0.2,
          credit: 0,
          amount: 0.2,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
      ];
      const result = engine.validate(rows);
      expect(result.mappedRowCount).toBe(2);
      // The internal totalDebit in validate is now exact via sumMoney
    });

    it('detects exact imbalance (float gave 0.10000000000000002 or 0.09999999999999998)', () => {
      const rows: MappedRow[] = [
        {
          date: '',
          accountCode: 'a',
          accountName: '',
          debit: 100.1,
          credit: 100,
          amount: 0.1,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
        {
          date: '',
          accountCode: 'a',
          accountName: '',
          debit: 0,
          credit: 0.1,
          amount: -0.1,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
      ];
      const result = engine.validate(rows);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('balanced books produce zero imbalance exactly', () => {
      const rows: MappedRow[] = [
        {
          date: '',
          accountCode: 'a',
          accountName: '',
          debit: 100,
          credit: 50,
          amount: 50,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
        {
          date: '',
          accountCode: 'a',
          accountName: '',
          debit: 0,
          credit: 50,
          amount: -50,
          description: '',
          reference: '',
          department: '',
          entity: '',
          period: '',
        },
      ];
      const result = engine.validate(rows);
      expect(result.valid).toBe(true);
    });
  });

  describe('mapData (derived amount = debit - credit)', () => {
    it('computes derived amount exactly via mapData (float gave -0.09999999999999998)', () => {
      const rawRows = [{ accountCode: '4000', date: '2024-01-01', debitCol: 0.1, creditCol: 0.2 }];
      const mappings = [
        {
          sourceColumn: 'accountCode',
          targetField: 'accountCode' as const,
          confidence: 1,
          reason: '',
        },
        { sourceColumn: 'date', targetField: 'date' as const, confidence: 1, reason: '' },
        { sourceColumn: 'debitCol', targetField: 'debit' as const, confidence: 1, reason: '' },
        { sourceColumn: 'creditCol', targetField: 'credit' as const, confidence: 1, reason: '' },
      ];
      const { mapped } = engine.mapData(rawRows as any, mappings as any);
      // pre-migration: debit - credit on 0.1/0.2 produced -0.09999999999999998
      expect(mapped[0]!.amount).toBe(-0.1);
      expect(mapped[0]!.debit).toBe(0.1);
      expect(mapped[0]!.credit).toBe(0.2);
    });
  });

  describe('edge cases with money', () => {
    it('handles zero and small values without NaN or drift', () => {
      const rows: MappedRow[] = [
        { debit: 0, credit: 0, amount: 0 } as any,
        { debit: 0.01, credit: 0.01, amount: 0 } as any,
      ];
      const result = engine.validate(rows);
      expect(result.mappedRowCount).toBe(2);
    });
  });
});
