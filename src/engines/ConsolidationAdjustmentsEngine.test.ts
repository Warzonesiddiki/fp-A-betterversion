/**
 * Tests for ConsolidationAdjustmentsEngine
 * Covers: eliminateIntercompany, recordGoodwill, calculateNCI,
 *         addAdjustment, getConsolidationSummary, getEntries, reverseEntry, reset
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ConsolidationAdjustmentsEngine } from './ConsolidationAdjustmentsEngine';

describe('ConsolidationAdjustmentsEngine', () => {
  beforeEach(() => {
    ConsolidationAdjustmentsEngine.reset();
  });

  describe('eliminateIntercompany', () => {
    it('should create an elimination entry', () => {
      const entry = ConsolidationAdjustmentsEngine.eliminateIntercompany(
        'Intercompany Revenue',
        'Intercompany Expense',
        100000,
        'Sub',
        '2024-Q1'
      );
      expect(entry.type).toBe('elimination');
      expect(entry.amount).toBe(100000);
      expect(entry.debitAccount).toBe('Intercompany Revenue');
      expect(entry.creditAccount).toBe('Intercompany Expense');
      expect(entry.entityId).toBe('Sub');
      expect(entry.period).toBe('2024-Q1');
      expect(entry.status).toBe('pending');
      expect(entry.id).toBeDefined();
    });
  });

  describe('recordGoodwill', () => {
    it('should record goodwill on acquisition', () => {
      const entry = ConsolidationAdjustmentsEngine.recordGoodwill(
        500000,
        300000,
        'SubA',
        '2024-Q1'
      );
      expect(entry.type).toBe('goodwill');
      expect(entry.amount).toBe(200000);
      expect(entry.debitAccount).toBe('Goodwill');
      expect(entry.creditAccount).toBe('Investment in Subsidiary');
    });

    it('should calculate zero goodwill when purchase equals fair value', () => {
      const entry = ConsolidationAdjustmentsEngine.recordGoodwill(
        300000,
        300000,
        'SubA',
        '2024-Q1'
      );
      expect(entry.amount).toBe(0);
    });
  });

  describe('calculateNCI', () => {
    it('should calculate non-controlling interest', () => {
      const entry = ConsolidationAdjustmentsEngine.calculateNCI(500000, 0.2, 'SubA', '2024-Q1');
      expect(entry.type).toBe('nci');
      expect(entry.amount).toBe(100000);
      expect(entry.debitAccount).toBe('Equity');
      expect(entry.creditAccount).toBe('NCI');
    });
  });

  describe('addAdjustment', () => {
    it('should add a manual adjustment entry', () => {
      const entry = ConsolidationAdjustmentsEngine.addAdjustment(
        'Fair value adjustment',
        'PPE',
        'Revaluation Surplus',
        50000,
        'SubA',
        '2024-Q1'
      );
      expect(entry.type).toBe('adjustment');
      expect(entry.description).toBe('Fair value adjustment');
      expect(entry.amount).toBe(50000);
    });
  });

  describe('getConsolidationSummary', () => {
    it('should compute summary across entry types', () => {
      ConsolidationAdjustmentsEngine.eliminateIntercompany('Rev', 'Exp', 100000, 'Sub', '2024-Q1');
      ConsolidationAdjustmentsEngine.recordGoodwill(500000, 300000, 'SubA', '2024-Q1');
      ConsolidationAdjustmentsEngine.calculateNCI(500000, 0.2, 'SubA', '2024-Q1');

      const result = ConsolidationAdjustmentsEngine.getConsolidationSummary('2024-Q1');
      expect(result.totalEliminations).toBe(100000);
      expect(result.totalGoodwill).toBe(200000);
      expect(result.totalNCI).toBe(100000);
      expect(result.totalAdjustments).toBe(0);
      expect(result.netEffect).toBe(200000);
      expect(result.entries.length).toBe(3);
    });

    it('should only include entries for the requested period', () => {
      ConsolidationAdjustmentsEngine.eliminateIntercompany('Rev', 'Exp', 50000, 'Sub', '2024-Q1');
      ConsolidationAdjustmentsEngine.eliminateIntercompany('Rev', 'Exp', 50000, 'Sub', '2024-Q2');

      const result = ConsolidationAdjustmentsEngine.getConsolidationSummary('2024-Q1');
      expect(result.entries.length).toBe(1);
    });
  });

  describe('getEntries', () => {
    it('should return all entries when no period filter', () => {
      ConsolidationAdjustmentsEngine.eliminateIntercompany('A', 'B', 100, 'Sub', '2024-Q1');
      ConsolidationAdjustmentsEngine.eliminateIntercompany('A', 'B', 100, 'Sub', '2024-Q2');
      expect(ConsolidationAdjustmentsEngine.getEntries()).toHaveLength(2);
    });

    it('should filter by period when provided', () => {
      ConsolidationAdjustmentsEngine.eliminateIntercompany('A', 'B', 100, 'Sub', '2024-Q1');
      ConsolidationAdjustmentsEngine.eliminateIntercompany('A', 'B', 100, 'Sub', '2024-Q2');
      const entries = ConsolidationAdjustmentsEngine.getEntries('2024-Q1');
      expect(entries).toHaveLength(1);
      expect(entries![0]!.period).toBe('2024-Q1');
    });
  });

  describe('reverseEntry', () => {
    it('should reverse a pending entry', () => {
      const entry = ConsolidationAdjustmentsEngine.eliminateIntercompany(
        'A',
        'B',
        100,
        'Sub',
        '2024-Q1'
      );
      const result = ConsolidationAdjustmentsEngine.reverseEntry(entry.id);
      expect(result).toBe(true);
      expect(entry.status).toBe('reversed');
    });

    it('should return false for non-existent entry', () => {
      expect(ConsolidationAdjustmentsEngine.reverseEntry('nonexistent')).toBe(false);
    });

    it('should return false for already reversed entry', () => {
      const entry = ConsolidationAdjustmentsEngine.eliminateIntercompany(
        'A',
        'B',
        100,
        'Sub',
        '2024-Q1'
      );
      ConsolidationAdjustmentsEngine.reverseEntry(entry.id);
      expect(ConsolidationAdjustmentsEngine.reverseEntry(entry.id)).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all entries', () => {
      ConsolidationAdjustmentsEngine.eliminateIntercompany('A', 'B', 100, 'Sub', '2024-Q1');
      ConsolidationAdjustmentsEngine.reset();
      expect(ConsolidationAdjustmentsEngine.getEntries()).toHaveLength(0);
    });
  });
});
