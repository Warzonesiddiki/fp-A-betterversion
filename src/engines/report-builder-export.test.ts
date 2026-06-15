/**
 * @vitest-environment jsdom
 *
 * Smoke tests for report-builder-export (pure functions, no side effects).
 * Edge cases: zero, negative, NaN, Infinity.
 */
import { describe, it, expect } from 'vitest';
import {
  generatePDFMetadata,
  exportLayout,
  importLayout,
  generateExcelExport,
  generateCSVExport,
  exportReport,
} from './report-builder-export';
import type { ReportDefinition, CubeData } from './report-builder-types';

const cube: CubeData = {};
const stubReport = {
  id: 'r1',
  name: 'P&L',
  description: '',
  template: 'income_statement' as const,
  layout: {
    columns: [],
    rows: [],
    columnWidths: {},
    defaultRowHeight: 24,
    frozenColumns: 0,
    frozenRows: 0,
    filters: [],
  },
  filters: [],
  shares: [],
  tags: [],
  isArchived: false,
  createdBy: 't',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  version: 1,
} as unknown as ReportDefinition;

describe('report-builder-export smoke', () => {
  it('every export function is defined', () => {
    expect(generatePDFMetadata).toBeDefined();
    expect(exportLayout).toBeDefined();
    expect(importLayout).toBeDefined();
    expect(generateExcelExport).toBeDefined();
    expect(generateCSVExport).toBeDefined();
    expect(exportReport).toBeDefined();
  });

  it('property test: export functions tolerate zero/negative/NaN/Infinity layouts', () => {
    for (const v of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const r = { ...stubReport, name: `n${v}` } as ReportDefinition;
      expect(generatePDFMetadata(r)).toBeDefined();
      expect(generateExcelExport(r, cube)).toBeDefined();
      expect(generateCSVExport(r, cube)).toBeDefined();
      expect(exportReport(r, cube, 'pdf')).toBeDefined();
      expect(exportReport(r, cube, 'excel')).toBeDefined();
      expect(exportReport(r, cube, 'csv')).toBeDefined();
    }
  });

  it('exportLayout / importLayout round-trip a minimal layout', () => {
    const layout = stubReport.layout;
    const json = exportLayout(layout);
    expect(typeof json).toBe('string');
    expect(importLayout(json)).toBeDefined();
  });

  it('importLayout throws on invalid JSON', () => {
    expect(() => importLayout('not json')).toThrow();
  });
});
