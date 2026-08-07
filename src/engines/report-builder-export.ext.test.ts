/**
 * report-builder-export.ext.test.ts — export pipeline known answers
 * (MISSION D wave 2, 2026-08-07): Excel sheet shape, CSV escaping,
 * dispatch, PDF metadata, layout validation.
 */
import { describe, expect, it } from 'vitest';
import {
  exportLayout,
  exportReport,
  generateCSVExport,
  generateExcelExport,
  generatePDFMetadata,
  importLayout,
} from './report-builder-export';
import type { ReportDefinition, ReportLayout } from './report-builder-types';

const layout: ReportLayout = {
  rows: [
    {
      id: 'r1',
      type: 'data',
      height: 20,
      isVisible: true,
      pageBreakBefore: false,
      cells: [
        {
          id: 'c1',
          type: 'text',
          content: { type: 'text', content: { text: 'Revenue' } },
          style: {
            bold: false,
            italic: false,
            align: 'left',
            fillColor: '#fff',
            textColor: '#000',
          },
          colspan: 1,
          rowspan: 1,
          isVisible: true,
        },
        {
          id: 'c2',
          type: 'metric',
          content: {
            type: 'metric',
            content: {
              coords: 'R1.C1',
              measure: 'revenue',
              format: 'currency',
              decimals: 0,
              showSign: false,
            },
          },
          style: {
            bold: false,
            italic: false,
            align: 'right',
            fillColor: '#fff',
            textColor: '#000',
          },
          colspan: 1,
          rowspan: 1,
          isVisible: true,
        },
      ],
    },
    {
      id: 'r2',
      type: 'data',
      height: 20,
      isVisible: false, // hidden row must be skipped
      pageBreakBefore: false,
      cells: [
        {
          id: 'c3',
          type: 'text',
          content: { type: 'text', content: { text: 'Hidden' } },
          style: {
            bold: false,
            italic: false,
            align: 'left',
            fillColor: '#fff',
            textColor: '#000',
          },
          colspan: 1,
          rowspan: 1,
          isVisible: true,
        },
        {
          id: 'c4',
          type: 'metric',
          content: {
            type: 'metric',
            content: {
              coords: 'R2.C1',
              measure: 'cost',
              format: 'currency',
              decimals: 0,
              showSign: false,
            },
          },
          style: {
            bold: false,
            italic: false,
            align: 'right',
            fillColor: '#fff',
            textColor: '#000',
          },
          colspan: 1,
          rowspan: 1,
          isVisible: true,
        },
      ],
    },
  ],
  columns: [
    { id: 'k', type: 'label', header: 'Line Item', width: 120, isVisible: true, isLocked: false },
    { id: 'v', type: 'metric', header: 'Amount', width: 90, isVisible: true, isLocked: false },
    {
      id: 'hidden',
      type: 'metric',
      header: 'Secret',
      width: 50,
      isVisible: false,
      isLocked: false,
    },
  ],
  columnWidths: {},
  defaultRowHeight: 20,
  frozenColumns: 0,
  frozenRows: 0,
  filters: [],
};

const report: ReportDefinition = {
  id: 'rep-1',
  name: 'Revenue Report',
  description: 'Monthly revenue',
  template: 'blank',
  layout,
  filters: [],
  shares: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  createdBy: 'u1',
  tags: [],
  isArchived: false,
  version: 1,
};

describe('report-builder-export — Excel', () => {
  it('generateExcelExport renders visible columns/rows with raw values', () => {
    const out = generateExcelExport(report, { 'R1.C1.revenue': 1234.5 });
    expect(out.sheets).toHaveLength(1);
    const sheet = out.sheets[0]!;
    expect(sheet.name).toBe('Revenue Report');
    expect(sheet.data[0]).toEqual(['Line Item', 'Amount']); // hidden column dropped
    expect(sheet.data[1]).toEqual(['Revenue', 1234.5]);
    expect(sheet.data).toHaveLength(2); // hidden row dropped
    expect(sheet.columnWidths).toEqual([120, 90]);
    expect(out.metadata.author).toBe('u1');
    expect(out.metadata.title).toBe('Revenue Report');
  });
});

describe('report-builder-export — CSV', () => {
  it('generateCSVExport escapes and names the file safely', () => {
    const reportWithComma: ReportDefinition = {
      ...report,
      name: 'Rev, 2026 Report',
      layout: {
        ...layout,
        rows: [
          {
            ...layout.rows[0]!,
            cells: [
              {
                ...layout.rows[0]!.cells[0]!,
                content: { type: 'text', content: { text: 'Rev, "Q1"' } },
              },
              layout.rows[0]!.cells[1]!,
            ],
          },
        ],
      },
    };
    const out = generateCSVExport(reportWithComma, { 'R1.C1.revenue': 100 });
    expect(out.content).toContain('Line Item,Amount');
    expect(out.content).toContain('"Rev, ""Q1"""');
    expect(out.content).toContain('100');
    expect(out.filename).toBe('Rev__2026_Report.csv');
    expect(out.mimeType).toBe('text/csv');
  });
});

describe('report-builder-export — dispatch & metadata', () => {
  it('exportReport dispatches by format', () => {
    const pdf = exportReport(report, {}, 'pdf');
    expect((pdf as { reportId: string }).reportId).toBe('rep-1');
    const excel = exportReport(report, {}, 'excel');
    expect((excel as { sheets: unknown[] }).sheets).toHaveLength(1);
    const csv = exportReport(report, {}, 'csv');
    expect((csv as { mimeType: string }).mimeType).toBe('text/csv');
  });

  it('generatePDFMetadata defaults and options merge', () => {
    const m = generatePDFMetadata(report);
    expect(m.orientation).toBe('landscape');
    expect(m.pageSize).toBe('letter');
    expect(m.showPageNumbers).toBe(true);
    expect(m.showTimestamp).toBe(true);
    expect(m.subtitle).toBe('Monthly revenue');
    const overridden = generatePDFMetadata(report, {
      orientation: 'portrait',
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
    });
    expect(overridden.orientation).toBe('portrait');
    expect(overridden.margins.top).toBe(10);
  });
});

describe('report-builder-export — layout import/export', () => {
  it('round-trips a valid layout', () => {
    const json = exportLayout(layout);
    const back = importLayout(json);
    expect(back.rows).toHaveLength(2);
    expect(back.columns).toHaveLength(3);
  });

  it('rejects invalid layout structures and bad JSON', () => {
    expect(() => importLayout('not json')).toThrow('Failed to import layout');
    expect(() => importLayout('{"rows":[]}')).toThrow('Invalid layout structure');
    expect(() =>
      importLayout('{"rows":[],"columns":[],"columnWidths":{},"defaultRowHeight":"x"}')
    ).toThrow('Invalid layout structure');
    expect(() => importLayout('null')).toThrow('Invalid layout structure');
  });
});
