/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowTemplateEngine } from './WorkflowTemplateEngine';

describe('WorkflowTemplateEngine', () => {
  let engine: WorkflowTemplateEngine;

  beforeEach(() => {
    engine = new WorkflowTemplateEngine();
  });

  describe('constructor', () => {
    it('registers built-in templates on construction', () => {
      const builtIn = engine.listBuiltInTemplates();
      expect(builtIn.length).toBeGreaterThanOrEqual(8);
      expect(builtIn.some((t) => t.id === 'tpl-monthly-close')).toBe(true);
      expect(builtIn.some((t) => t.id === 'tpl-budget-approval')).toBe(true);
      expect(builtIn.some((t) => t.id === 'tpl-forecast-update')).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('returns a built-in template by id', () => {
      const tpl = engine.getTemplate('tpl-monthly-close');
      expect(tpl).toBeDefined();
      expect(tpl?.name).toBe('Monthly Close Process');
      expect(tpl?.category).toBe('close');
    });

    it('returns undefined for non-existent template', () => {
      expect(engine.getTemplate('nonexistent')).toBeUndefined();
    });
  });

  describe('listTemplates', () => {
    it('returns all templates (built-in + custom)', () => {
      engine.createCustomTemplate({
        name: 'My Custom',
        description: 'test',
        category: 'budget',
        tags: ['custom'],
        steps: [],
        triggers: [],
        variables: [],
        version: '1.0.0',
      });
      const all = engine.listTemplates();
      expect(all.length).toBeGreaterThan(8);
    });
  });

  describe('getTemplatesByCategory', () => {
    it('filters by category', () => {
      const closeTemplates = engine.getTemplatesByCategory('close');
      expect(closeTemplates.length).toBeGreaterThanOrEqual(1);
      expect(closeTemplates.every((t) => t.category === 'close')).toBe(true);
    });

    it('returns empty for non-existent category', () => {
      expect(engine.getTemplatesByCategory('nonexistent' as any)).toEqual([]);
    });
  });

  describe('searchTemplates', () => {
    it('searches by name', () => {
      const results = engine.searchTemplates('Budget');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('searches by description', () => {
      const results = engine.searchTemplates('reconciliation');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('searches by tag', () => {
      const results = engine.searchTemplates('quarterly');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty for no match', () => {
      expect(engine.searchTemplates('zzzznonexistent')).toEqual([]);
    });
  });

  describe('createCustomTemplate', () => {
    it('creates a custom template with generated id', () => {
      const tpl = engine.createCustomTemplate({
        name: 'Custom Budget',
        description: 'My custom budget template',
        category: 'budget',
        tags: ['custom'],
        steps: [],
        triggers: [],
        variables: [],
        version: '1.0.0',
      });
      expect(tpl.id).toMatch(/^ctpl-/);
      expect(tpl.isBuiltIn).toBe(false);
      expect(tpl.createdAt).toBeDefined();
    });

    it('custom templates appear in listTemplates', () => {
      engine.createCustomTemplate({
        name: 'X',
        description: 'd',
        category: 'budget',
        tags: [],
        steps: [],
        triggers: [],
        variables: [],
        version: '1.0.0',
      });
      expect(engine.listCustomTemplates().length).toBe(1);
    });
  });

  describe('deleteCustomTemplate', () => {
    it('deletes a custom template', () => {
      const tpl = engine.createCustomTemplate({
        name: 'X',
        description: 'd',
        category: 'budget',
        tags: [],
        steps: [],
        triggers: [],
        variables: [],
        version: '1.0.0',
      });
      expect(engine.deleteCustomTemplate(tpl.id)).toBe(true);
      expect(engine.getTemplate(tpl.id)).toBeUndefined();
    });

    it('cannot delete a built-in template', () => {
      expect(engine.deleteCustomTemplate('tpl-monthly-close')).toBe(false);
    });
  });

  describe('instantiate', () => {
    it('instantiates a template with variables', () => {
      const wf = engine.instantiate('tpl-monthly-close', 'Jan Close', {
        entity: 'US01',
        period: '2026-01',
      });
      expect(wf).not.toBeNull();
      expect(wf?.name).toBe('Jan Close');
      expect(wf?.templateId).toBe('tpl-monthly-close');
      expect(wf?.variables.entity).toBe('US01');
      expect(wf?.variables.period).toBe('2026-01');
    });

    it('uses default values for missing variables', () => {
      const wf = engine.instantiate('tpl-forecast-update', 'Q1 Forecast');
      expect(wf?.variables.scenario).toBe('base');
    });

    it('returns null for non-existent template', () => {
      expect(engine.instantiate('nonexistent', 'name')).toBeNull();
    });
  });

  describe('validateVariables', () => {
    it('validates required variables', () => {
      const result = engine.validateVariables('tpl-monthly-close', {});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it('passes with all required variables', () => {
      const result = engine.validateVariables('tpl-monthly-close', {
        entity: 'US01',
        period: '2026-01',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates select options', () => {
      const result = engine.validateVariables('tpl-data-import', {
        source: 'invalid',
        filePattern: '*.csv',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must be one of'))).toBe(true);
    });
  });

  describe('getTemplateCategories', () => {
    it('returns all unique categories', () => {
      const cats = engine.getTemplateCategories();
      expect(cats).toContain('close');
      expect(cats).toContain('budget');
      expect(cats).toContain('forecast');
    });
  });

  describe('serialize/deserialize', () => {
    it('round-trips custom templates', () => {
      engine.createCustomTemplate({
        name: 'Serialized',
        description: 'd',
        category: 'budget',
        tags: [],
        steps: [],
        triggers: [],
        variables: [],
        version: '1.0.0',
      });
      const json = engine.serialize();
      const engine2 = new WorkflowTemplateEngine();
      engine2.deserialize(json);
      expect(engine2.listCustomTemplates().length).toBe(1);
    });
  });
});
