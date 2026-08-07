/**
 * TemplateEngine.ext.test.ts — instantiate/customize/formula known answers
 * (MISSION D wave 2, 2026-08-07).
 */
import { describe, expect, it } from 'vitest';
import { TemplateEngine, type Template } from './TemplateEngine';

const tpl: Template = {
  id: 't1',
  name: 'Revenue Plan',
  description: '',
  category: 'forecast',
  industry: 'generic',
  version: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  columns: [
    { key: 'jan', type: 'number', header: 'Jan' },
    { key: 'feb', type: 'number', header: 'Feb' },
    { key: 'note', type: 'text', header: 'Note' },
  ],
  rows: [
    { id: 'software', label: 'Software', defaultValues: { jan: 100, feb: 120 } },
    { id: 'services', label: 'Services', defaultValues: {} },
  ],
  kpis: [],
  charts: [],
};

describe('TemplateEngine — registry & instantiation', () => {
  it('loadTemplate finds by id and listTemplates filters by category', () => {
    expect(TemplateEngine.loadTemplate([tpl], 't1')?.name).toBe('Revenue Plan');
    expect(TemplateEngine.loadTemplate([tpl], 'nope')).toBeUndefined();
    expect(TemplateEngine.listTemplates([tpl])).toHaveLength(1);
    expect(TemplateEngine.listTemplates([tpl], 'report')).toHaveLength(0);
    expect(TemplateEngine.listTemplates([tpl], 'forecast')).toHaveLength(1);
  });

  it('listByIndustry includes generic templates', () => {
    const retail: Template = { ...tpl, id: 't2', industry: 'retail' };
    expect(TemplateEngine.listByIndustry([tpl, retail], 'retail').map((t) => t.id)).toEqual([
      't1',
      't2',
    ]);
  });

  it('instantiateTemplate seeds defaults and fills numeric columns with 0', () => {
    const inst = TemplateEngine.instantiateTemplate(tpl);
    expect(inst.templateId).toBe('t1');
    expect(inst.instanceId).toMatch(/^inst-/);
    expect(inst.data['software']).toEqual({ jan: 100, feb: 120, note: '' });
    expect(inst.data['services']).toEqual({ jan: 0, feb: 0, note: '' });
  });

  it('instantiateTemplate merges provided data over defaults', () => {
    const inst = TemplateEngine.instantiateTemplate(tpl, {
      software: { jan: 999 },
      newrow: { jan: 5 },
    });
    expect(inst.data['software']!.jan).toBe(999);
    expect(inst.data['newrow']).toEqual({ jan: 5 });
  });

  it('customizeTemplate merges changes and bumps version', () => {
    const customized = TemplateEngine.customizeTemplate(tpl, { name: 'Renamed' });
    expect(customized.name).toBe('Renamed');
    expect(customized.version).toBe(2); // template.version + 1
    expect(customized.id).toBe('t1');
    expect(customized.columns).toBe(tpl.columns); // untouched fields preserved
  });

  it('export / import round-trips and validates', () => {
    const json = TemplateEngine.exportTemplate(tpl);
    const imported = TemplateEngine.importTemplate(json);
    expect((imported as Template).id).toBe('t1');
    expect(TemplateEngine.importTemplate('nope')).toEqual({ error: 'Invalid JSON' });
    expect(TemplateEngine.importTemplate('{"id":"x"}')).toEqual({
      error: 'Invalid template: missing required fields (id, name, category)',
    });
    expect(TemplateEngine.importTemplate('{"id":"x","name":"n","category":"report"}')).toEqual({
      error: 'Invalid template: columns and rows must be arrays',
    });
  });
});

describe('TemplateEngine — formulas', () => {
  const data = {
    software: { jan: 100, feb: 120 },
    services: { jan: 50, feb: 60 },
  };

  it('SUM(column) totals numeric values across rows', () => {
    expect(TemplateEngine.calculateFormula('SUM(jan)', data, 'software')).toBe(150);
    expect(TemplateEngine.calculateFormula('SUM(missing)', data, 'software')).toBe(0);
    expect(TemplateEngine.calculateFormula('SUM(a:b)', data, 'software')).toBe(0); // range form is simplified
  });

  it('TOTAL sums the current row', () => {
    expect(TemplateEngine.calculateFormula('TOTAL', data, 'software')).toBe(220);
    expect(TemplateEngine.calculateFormula('TOTAL', data, 'missing')).toBe(0);
  });

  it('%ref computes share of the column', () => {
    expect(TemplateEngine.calculateFormula('%jan', data, 'software')).toBeCloseTo(66.6667, 3);
    expect(TemplateEngine.calculateFormula('%missing', data, 'software')).toBe(0);
  });

  it('unknown formulas evaluate to 0', () => {
    expect(TemplateEngine.calculateFormula('AVG(jan)', data, 'software')).toBe(0);
  });

  it('evaluateFormulas fills formula columns across rows', () => {
    const formulaTpl: Template = {
      ...tpl,
      columns: [
        { key: 'jan', type: 'number', header: 'Jan' },
        { key: 'total', type: 'number', header: 'Total', formula: 'TOTAL' },
      ],
      rows: [
        { id: 'software', label: 'Software', defaultValues: { jan: 10, feb: 20 } },
        { id: 'services', label: 'Services', defaultValues: { jan: 5, feb: 5 } },
      ],
    };
    const inst = TemplateEngine.instantiateTemplate(formulaTpl, {});
    const evaluated = TemplateEngine.evaluateFormulas(formulaTpl, inst);
    // TOTAL column sums each row's numeric values (jan + feb, total starts 0)
    expect(evaluated['software']!.total).toBe(30);
    expect(evaluated['services']!.total).toBe(10);
  });
});
