import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExportTemplateEngine,
  resolveSectionKPIs,
  resolveSectionRows,
  type ExportContext,
  type ExportTemplate,
  type TemplateSection,
} from './ExportTemplateEngine';

describe('ExportTemplateEngine', () => {
  let engine: ExportTemplateEngine;

  beforeEach(() => {
    engine = new ExportTemplateEngine();
  });

  it('should initialize with built-in templates', () => {
    const templates = engine.listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(5);
  });

  it('should get template by id', () => {
    const templates = engine.listTemplates();
    const tpl = engine.getTemplate(templates![0]!.id);
    expect(tpl).toBeDefined();
    expect(tpl!.id).toBe(templates![0]!.id);
  });

  it('should return undefined for non-existent template', () => {
    expect(engine.getTemplate('non-existent')).toBeUndefined();
  });

  it('should register a custom template', () => {
    const custom: ExportTemplate = {
      id: 'custom-report',
      name: 'Custom Report',
      type: 'kpi_summary',
      description: 'A custom report',
      sections: [{ id: 's1', type: 'text', title: 'Intro', order: 0, config: {} }],
      style: {
        primaryColor: '#000',
        secondaryColor: '#fff',
        fontFamily: 'helvetica',
        headerFontSize: 14,
        bodyFontSize: 10,
        companyName: 'Test',
      },
      variables: [{ key: 'entity', label: 'Entity', defaultValue: 'ACME' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    engine.register(custom);
    const tpl = engine.getTemplate('custom-report');
    expect(tpl).toBeDefined();
    expect(tpl!.name).toBe('Custom Report');
  });

  it('should list templates', () => {
    const templates = engine.listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(5);
    const names = templates.map((t) => t.name);
    expect(names.length).toBeGreaterThan(0);
  });

  it('should get template types', () => {
    const templates = engine.listTemplates();
    const types = new Set(templates.map((t) => t.type));
    expect(types.size).toBeGreaterThan(1);
  });

  it('should have variables on templates', () => {
    const templates = engine.listTemplates();
    for (const tpl of templates) {
      expect(tpl.variables).toBeDefined();
      expect(Array.isArray(tpl.variables)).toBe(true);
    }
  });

  it('should have sections on templates', () => {
    const templates = engine.listTemplates();
    for (const tpl of templates) {
      expect(tpl.sections).toBeDefined();
      expect(Array.isArray(tpl.sections)).toBe(true);
    }
  });

  // --- Anti-fabrication guards -------------------------------------------
  // A template must never ship literal financial figures. Before this suite,
  // the board pack advertised "$12.4M revenue / $2.1M net income" for EVERY
  // entity and period, and the KPI template invented 12 more. Those render
  // into a signed, CONFIDENTIAL-stamped board document.

  it('ships no hardcoded financial values in any built-in template', () => {
    const offenders: string[] = [];

    for (const tpl of engine.listTemplates()) {
      for (const section of tpl.sections) {
        const kpis = section.config.kpis as Array<{ label: string; value: string }> | undefined;
        for (const kpi of kpis ?? []) {
          if (/\d/.test(kpi.value))
            offenders.push(`${tpl.id}/${section.id}: ${kpi.label}=${kpi.value}`);
        }
        const rows = (section.config.rows as string[][]) ?? [];
        for (const row of rows) {
          // Cell 0 is the line-item label; value columns must be blank scaffold.
          for (const cell of row.slice(1)) {
            if (/\d/.test(String(cell)))
              offenders.push(`${tpl.id}/${section.id}: row value "${cell}"`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('binds board pack sections to context data instead of literals', () => {
    const tpl = engine.getTemplate('tpl-board-pack')!;
    const ctx: ExportContext = {
      entity: 'Acme',
      period: 'FY 2026',
      currency: 'USD',
      date: '2026-08-18',
      preparedBy: 'Finance',
      data: {
        execKpis: [{ label: 'Total Revenue', value: '$1.00', change: '+1%' }],
        incomeStatement: { rows: [['Revenue', '100', '90', '10', '11%']] },
      },
    };

    const kpiSection = tpl.sections.find((s) => s.type === 'kpi_summary')!;
    expect(resolveSectionKPIs(kpiSection, ctx)).toEqual([
      { label: 'Total Revenue', value: '$1.00', change: '+1%' },
    ]);

    const pl = tpl.sections.find((s) => s.id === 'pl')!;
    expect(resolveSectionRows(pl, ctx)).toEqual([['Revenue', '100', '90', '10', '11%']]);
  });

  it('resolves an unbound section to empty rather than inventing data', () => {
    const tpl = engine.getTemplate('tpl-board-pack')!;
    const ctx: ExportContext = {
      entity: 'Acme',
      period: 'FY 2026',
      currency: 'USD',
      date: '2026-08-18',
      preparedBy: 'Finance',
      data: {},
    };

    for (const section of tpl.sections) {
      if (section.type === 'kpi_summary') expect(resolveSectionKPIs(section, ctx)).toEqual([]);
      if (section.type === 'table') {
        // Unbound tables may fall back to a label scaffold, but every value
        // cell must be blank -- no numbers may appear from nowhere.
        for (const row of resolveSectionRows(section, ctx)) {
          for (const cell of row.slice(1)) expect(String(cell)).not.toMatch(/\d/);
        }
      }
    }
  });

  it('accepts a bare array binding as well as a { rows } bundle', () => {
    const section = {
      id: 's',
      type: 'table',
      title: 'T',
      order: 0,
      config: { headers: ['A'], dataKey: 'k' },
    } as TemplateSection;
    const base = {
      entity: 'E',
      period: 'P',
      currency: 'USD',
      date: 'd',
      preparedBy: 'p',
    };

    expect(resolveSectionRows(section, { ...base, data: { k: [['x', '1']] } })).toEqual([
      ['x', '1'],
    ]);
    expect(resolveSectionRows(section, { ...base, data: { k: { rows: [['y', '2']] } } })).toEqual([
      ['y', '2'],
    ]);
  });
});
