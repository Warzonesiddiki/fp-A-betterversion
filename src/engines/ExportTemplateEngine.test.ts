/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExportTemplateEngine,
  type ExportTemplate,
  type ExportContext,
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
});
