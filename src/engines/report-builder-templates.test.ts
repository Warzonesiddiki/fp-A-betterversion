/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  generateReportId,
  createEmptyCell,
  createEmptyLayout,
  getTemplateLayout,
  getAvailableTemplates,
} from './report-builder-templates';

describe('Report Builder Templates', () => {
  describe('generateReportId', () => {
    it('generates unique ID', () => {
      const id1 = generateReportId();
      const id2 = generateReportId();
      expect(id1).not.toBe(id2);
    });

    it('starts with rpt_ prefix', () => {
      const id = generateReportId();
      expect(id).toMatch(/^rpt_/);
    });
  });

  describe('createEmptyCell', () => {
    it('creates text cell', () => {
      const cell = createEmptyCell('text');
      expect(cell.type).toBe('text');
      expect(cell.content.type).toBe('text');
      expect(cell.isVisible).toBe(true);
    });

    it('creates metric cell', () => {
      const cell = createEmptyCell('metric');
      expect(cell.type).toBe('metric');
      expect(cell.content.type).toBe('metric');
    });

    it('creates cell with default style', () => {
      const cell = createEmptyCell('text');
      expect(cell.style).toBeDefined();
      expect(cell.colspan).toBe(1);
      expect(cell.rowspan).toBe(1);
    });
  });

  describe('createEmptyLayout', () => {
    it('creates empty layout', () => {
      const layout = createEmptyLayout();
      expect(layout).toBeDefined();
      expect(layout.rows).toBeDefined();
      expect(layout.columns).toBeDefined();
    });
  });

  describe('getTemplateLayout', () => {
    it('returns income statement layout', () => {
      const layout = getTemplateLayout('income_statement');
      expect(layout).toBeDefined();
      expect(layout.rows.length).toBeGreaterThan(0);
    });

    it('returns balance sheet layout', () => {
      const layout = getTemplateLayout('balance_sheet');
      expect(layout).toBeDefined();
      expect(layout.rows.length).toBeGreaterThan(0);
    });

    it('returns cash flow layout', () => {
      const layout = getTemplateLayout('cash_flow');
      expect(layout).toBeDefined();
      expect(layout.rows.length).toBeGreaterThan(0);
    });

    it('returns budget vs actual layout', () => {
      const layout = getTemplateLayout('budget_vs_actual');
      expect(layout).toBeDefined();
    });

    it('returns variance analysis layout', () => {
      const layout = getTemplateLayout('variance_analysis');
      expect(layout).toBeDefined();
    });
  });

  describe('getAvailableTemplates', () => {
    it('returns list of templates', () => {
      const templates = getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('templates have name and description', () => {
      const templates = getAvailableTemplates();
      for (const t of templates) {
        expect(t.name).toBeDefined();
        expect(t.description).toBeDefined();
      }
    });
  });
});
