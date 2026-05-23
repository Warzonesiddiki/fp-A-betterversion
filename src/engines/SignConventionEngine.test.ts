import { describe, it, expect } from 'vitest';
import { SignConventionEngine } from './SignConventionEngine';

describe('SignConventionEngine', () => {
  describe('getNaturalSign', () => {
    it('returns debit for Asset', () => {
      expect(SignConventionEngine.getNaturalSign('Asset')).toBe('debit');
    });

    it('returns debit for expenses', () => {
      expect(SignConventionEngine.getNaturalSign('COGS')).toBe('debit');
      expect(SignConventionEngine.getNaturalSign('OpEx')).toBe('debit');
      expect(SignConventionEngine.getNaturalSign('CapEx')).toBe('debit');
    });

    it('returns credit for Liability', () => {
      expect(SignConventionEngine.getNaturalSign('Liability')).toBe('credit');
    });

    it('returns credit for Equity', () => {
      expect(SignConventionEngine.getNaturalSign('Equity')).toBe('credit');
    });

    it('returns credit for Revenue', () => {
      expect(SignConventionEngine.getNaturalSign('Revenue')).toBe('credit');
    });
  });

  describe('isContraAccount', () => {
    it('identifies contra accounts', () => {
      expect(SignConventionEngine.isContraAccount('1300')).toBe(true);
      expect(SignConventionEngine.isContraAccount('3200')).toBe(true);
    });

    it('returns false for regular accounts', () => {
      expect(SignConventionEngine.isContraAccount('1000')).toBe(false);
    });
  });

  describe('formatForDisplay', () => {
    it('inverts expense values for display', () => {
      expect(SignConventionEngine.formatForDisplay(100, 'OpEx')).toBe(-100);
    });

    it('keeps revenue as-is', () => {
      expect(SignConventionEngine.formatForDisplay(100, 'Revenue')).toBe(100);
    });
  });

  describe('calculateVariance', () => {
    it('calculates favorable revenue variance', () => {
      const result = SignConventionEngine.calculateVariance(120, 100, 'Revenue');
      expect(result.absolute).toBe(20);
      expect(result.isFavorable).toBe(true);
      expect(result.direction).toBe('favorable');
    });

    it('calculates unfavorable revenue variance', () => {
      const result = SignConventionEngine.calculateVariance(80, 100, 'Revenue');
      expect(result.absolute).toBe(-20);
      expect(result.isFavorable).toBe(false);
    });

    it('calculates favorable expense variance (under budget)', () => {
      const result = SignConventionEngine.calculateVariance(80, 100, 'OpEx');
      expect(result.absolute).toBe(-20);
      expect(result.isFavorable).toBe(true);
    });

    it('handles zero budget', () => {
      const result = SignConventionEngine.calculateVariance(10, 0, 'Revenue');
      expect(result.percentage).toBe(0);
    });
  });

  describe('isFavorable', () => {
    it('revenue positive is favorable', () => {
      expect(SignConventionEngine.isFavorable(10, 'Revenue')).toBe(true);
    });

    it('expense negative is favorable', () => {
      expect(SignConventionEngine.isFavorable(-10, 'OpEx')).toBe(true);
    });
  });

  describe('getAggregationMultiplier', () => {
    it('returns -1 for contra accounts', () => {
      expect(SignConventionEngine.getAggregationMultiplier('1300')).toBe(-1);
    });

    it('returns 1 for regular accounts', () => {
      expect(SignConventionEngine.getAggregationMultiplier('1000')).toBe(1);
    });
  });
});
