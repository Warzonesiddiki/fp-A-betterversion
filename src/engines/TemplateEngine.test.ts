/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { TemplateEngine, type Template } from './TemplateEngine';

describe('TemplateEngine', () => {
  const mockTemplate: Template = {
    id: 'tmpl-1',
    name: 'Income Statement',
    description: 'Standard P&L template',
    category: 'report',
    industry: 'generic',
    rows: [
      { id: 'row-1', label: 'Revenue', level: 0 },
      { id: 'row-2', label: 'COGS', level: 1 },
      { id: 'row-3', label: 'Gross Profit', level: 0 },
    ],
    columns: [{ key: 'col-1', label: 'Amount', type: 'number' }],
    kpis: [
      {
        id: 'kpi-1',
        label: 'Gross Margin',
        formula: '(Revenue - COGS) / Revenue',
        format: 'percentage',
      },
    ],
    charts: [],
    version: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('loadTemplate', () => {
    it('loads template by id', () => {
      const result = TemplateEngine.loadTemplate([mockTemplate], 'tmpl-1');
      expect(result).toBeDefined();
      expect(result?.name).toBe('Income Statement');
    });

    it('returns undefined for missing id', () => {
      const result = TemplateEngine.loadTemplate([mockTemplate], 'nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('listTemplates', () => {
    it('lists all templates', () => {
      const result = TemplateEngine.listTemplates([mockTemplate]);
      expect(result).toHaveLength(1);
    });

    it('filters by category', () => {
      const result = TemplateEngine.listTemplates([mockTemplate], 'report');
      expect(result).toHaveLength(1);
    });

    it('returns empty for different category', () => {
      const result = TemplateEngine.listTemplates([mockTemplate], 'budget');
      expect(result).toHaveLength(0);
    });
  });

  describe('listByIndustry', () => {
    it('finds generic templates', () => {
      const result = TemplateEngine.listByIndustry([mockTemplate], 'technology');
      expect(result).toHaveLength(1);
    });

    it('finds industry-specific templates', () => {
      const techTemplate = { ...mockTemplate, id: 'tmpl-2', industry: 'technology' as const };
      const result = TemplateEngine.listByIndustry([techTemplate], 'technology');
      expect(result).toHaveLength(1);
    });
  });

  describe('instantiateTemplate', () => {
    it('creates instance from template', () => {
      const instance = TemplateEngine.instantiateTemplate(mockTemplate);
      expect(instance).toBeDefined();
      expect(instance.templateId).toBe('tmpl-1');
    });

    it('creates instance with data', () => {
      const data = { 'row-1': { 'col-1': 100000 } };
      const instance = TemplateEngine.instantiateTemplate(mockTemplate, data);
      expect(instance).toBeDefined();
    });
  });
});
