/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { AutoCommentaryEngine } from './AutoCommentaryEngine';

describe('AutoCommentaryEngine', () => {
  describe('generateVarianceCommentary', () => {
    it('generates commentary for favorable variance', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        120000,
        100000,
        'revenue',
        'Q1 2026'
      );
      expect(commentary).toBeDefined();
      expect(typeof commentary).toBe('string');
      expect(commentary.length).toBeGreaterThan(0);
    });

    it('generates commentary for unfavorable variance', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        80000,
        100000,
        'revenue',
        'Q1 2026'
      );
      expect(commentary).toBeDefined();
      expect(typeof commentary).toBe('string');
    });

    it('generates commentary with context', () => {
      const commentary = AutoCommentaryEngine.generateVarianceCommentary(
        120000,
        100000,
        'revenue',
        'Q1 2026',
        { priorYear: 90000, drivers: ['volume', 'price'] }
      );
      expect(commentary).toBeDefined();
    });
  });

  describe('generateSectionNarrative', () => {
    it('generates narrative for a section', () => {
      const lineItems = [
        { name: 'Product Revenue', actual: 500000, budget: 450000 },
        { name: 'Service Revenue', actual: 200000, budget: 180000 },
      ];
      const narrative = AutoCommentaryEngine.generateSectionNarrative(
        'Revenue',
        lineItems,
        'Q1 2026'
      );
      expect(narrative).toBeDefined();
      expect(typeof narrative).toBe('string');
    });
  });

  describe('interpolate', () => {
    it('interpolates template variables', () => {
      const template = 'Revenue grew by [growth]% in [period]';
      const result = AutoCommentaryEngine.interpolate(template, {
        growth: 15,
        period: 'Q1 2026',
      });
      expect(result).toContain('15');
      expect(result).toContain('Q1 2026');
    });
  });

  describe('getTemplates', () => {
    it('returns available templates', () => {
      const templates = AutoCommentaryEngine.getTemplates();
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });
  });
});
