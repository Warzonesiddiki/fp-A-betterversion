import { describe, it, expect } from 'vitest';
import {
  ReportBuilderEngine,
  type ReportDefinition,
  type ReportLayout,
  type ReportRow,
  type ReportColumn,
  type ReportCell,
  type CellContent,
  type CellStyle,
  type ConditionalFormat,
  type MetricCellContent,
  type FormulaCellContent,
  type TextCellContent,
  type PDFExportMetadata,
  type TemplateType,
  type PermissionLevel,
  type CubeData,
  type CellBinding,
  type ResolvedCell,
  type ReportParameter,
  type ExcelExportResult,
  type CSVExportResult,
} from './ReportBuilderEngine';

// =============================================================================
// TEST HELPERS
// =============================================================================

function createTestLayout(): ReportLayout {
  const labelColId = 'col-label';
  const valueColId = 'col-value';

  const columns: ReportColumn[] = [
    { id: labelColId, type: 'label', header: 'Item', width: 200, isVisible: true, isLocked: true },
    {
      id: valueColId,
      type: 'period',
      header: 'Actual',
      width: 140,
      period: 'actual',
      isVisible: true,
      isLocked: false,
    },
  ];

  const rows: ReportRow[] = [
    {
      id: 'row-1',
      type: 'header',
      cells: [
        {
          id: 'c1',
          type: 'text',
          content: { type: 'text', content: { text: 'Revenue' } },
          style: createDefaultStyle(),
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
              coords: 'Revenue.Q1',
              measure: 'amount',
              format: 'currency',
              decimals: 0,
              showSign: false,
            },
          },
          style: createDefaultStyle(),
          colspan: 1,
          rowspan: 1,
          isVisible: true,
        },
      ],
      height: 28,
      isVisible: true,
      pageBreakBefore: false,
    },
    {
      id: 'row-2',
      type: 'data',
      cells: [
        {
          id: 'c3',
          type: 'text',
          content: { type: 'text', content: { text: 'Expenses' } },
          style: createDefaultStyle(),
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
              coords: 'Expenses.Q1',
              measure: 'amount',
              format: 'currency',
              decimals: 0,
              showSign: false,
            },
          },
          style: createDefaultStyle(),
          colspan: 1,
          rowspan: 1,
          isVisible: true,
        },
      ],
      height: 28,
      isVisible: true,
      pageBreakBefore: false,
    },
  ];

  return {
    rows,
    columns,
    columnWidths: { [labelColId]: 200, [valueColId]: 140 },
    defaultRowHeight: 28,
    frozenColumns: 1,
    frozenRows: 1,
  };
}

function createDefaultStyle(): CellStyle {
  return {
    bold: false,
    italic: false,
    underline: false,
    fontSize: 11,
    fontFamily: 'Inter, sans-serif',
    textColor: '#1F2937',
    backgroundColor: 'transparent',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    alignment: 'left',
    indent: 0,
    wrap: false,
  };
}

function createTestReport(): ReportDefinition {
  const now = '2024-01-15T10:00:00.000Z';
  return {
    id: 'rpt-test-1',
    name: 'Test Report',
    description: 'A test report',
    template: 'income_statement',
    layout: createTestLayout(),
    filters: [],
    shares: [],
    createdAt: now,
    updatedAt: now,
    createdBy: 'user-1',
    tags: ['finance'],
    isArchived: false,
    version: 1,
  };
}

function createMetricCell(coords: string, measure = 'amount'): ReportCell {
  return {
    id: `cell-${coords}`,
    type: 'metric',
    content: {
      type: 'metric',
      content: { coords, measure, format: 'currency', decimals: 0, showSign: false },
    },
    style: createDefaultStyle(),
    colspan: 1,
    rowspan: 1,
    isVisible: true,
  };
}

function createFormulaCell(expression: string): ReportCell {
  return {
    id: `cell-formula-${expression}`,
    type: 'formula',
    content: {
      type: 'formula',
      content: { expression, format: 'percentage', decimals: 1 },
    },
    style: createDefaultStyle(),
    colspan: 1,
    rowspan: 1,
    isVisible: true,
  };
}

function createTextCell(text: string): ReportCell {
  return {
    id: `cell-text-${text}`,
    type: 'text',
    content: { type: 'text', content: { text } },
    style: createDefaultStyle(),
    colspan: 1,
    rowspan: 1,
    isVisible: true,
  };
}

// =============================================================================
// REPORT BUILDER ENGINE TESTS
// =============================================================================

describe('ReportBuilderEngine', () => {
  // =========================================================================
  // REPORT CREATION
  // =========================================================================

  describe('createReport', () => {
    it('should create a report with valid parameters', () => {
      const report = ReportBuilderEngine.createReport(
        'Q1 Report',
        'custom',
        'user-1',
        'Quarterly report'
      );

      expect(report.name).toBe('Q1 Report');
      expect(report.template).toBe('custom');
      expect(report.createdBy).toBe('user-1');
      expect(report.description).toBe('Quarterly report');
      expect(report.isArchived).toBe(false);
      expect(report.version).toBe(1);
      expect(report.id).toBeTruthy();
      expect(report.createdAt).toBeTruthy();
      expect(report.updatedAt).toBeTruthy();
    });

    it('should trim whitespace from report name', () => {
      const report = ReportBuilderEngine.createReport('  My Report  ', 'custom', 'user-1');
      expect(report.name).toBe('My Report');
    });

    it('should throw if name is empty', () => {
      expect(() => ReportBuilderEngine.createReport('', 'custom', 'user-1')).toThrow(
        'Report name is required'
      );
    });

    it('should throw if name is only whitespace', () => {
      expect(() => ReportBuilderEngine.createReport('   ', 'custom', 'user-1')).toThrow(
        'Report name is required'
      );
    });

    it('should default description to empty string', () => {
      const report = ReportBuilderEngine.createReport('Test', 'custom', 'user-1');
      expect(report.description).toBe('');
    });

    it('should initialize with empty filters, shares, and tags', () => {
      const report = ReportBuilderEngine.createReport('Test', 'custom', 'user-1');
      expect(report.filters).toEqual([]);
      expect(report.shares).toEqual([]);
      expect(report.tags).toEqual([]);
    });
  });

  // =========================================================================
  // REPORT UPDATE
  // =========================================================================

  describe('updateReport', () => {
    it('should update report name immutably', () => {
      const report = createTestReport();
      const updated = ReportBuilderEngine.updateReport(report, { name: 'Updated Report' });

      expect(updated.name).toBe('Updated Report');
      expect(report.name).toBe('Test Report'); // Original unchanged
    });

    it('should update description', () => {
      const report = createTestReport();
      const updated = ReportBuilderEngine.updateReport(report, { description: 'New description' });

      expect(updated.description).toBe('New description');
    });

    it('should increment version', () => {
      const report = createTestReport();
      const updated = ReportBuilderEngine.updateReport(report, { name: 'V2' });

      expect(updated.version).toBe(2);
    });

    it('should update updatedAt timestamp', () => {
      const report = createTestReport();
      const updated = ReportBuilderEngine.updateReport(report, { name: 'V2' });

      expect(updated.updatedAt).not.toBe(report.updatedAt);
    });

    it('should throw if name is empty', () => {
      const report = createTestReport();
      expect(() => ReportBuilderEngine.updateReport(report, { name: '' })).toThrow(
        'Report name cannot be empty'
      );
    });

    it('should throw if name is only whitespace', () => {
      const report = createTestReport();
      expect(() => ReportBuilderEngine.updateReport(report, { name: '   ' })).toThrow(
        'Report name cannot be empty'
      );
    });

    it('should update tags', () => {
      const report = createTestReport();
      const updated = ReportBuilderEngine.updateReport(report, { tags: ['updated', 'q2'] });

      expect(updated.tags).toEqual(['updated', 'q2']);
    });
  });

  // =========================================================================
  // ARCHIVE / DELETE
  // =========================================================================

  describe('archiveReport', () => {
    it('should mark report as archived', () => {
      const report = createTestReport();
      const archived = ReportBuilderEngine.archiveReport(report);

      expect(archived.isArchived).toBe(true);
    });

    it('should not mutate original', () => {
      const report = createTestReport();
      ReportBuilderEngine.archiveReport(report);

      expect(report.isArchived).toBe(false);
    });
  });

  describe('canDeleteReport', () => {
    it('should return true for non-archived reports', () => {
      const report = createTestReport();
      expect(ReportBuilderEngine.canDeleteReport(report)).toBe(true);
    });

    it('should return false for archived reports', () => {
      const report = { ...createTestReport(), isArchived: true };
      expect(ReportBuilderEngine.canDeleteReport(report)).toBe(false);
    });
  });

  // =========================================================================
  // CLONE
  // =========================================================================

  describe('cloneReport', () => {
    it('should clone with a new name and ID', () => {
      const report = createTestReport();
      const cloned = ReportBuilderEngine.cloneReport(report, 'Cloned Report', 'user-2');

      expect(cloned.id).not.toBe(report.id);
      expect(cloned.name).toBe('Cloned Report');
      expect(cloned.createdBy).toBe('user-2');
    });

    it('should reset version to 1', () => {
      const report = { ...createTestReport(), version: 5 };
      const cloned = ReportBuilderEngine.cloneReport(report, 'Clone', 'user-1');

      expect(cloned.version).toBe(1);
    });

    it('should clear shares', () => {
      const report = {
        ...createTestReport(),
        shares: [
          { userId: 'u1', permission: 'view' as PermissionLevel, sharedAt: '', sharedBy: '' },
        ],
      };
      const cloned = ReportBuilderEngine.cloneReport(report, 'Clone', 'user-1');

      expect(cloned.shares).toEqual([]);
    });

    it('should copy layout from original', () => {
      const report = createTestReport();
      const cloned = ReportBuilderEngine.cloneReport(report, 'Clone', 'user-1');

      expect(cloned.layout).toEqual(report.layout);
    });

    it('should reset isArchived to false', () => {
      const report = { ...createTestReport(), isArchived: true };
      const cloned = ReportBuilderEngine.cloneReport(report, 'Clone', 'user-1');

      expect(cloned.isArchived).toBe(false);
    });

    it('should throw if clone name is empty', () => {
      const report = createTestReport();
      expect(() => ReportBuilderEngine.cloneReport(report, '', 'user-1')).toThrow(
        'Clone name is required'
      );
    });

    it('should trim clone name', () => {
      const report = createTestReport();
      const cloned = ReportBuilderEngine.cloneReport(report, '  Clone  ', 'user-1');

      expect(cloned.name).toBe('Clone');
    });
  });

  // =========================================================================
  // LAYOUT: ROW OPERATIONS
  // =========================================================================

  describe('addRow', () => {
    it('should add a row at the end', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.addRow(layout, 'data');

      expect(updated.rows).toHaveLength(3);
      expect(updated!.rows[2]!.type).toBe('data');
    });

    it('should add a row at a specific index', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.addRow(layout, 'subtotal', 1);

      expect(updated.rows).toHaveLength(3);
      expect(updated!.rows[1]!.type).toBe('subtotal');
    });

    it('should create cells matching column count', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.addRow(layout, 'data');

      expect(updated!.rows[2]!.cells).toHaveLength(layout.columns.length);
    });

    it('should clamp index to array length', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.addRow(layout, 'data', 100);

      expect(updated.rows).toHaveLength(3);
    });

    it('should not mutate original layout', () => {
      const layout = createTestLayout();
      ReportBuilderEngine.addRow(layout, 'data');

      expect(layout.rows).toHaveLength(2);
    });
  });

  describe('removeRow', () => {
    it('should remove a row by ID', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.removeRow(layout, 'row-1');

      expect(updated.rows).toHaveLength(1);
      expect(updated!.rows[0]!.id).toBe('row-2');
    });

    it('should return same layout if row ID not found', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.removeRow(layout, 'nonexistent');

      expect(updated.rows).toHaveLength(2);
    });
  });

  describe('moveRow', () => {
    it('should move a row to a new position', () => {
      const layout = createTestLayout();
      // Move row-1 (index 0) to index 1
      const updated = ReportBuilderEngine.moveRow(layout, 'row-1', 1);

      expect(updated!.rows[0]!.id).toBe('row-2');
      expect(updated!.rows[1]!.id).toBe('row-1');
    });

    it('should return same layout if row ID not found', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.moveRow(layout, 'nonexistent', 1);

      expect(updated!.rows[0]!.id).toBe('row-1');
    });
  });

  // =========================================================================
  // LAYOUT: COLUMN OPERATIONS
  // =========================================================================

  describe('addColumn', () => {
    it('should add a column at the end', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.addColumn(layout, {
        type: 'period',
        header: 'Budget',
        width: 140,
        period: 'budget',
      });

      expect(updated.columns).toHaveLength(3);
      expect(updated!.columns[2]!.header).toBe('Budget');
    });

    it('should add a column at a specific index', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.addColumn(
        layout,
        {
          type: 'period',
          header: 'Forecast',
          width: 140,
          period: 'forecast',
        },
        1
      );

      expect(updated.columns).toHaveLength(3);
      expect(updated!.columns[1]!.header).toBe('Forecast');
    });

    it('should add cells to all rows for the new column', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.addColumn(layout, {
        type: 'period',
        header: 'Budget',
        width: 140,
        period: 'budget',
      });

      for (const row of updated.rows) {
        expect(row.cells).toHaveLength(3);
      }
    });

    it('should add column width to columnWidths', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.addColumn(layout, {
        type: 'period',
        header: 'Budget',
        width: 160,
        period: 'budget',
      });

      const colId = updated!.columns[2]!.id;
      expect(updated.columnWidths[colId]!).toBe(160);
    });
  });

  describe('removeColumn', () => {
    it('should remove a column by ID', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.removeColumn(layout, 'col-value');

      expect(updated.columns).toHaveLength(1);
      expect(updated!.columns[0]!.id).toBe('col-label');
    });

    it('should remove cells from all rows', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.removeColumn(layout, 'col-value');

      for (const row of updated.rows) {
        expect(row.cells).toHaveLength(1);
      }
    });

    it('should remove column width entry', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.removeColumn(layout, 'col-value');

      expect(updated.columnWidths['col-value']).toBeUndefined();
    });

    it('should return same layout if column ID not found', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.removeColumn(layout, 'nonexistent');

      expect(updated.columns).toHaveLength(2);
    });
  });

  // =========================================================================
  // CELL OPERATIONS
  // =========================================================================

  describe('updateCell', () => {
    it('should update a cell content at given row/col', () => {
      const layout = createTestLayout();
      const newContent: CellContent = {
        type: 'text',
        content: { text: 'Updated Text' },
      };
      const updated = ReportBuilderEngine.updateCell(layout, 0, 0, newContent);

      const cell = updated!.rows[0]!.cells[0];
      expect(cell!.type).toBe('text');
      expect((cell!.content as { content: TextCellContent }).content.text).toBe('Updated Text');
    });

    it('should merge cell styles when provided', () => {
      const layout = createTestLayout();
      const newContent: CellContent = {
        type: 'text',
        content: { text: 'Styled' },
      };
      const updated = ReportBuilderEngine.updateCell(layout, 0, 0, newContent, {
        bold: true,
        italic: true,
      });

      const cell = updated!.rows[0]!.cells[0];
      expect(cell!.style.bold).toBe(true);
      expect(cell!.style.italic).toBe(true);
      expect(cell!.style.fontSize).toBe(11); // Default preserved
    });

    it('should throw if row index is out of bounds', () => {
      const layout = createTestLayout();
      const content: CellContent = { type: 'text', content: { text: 'x' } };

      expect(() => ReportBuilderEngine.updateCell(layout, 5, 0, content)).toThrow(
        'Row index 5 out of bounds'
      );
    });

    it('should throw if column index is out of bounds', () => {
      const layout = createTestLayout();
      const content: CellContent = { type: 'text', content: { text: 'x' } };

      expect(() => ReportBuilderEngine.updateCell(layout, 0, 5, content)).toThrow(
        'Column index 5 out of bounds'
      );
    });

    it('should throw if row index is negative', () => {
      const layout = createTestLayout();
      const content: CellContent = { type: 'text', content: { text: 'x' } };

      expect(() => ReportBuilderEngine.updateCell(layout, -1, 0, content)).toThrow('out of bounds');
    });
  });

  // =========================================================================
  // VISIBILITY
  // =========================================================================

  describe('toggleRowVisibility', () => {
    it('should toggle row visibility from true to false', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.toggleRowVisibility(layout, 'row-1');

      expect(updated!.rows[0]!.isVisible).toBe(false);
    });

    it('should toggle row visibility from false to true', () => {
      const layout = {
        ...createTestLayout(),
        rows: createTestLayout().rows.map((r) => ({ ...r, isVisible: false })),
      };
      const updated = ReportBuilderEngine.toggleRowVisibility(layout, 'row-1');

      expect(updated!.rows[0]!.isVisible).toBe(true);
    });
  });

  describe('toggleColumnVisibility', () => {
    it('should toggle column visibility', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.toggleColumnVisibility(layout, 'col-value');

      expect(updated!.columns[1]!.isVisible).toBe(false);
    });
  });

  // =========================================================================
  // DIMENSIONS
  // =========================================================================

  describe('setColumnWidth', () => {
    it('should set column width', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.setColumnWidth(layout, 'col-value', 200);

      expect(updated!.columns[1]!.width).toBe(200);
      expect(updated.columnWidths['col-value']).toBe(200);
    });

    it('should throw for negative width', () => {
      const layout = createTestLayout();
      expect(() => ReportBuilderEngine.setColumnWidth(layout, 'col-value', -10)).toThrow(
        'non-negative'
      );
    });
  });

  describe('setRowHeight', () => {
    it('should set row height', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.setRowHeight(layout, 'row-1', 40);

      expect(updated!.rows[0]!.height).toBe(40);
    });

    it('should throw for negative height', () => {
      const layout = createTestLayout();
      expect(() => ReportBuilderEngine.setRowHeight(layout, 'row-1', -5)).toThrow('non-negative');
    });
  });

  // =========================================================================
  // ROW GROUPING
  // =========================================================================

  describe('createRowGroup', () => {
    it('should set grouping on a row', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.createRowGroup(layout, 'row-1', 0);

      expect(updated!.rows[0]!.grouping).toEqual({
        level: 0,
        parentId: undefined,
        state: 'expanded',
      });
    });

    it('should set grouping with a parent', () => {
      const layout = createTestLayout();
      const updated = ReportBuilderEngine.createRowGroup(layout, 'row-2', 1, 'row-1');

      expect(updated!.rows[1]!.grouping).toEqual({
        level: 1,
        parentId: 'row-1',
        state: 'expanded',
      });
    });
  });

  describe('toggleGroupState', () => {
    it('should toggle from expanded to collapsed', () => {
      const layout = createTestLayout();
      const grouped = ReportBuilderEngine.createRowGroup(layout, 'row-1', 0);
      const toggled = ReportBuilderEngine.toggleGroupState(grouped, 'row-1');

      expect(toggled!.rows[0]!.grouping?.state).toBe('collapsed');
    });

    it('should toggle from collapsed back to expanded', () => {
      const layout = createTestLayout();
      const grouped = ReportBuilderEngine.createRowGroup(layout, 'row-1', 0);
      const toggled = ReportBuilderEngine.toggleGroupState(grouped, 'row-1');
      const toggledBack = ReportBuilderEngine.toggleGroupState(toggled, 'row-1');

      expect(toggledBack!.rows[0]!.grouping?.state).toBe('expanded');
    });

    it('should not affect rows without grouping', () => {
      const layout = createTestLayout();
      const toggled = ReportBuilderEngine.toggleGroupState(layout, 'row-1');

      expect(toggled!.rows[0]!.grouping).toBeUndefined();
    });
  });

  describe('setGroupChildrenVisibility', () => {
    it('should hide children of a grouped row', () => {
      let layout = createTestLayout();
      // Add more rows
      layout = ReportBuilderEngine.addRow(layout, 'data', 2);
      layout = ReportBuilderEngine.createRowGroup(layout, 'row-1', 0);
      // Set row-2 as child of row-1
      layout = {
        ...layout,
        rows: layout.rows.map((r) =>
          r.id === 'row-2'
            ? { ...r, grouping: { level: 1, parentId: 'row-1', state: 'expanded' as const } }
            : r
        ),
      };

      const hidden = ReportBuilderEngine.setGroupChildrenVisibility(layout, 'row-1', false);

      expect(hidden!.rows[1]!.isVisible).toBe(false);
      // Non-children should remain visible
      expect(hidden!.rows[0]!.isVisible).toBe(true);
    });

    it('should show children when visible is true', () => {
      let layout = createTestLayout();
      layout = ReportBuilderEngine.createRowGroup(layout, 'row-1', 0);
      layout = {
        ...layout,
        rows: layout.rows.map((r) =>
          r.id === 'row-2'
            ? {
                ...r,
                grouping: { level: 1, parentId: 'row-1', state: 'expanded' as const },
                isVisible: false,
              }
            : r
        ),
      };

      const shown = ReportBuilderEngine.setGroupChildrenVisibility(layout, 'row-1', true);

      expect(shown!.rows[1]!.isVisible).toBe(true);
    });

    it('should return same layout if row has no grouping', () => {
      const layout = createTestLayout();
      const result = ReportBuilderEngine.setGroupChildrenVisibility(layout, 'row-1', false);

      expect(result).toEqual(layout);
    });
  });

  // =========================================================================
  // FORMATTING: CELL STYLE
  // =========================================================================

  describe('applyCellStyle', () => {
    it('should apply style to a cell', () => {
      const cell = createTextCell('Hello');
      const styled = ReportBuilderEngine.applyCellStyle(cell, { bold: true, textColor: '#FF0000' });

      expect(styled.style.bold).toBe(true);
      expect(styled.style.textColor).toBe('#FF0000');
    });

    it('should preserve existing style properties', () => {
      const cell = createTextCell('Hello');
      const styled = ReportBuilderEngine.applyCellStyle(cell, { bold: true });

      expect(styled.style.fontSize).toBe(11); // Default
      expect(styled.style.italic).toBe(false); // Default
    });
  });

  describe('applyRowStyle', () => {
    it('should apply style to all cells in a row', () => {
      const layout = createTestLayout();
      const styled = ReportBuilderEngine.applyRowStyle(layout, 0, {
        bold: true,
        backgroundColor: '#F0F0F0',
      });

      for (const cell of styled!.rows[0]!.cells) {
        expect(cell.style.bold).toBe(true);
        expect(cell.style.backgroundColor).toBe('#F0F0F0');
      }
    });

    it('should not affect other rows', () => {
      const layout = createTestLayout();
      const styled = ReportBuilderEngine.applyRowStyle(layout, 0, { bold: true });

      expect(styled!.rows[1]!.cells[0]!.style.bold).toBe(false);
    });

    it('should throw for out-of-bounds row index', () => {
      const layout = createTestLayout();
      expect(() => ReportBuilderEngine.applyRowStyle(layout, 10, { bold: true })).toThrow(
        'out of bounds'
      );
    });
  });

  // =========================================================================
  // CONDITIONAL FORMATTING
  // =========================================================================

  describe('addConditionalFormat', () => {
    it('should add conditional format to a metric cell', () => {
      const cell = createMetricCell('Revenue');
      const format: ConditionalFormat = {
        id: 'cf-1',
        condition: 'lt',
        value: 0,
        style: { textColor: '#DC2626' },
      };
      const updated = ReportBuilderEngine.addConditionalFormat(cell, format);

      const content = updated.content as { content: MetricCellContent };
      expect(content.content.conditionalFormats).toHaveLength(1);
      expect(content!.content.conditionalFormats![0]!.condition).toBe('lt');
    });

    it('should add conditional format to a formula cell', () => {
      const cell = createFormulaCell('A1/A2');
      const format: ConditionalFormat = {
        id: 'cf-2',
        condition: 'gt',
        value: 0.1,
        style: { textColor: '#16A34A' },
      };
      const updated = ReportBuilderEngine.addConditionalFormat(cell, format);

      const content = updated.content as { content: FormulaCellContent };
      expect(content.content.conditionalFormats).toHaveLength(1);
    });

    it('should throw for non-metric/formula cells', () => {
      const cell = createTextCell('Hello');
      const format: ConditionalFormat = {
        id: 'cf-3',
        condition: 'gt',
        value: 0,
        style: {},
      };

      expect(() => ReportBuilderEngine.addConditionalFormat(cell, format)).toThrow(
        'Conditional formatting only applies to metric or formula cells'
      );
    });
  });

  describe('evaluateConditionalFormats', () => {
    const formats: ConditionalFormat[] = [
      {
        id: 'cf-pos',
        condition: 'gt',
        value: 0,
        style: { textColor: '#16A34A' },
        label: 'Positive',
      },
      {
        id: 'cf-neg',
        condition: 'lt',
        value: 0,
        style: { textColor: '#DC2626' },
        label: 'Negative',
      },
      { id: 'cf-zero', condition: 'eq', value: 0, style: { textColor: '#6B7280' }, label: 'Zero' },
    ];

    it('should match positive value with gt condition', () => {
      const style = ReportBuilderEngine.evaluateConditionalFormats(formats, 500);
      expect(style?.textColor).toBe('#16A34A');
    });

    it('should match negative value with lt condition', () => {
      const style = ReportBuilderEngine.evaluateConditionalFormats(formats, -200);
      expect(style?.textColor).toBe('#DC2626');
    });

    it('should match zero with eq condition', () => {
      const style = ReportBuilderEngine.evaluateConditionalFormats(formats, 0);
      expect(style?.textColor).toBe('#6B7280');
    });

    it('should return first matching format', () => {
      const overlapping: ConditionalFormat[] = [
        { id: 'cf-1', condition: 'gt', value: 100, style: { textColor: '#FF0000' } },
        { id: 'cf-2', condition: 'gt', value: 50, style: { textColor: '#00FF00' } },
      ];
      const style = ReportBuilderEngine.evaluateConditionalFormats(overlapping, 200);
      expect(style?.textColor).toBe('#FF0000');
    });

    it('should return null if no format matches', () => {
      const narrowFormats: ConditionalFormat[] = [
        { id: 'cf-high', condition: 'gt', value: 1000, style: { textColor: '#16A34A' } },
        { id: 'cf-low', condition: 'lt', value: -1000, style: { textColor: '#DC2626' } },
      ];
      const style = ReportBuilderEngine.evaluateConditionalFormats(narrowFormats, 500);
      expect(style).toBeNull();
    });

    it('should handle empty formats array', () => {
      const style = ReportBuilderEngine.evaluateConditionalFormats([], 100);
      expect(style).toBeNull();
    });

    it('should handle gte condition', () => {
      const gteFormats: ConditionalFormat[] = [
        { id: 'cf-gte', condition: 'gte', value: 10, style: { textColor: '#00FF00' } },
      ];
      expect(ReportBuilderEngine.evaluateConditionalFormats(gteFormats, 10)?.textColor).toBe(
        '#00FF00'
      );
      expect(ReportBuilderEngine.evaluateConditionalFormats(gteFormats, 9)).toBeNull();
    });

    it('should handle lte condition', () => {
      const lteFormats: ConditionalFormat[] = [
        { id: 'cf-lte', condition: 'lte', value: 0, style: { textColor: '#FF0000' } },
      ];
      expect(ReportBuilderEngine.evaluateConditionalFormats(lteFormats, 0)?.textColor).toBe(
        '#FF0000'
      );
      expect(ReportBuilderEngine.evaluateConditionalFormats(lteFormats, 1)).toBeNull();
    });

    it('should handle neq condition', () => {
      const neqFormats: ConditionalFormat[] = [
        { id: 'cf-neq', condition: 'neq', value: 0, style: { textColor: '#FF0000' } },
      ];
      expect(ReportBuilderEngine.evaluateConditionalFormats(neqFormats, 5)?.textColor).toBe(
        '#FF0000'
      );
      expect(ReportBuilderEngine.evaluateConditionalFormats(neqFormats, 0)).toBeNull();
    });
  });

  // =========================================================================
  // NUMBER FORMATTING
  // =========================================================================

  describe('formatNumber', () => {
    it('should format currency with 2 decimals', () => {
      expect(ReportBuilderEngine.formatNumber(1234.56, 'currency')).toBe('$1,234.56');
    });

    it('should format negative currency with parentheses', () => {
      expect(ReportBuilderEngine.formatNumber(-1234.56, 'currency')).toBe('($1,234.56)');
    });

    it('should format zero as currency', () => {
      expect(ReportBuilderEngine.formatNumber(0, 'currency')).toBe('$0.00');
    });

    it('should format large currency with commas', () => {
      expect(ReportBuilderEngine.formatNumber(1234567, 'currency')).toBe('$1,234,567.00');
    });

    it('should format percentage', () => {
      expect(ReportBuilderEngine.formatNumber(0.153, 'percentage', 1)).toBe('15.3%');
    });

    it('should format negative percentage', () => {
      expect(ReportBuilderEngine.formatNumber(-0.021, 'percentage', 1)).toBe('-2.1%');
    });

    it('should format compact billions', () => {
      expect(ReportBuilderEngine.formatNumber(2_500_000_000, 'compact')).toBe('$2.5B');
    });

    it('should format compact millions', () => {
      expect(ReportBuilderEngine.formatNumber(3_500_000, 'compact')).toBe('$3.5M');
    });

    it('should format compact thousands', () => {
      expect(ReportBuilderEngine.formatNumber(45_000, 'compact')).toBe('$45.0K');
    });

    it('should format compact small numbers', () => {
      expect(ReportBuilderEngine.formatNumber(500, 'compact')).toBe('$500.00');
    });

    it('should format compact negative values with parentheses', () => {
      expect(ReportBuilderEngine.formatNumber(-3_500_000, 'compact')).toBe('($3.5M)');
    });

    it('should format whole numbers', () => {
      const result = ReportBuilderEngine.formatNumber(1234.789, 'wholenumber');
      expect(result).toContain('1,235');
    });

    it('should format decimals', () => {
      expect(ReportBuilderEngine.formatNumber(3.14159, 'decimal', 2)).toBe('3.14');
    });

    it('should handle NaN', () => {
      expect(ReportBuilderEngine.formatNumber(NaN, 'currency')).toBe('#N/A');
    });

    it('should handle Infinity', () => {
      expect(ReportBuilderEngine.formatNumber(Infinity, 'currency')).toBe('#N/A');
    });

    it('should handle custom decimal places', () => {
      expect(ReportBuilderEngine.formatNumber(1234.5, 'currency', 0)).toBe('$1,235');
    });
  });

  // =========================================================================
  // SHARING
  // =========================================================================

  describe('shareReport', () => {
    it('should add a new share', () => {
      const report = createTestReport();
      const shared = ReportBuilderEngine.shareReport(report, 'user-2', 'view', 'user-1');

      expect(shared.shares).toHaveLength(1);
      expect(shared!.shares[0]!.userId).toBe('user-2');
      expect(shared!.shares[0]!.permission).toBe('view');
      expect(shared!.shares[0]!.sharedBy).toBe('user-1');
    });

    it('should update existing share permission', () => {
      let report = createTestReport();
      report = ReportBuilderEngine.shareReport(report, 'user-2', 'view', 'user-1');
      const updated = ReportBuilderEngine.shareReport(report, 'user-2', 'edit', 'user-1');

      expect(updated.shares).toHaveLength(1);
      expect(updated!.shares[0]!.permission).toBe('edit');
    });

    it('should not mutate original', () => {
      const report = createTestReport();
      ReportBuilderEngine.shareReport(report, 'user-2', 'view', 'user-1');

      expect(report.shares).toHaveLength(0);
    });
  });

  describe('unshareReport', () => {
    it('should remove a share by userId', () => {
      let report = createTestReport();
      report = ReportBuilderEngine.shareReport(report, 'user-2', 'view', 'user-1');
      const unshared = ReportBuilderEngine.unshareReport(report, 'user-2');

      expect(unshared.shares).toHaveLength(0);
    });

    it('should not affect other shares', () => {
      let report = createTestReport();
      report = ReportBuilderEngine.shareReport(report, 'user-2', 'view', 'user-1');
      report = ReportBuilderEngine.shareReport(report, 'user-3', 'edit', 'user-1');
      const unshared = ReportBuilderEngine.unshareReport(report, 'user-2');

      expect(unshared.shares).toHaveLength(1);
      expect(unshared!.shares[0]!.userId).toBe('user-3');
    });
  });

  describe('getUserPermission', () => {
    it('should return admin for report creator', () => {
      const report = createTestReport();
      expect(ReportBuilderEngine.getUserPermission(report, 'user-1')).toBe('admin');
    });

    it('should return assigned permission for shared user', () => {
      let report = createTestReport();
      report = ReportBuilderEngine.shareReport(report, 'user-2', 'edit', 'user-1');

      expect(ReportBuilderEngine.getUserPermission(report, 'user-2')).toBe('edit');
    });

    it('should return null for unshared user', () => {
      const report = createTestReport();
      expect(ReportBuilderEngine.getUserPermission(report, 'unknown')).toBeNull();
    });
  });

  // =========================================================================
  // PDF EXPORT
  // =========================================================================

  describe('generatePDFMetadata', () => {
    it('should generate metadata with defaults', () => {
      const report = createTestReport();
      const meta = ReportBuilderEngine.generatePDFMetadata(report);

      expect(meta.reportId).toBe(report.id);
      expect(meta.title).toBe(report.name);
      expect(meta.orientation).toBe('landscape');
      expect(meta.pageSize).toBe('letter');
      expect(meta.showPageNumbers).toBe(true);
      expect(meta.showTimestamp).toBe(true);
    });

    it('should use description as subtitle', () => {
      const report = createTestReport();
      const meta = ReportBuilderEngine.generatePDFMetadata(report);

      expect(meta.subtitle).toBe('A test report');
    });

    it('should allow overriding options', () => {
      const report = createTestReport();
      const meta = ReportBuilderEngine.generatePDFMetadata(report, {
        orientation: 'portrait',
        pageSize: 'a4',
        watermark: 'DRAFT',
      });

      expect(meta.orientation).toBe('portrait');
      expect(meta.pageSize).toBe('a4');
      expect(meta.watermark).toBe('DRAFT');
    });
  });

  // =========================================================================
  // IMPORT / EXPORT
  // =========================================================================

  describe('exportLayout and importLayout', () => {
    it('should export and re-import a layout', () => {
      const layout = createTestLayout();
      const json = ReportBuilderEngine.exportLayout(layout);
      const imported = ReportBuilderEngine.importLayout(json);

      expect(imported.rows).toHaveLength(layout.rows.length);
      expect(imported.columns).toHaveLength(layout.columns.length);
      expect(imported.defaultRowHeight).toBe(layout.defaultRowHeight);
    });

    it('should produce valid JSON', () => {
      const layout = createTestLayout();
      const json = ReportBuilderEngine.exportLayout(layout);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should throw on invalid JSON', () => {
      expect(() => ReportBuilderEngine.importLayout('not json')).toThrow('Failed to import layout');
    });

    it('should throw on invalid layout structure', () => {
      expect(() => ReportBuilderEngine.importLayout('{"foo": "bar"}')).toThrow(
        'Invalid layout structure'
      );
    });

    it('should throw on missing required fields', () => {
      const incomplete = JSON.stringify({ rows: [], columns: [] });
      expect(() => ReportBuilderEngine.importLayout(incomplete)).toThrow(
        'Invalid layout structure'
      );
    });
  });

  // =========================================================================
  // VALIDATION
  // =========================================================================

  describe('validateReport', () => {
    it('should validate a valid report', () => {
      const report = createTestReport();
      const result = ReportBuilderEngine.validateReport(report);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for empty name', () => {
      const report = { ...createTestReport(), name: '  ' };
      const result = ReportBuilderEngine.validateReport(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Report name is required');
    });

    it('should fail for no rows', () => {
      const report = { ...createTestReport(), layout: { ...createTestLayout(), rows: [] } };
      const result = ReportBuilderEngine.validateReport(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Report must have at least one row');
    });

    it('should fail for no columns', () => {
      const report = { ...createTestReport(), layout: { ...createTestLayout(), columns: [] } };
      const result = ReportBuilderEngine.validateReport(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Report must have at least one column');
    });

    it('should fail when row cell count mismatches column count', () => {
      const report = createTestReport();
      // Add an extra cell to first row
      report!.layout.rows[0]!.cells.push(createTextCell('extra'));
      const result = ReportBuilderEngine.validateReport(report);

      expect(result.valid).toBe(false);
      expect(result.errors[0]!).toContain('Row 0 has 3 cells but expected 2');
    });

    it('should fail for formula cell with empty expression', () => {
      const report = createTestReport();
      report!.layout.rows[0]!.cells[0] = {
        ...report!.layout.rows[0]!.cells[0]!,
        type: 'formula',
        content: {
          type: 'formula',
          content: { expression: '  ', format: 'currency', decimals: 0 },
        },
      };
      const result = ReportBuilderEngine.validateReport(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Formula cell has empty expression');
    });

    it('should collect multiple errors', () => {
      const report = {
        ...createTestReport(),
        name: '',
        layout: { ...createTestLayout(), rows: [], columns: [] },
      };
      const result = ReportBuilderEngine.validateReport(report);

      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  describe('getTemplateLayout', () => {
    const templates: TemplateType[] = [
      'income_statement',
      'balance_sheet',
      'cash_flow',
      'budget_vs_actual',
      'variance_analysis',
      'board_pack',
      'executive_summary',
      'custom',
    ];

    it.each(templates)('should return a valid layout for template: %s', (template) => {
      const layout = ReportBuilderEngine.getTemplateLayout(template);

      expect(layout).toBeDefined();
      expect(layout.defaultRowHeight).toBeGreaterThan(0);
      expect(layout.columnWidths).toBeDefined();
    });

    it('should create income statement with 4 columns', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('income_statement');
      expect(layout.columns).toHaveLength(4);
      expect(layout.rows.length).toBeGreaterThan(10);
    });

    it('should create balance sheet with 3 columns', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('balance_sheet');
      expect(layout.columns).toHaveLength(3);
    });

    it('should create cash flow with 3 columns', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('cash_flow');
      expect(layout.columns).toHaveLength(3);
    });

    it('should create budget vs actual with 5 columns', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('budget_vs_actual');
      expect(layout.columns).toHaveLength(5);
    });

    it('should create variance analysis with 6 columns', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('variance_analysis');
      expect(layout.columns).toHaveLength(6);
    });

    it('should create board pack with 3 columns', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('board_pack');
      expect(layout.columns).toHaveLength(3);
    });

    it('should create executive summary with 3 columns', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('executive_summary');
      expect(layout.columns).toHaveLength(3);
    });

    it('should create custom as empty layout', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('custom');
      expect(layout.rows).toHaveLength(0);
      expect(layout.columns).toHaveLength(0);
    });

    it('should set frozen panes for all templates', () => {
      for (const template of templates) {
        const layout = ReportBuilderEngine.getTemplateLayout(template);
        expect(layout.frozenColumns).toBeGreaterThanOrEqual(0);
        expect(layout.frozenRows).toBeGreaterThanOrEqual(0);
      }
    });

    it('should have first column as label type in standard templates', () => {
      const standardTemplates: TemplateType[] = [
        'income_statement',
        'balance_sheet',
        'cash_flow',
        'budget_vs_actual',
      ];
      for (const template of standardTemplates) {
        const layout = ReportBuilderEngine.getTemplateLayout(template);
        expect(layout!.columns[0]!.type).toBe('label');
      }
    });

    it('should have period columns in income statement', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('income_statement');
      const periodCols = layout.columns.filter((c) => c.type === 'period');
      expect(periodCols.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return 8 templates', () => {
      const templates = ReportBuilderEngine.getAvailableTemplates();
      expect(templates).toHaveLength(8);
    });

    it('should have name and description for each template', () => {
      const templates = ReportBuilderEngine.getAvailableTemplates();
      for (const t of templates) {
        expect(t.name).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.type).toBeTruthy();
      }
    });

    it('should include all template types', () => {
      const templates = ReportBuilderEngine.getAvailableTemplates();
      const types = templates.map((t) => t.type);
      expect(types).toContain('income_statement');
      expect(types).toContain('balance_sheet');
      expect(types).toContain('cash_flow');
      expect(types).toContain('budget_vs_actual');
      expect(types).toContain('variance_analysis');
      expect(types).toContain('board_pack');
      expect(types).toContain('executive_summary');
      expect(types).toContain('custom');
    });
  });

  // =========================================================================
  // AGGREGATE QUERIES
  // =========================================================================

  describe('getVisibleRows', () => {
    it('should return only visible rows', () => {
      const layout = createTestLayout();
      layout!.rows[1]!.isVisible = false;
      const visible = ReportBuilderEngine.getVisibleRows(layout);

      expect(visible).toHaveLength(1);
      expect(visible![0]!.id).toBe('row-1');
    });

    it('should return all rows when all visible', () => {
      const layout = createTestLayout();
      const visible = ReportBuilderEngine.getVisibleRows(layout);

      expect(visible).toHaveLength(2);
    });
  });

  describe('getVisibleColumns', () => {
    it('should return only visible columns', () => {
      const layout = createTestLayout();
      layout!.columns[1]!.isVisible = false;
      const visible = ReportBuilderEngine.getVisibleColumns(layout);

      expect(visible).toHaveLength(1);
      expect(visible![0]!.id).toBe('col-label');
    });
  });

  describe('getRowById', () => {
    it('should find a row by ID', () => {
      const layout = createTestLayout();
      const row = ReportBuilderEngine.getRowById(layout, 'row-1');

      expect(row).toBeDefined();
      expect(row?.type).toBe('header');
    });

    it('should return undefined for missing ID', () => {
      const layout = createTestLayout();
      const row = ReportBuilderEngine.getRowById(layout, 'nonexistent');

      expect(row).toBeUndefined();
    });
  });

  describe('getColumnById', () => {
    it('should find a column by ID', () => {
      const layout = createTestLayout();
      const col = ReportBuilderEngine.getColumnById(layout, 'col-value');

      expect(col).toBeDefined();
      expect(col?.header).toBe('Actual');
    });

    it('should return undefined for missing ID', () => {
      const layout = createTestLayout();
      const col = ReportBuilderEngine.getColumnById(layout, 'nonexistent');

      expect(col).toBeUndefined();
    });
  });

  describe('countCellsByType', () => {
    it('should count cells by type', () => {
      const layout = createTestLayout();
      const counts = ReportBuilderEngine.countCellsByType(layout);

      expect(counts.text).toBe(2); // 2 label cells
      expect(counts.metric).toBe(2); // 2 value cells
      expect(counts.formula).toBe(0);
      expect(counts.chart).toBe(0);
      expect(counts.table).toBe(0);
    });

    it('should handle empty layout', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('custom');
      const counts = ReportBuilderEngine.countCellsByType(layout);

      expect(counts.text).toBe(0);
      expect(counts.metric).toBe(0);
    });

    it('should count mixed cell types', () => {
      const layout = createTestLayout();
      layout!.rows[0]!.cells[1] = createFormulaCell('A1/B1');
      layout!.rows[1]!.cells[1] = {
        id: 'chart-1',
        type: 'chart',
        content: {
          type: 'chart',
          content: { chartId: 'c1', chartType: 'bar', title: 'Chart', width: 400, height: 300 },
        },
        style: createDefaultStyle(),
        colspan: 1,
        rowspan: 1,
        isVisible: true,
      };
      const counts = ReportBuilderEngine.countCellsByType(layout);

      expect(counts.formula).toBe(1);
      expect(counts.chart).toBe(1);
      expect(counts.metric).toBe(0);
      expect(counts.text).toBe(2);
    });
  });

  // =========================================================================
  // REPORT CREATION WITH TEMPLATES
  // =========================================================================

  describe('createReport with templates', () => {
    it('should create report from income_statement template', () => {
      const report = ReportBuilderEngine.createReport('IS Report', 'income_statement', 'user-1');

      expect(report.template).toBe('income_statement');
      expect(report.layout.columns).toHaveLength(4);
      expect(report.layout.rows.length).toBeGreaterThan(10);
    });

    it('should create report from budget_vs_actual template', () => {
      const report = ReportBuilderEngine.createReport('BVA Report', 'budget_vs_actual', 'user-1');

      expect(report.template).toBe('budget_vs_actual');
      expect(report.layout.columns).toHaveLength(5);
    });

    it('should create report from custom template with empty layout', () => {
      const report = ReportBuilderEngine.createReport('Custom Report', 'custom', 'user-1');

      expect(report.template).toBe('custom');
      expect(report.layout.rows).toHaveLength(0);
      expect(report.layout.columns).toHaveLength(0);
    });
  });

  // =========================================================================
  // DATA BINDING — buildBindingKey
  // =========================================================================

  describe('buildBindingKey', () => {
    it('should build key from coords and measure only', () => {
      const binding: CellBinding = { coords: 'Revenue.Q1', measure: 'amount' };
      expect(ReportBuilderEngine.buildBindingKey(binding)).toBe('Revenue.Q1.amount');
    });

    it('should include entityId when present', () => {
      const binding: CellBinding = { coords: 'Revenue.Q1', measure: 'amount', entityId: 'ent-1' };
      expect(ReportBuilderEngine.buildBindingKey(binding)).toBe('Revenue.Q1.amount.ent-1');
    });

    it('should include all optional parts', () => {
      const binding: CellBinding = {
        coords: 'Revenue.Q1',
        measure: 'amount',
        entityId: 'ent-1',
        scenarioId: 'sc-actual',
        periodId: 'p-2024',
      };
      expect(ReportBuilderEngine.buildBindingKey(binding)).toBe(
        'Revenue.Q1.amount.ent-1.sc-actual.p-2024'
      );
    });
  });

  // =========================================================================
  // DATA BINDING — resolveCellValue
  // =========================================================================

  describe('resolveCellValue', () => {
    const cubeData: CubeData = {
      'Revenue.Q1.amount': 50000,
      'Expenses.Q1.amount': 30000,
      'Revenue.Q1.amount.ent-1.sc-actual': 75000,
    };

    it('should resolve a metric cell with matching cube data', () => {
      const cell = createMetricCell('Revenue.Q1', 'amount');
      const resolved = ReportBuilderEngine.resolveCellValue(cell, cubeData);

      expect(resolved.rawValue).toBe(50000);
      expect(resolved.formattedValue).toContain('50,000');
      expect(resolved.binding).toEqual({ coords: 'Revenue.Q1', measure: 'amount' });
    });

    it('should return dash for missing cube data', () => {
      const cell = createMetricCell('Missing.Q1', 'amount');
      const resolved = ReportBuilderEngine.resolveCellValue(cell, cubeData);

      expect(resolved.rawValue).toBeNull();
      expect(resolved.formattedValue).toBe('—');
    });

    it('should resolve a text cell directly', () => {
      const cell = createTextCell('Revenue');
      const resolved = ReportBuilderEngine.resolveCellValue(cell, cubeData);

      expect(resolved.rawValue).toBe('Revenue');
      expect(resolved.formattedValue).toBe('Revenue');
      expect(resolved.binding).toBeNull();
    });

    it('should resolve a metric cell with full binding (entity, scenario, period)', () => {
      const cell: ReportCell = {
        id: 'cell-full',
        type: 'metric',
        content: {
          type: 'metric',
          content: {
            coords: 'Revenue.Q1',
            measure: 'amount',
            entityId: 'ent-1',
            scenarioId: 'sc-actual',
            format: 'currency',
            decimals: 0,
            showSign: false,
          },
        },
        style: createDefaultStyle(),
        colspan: 1,
        rowspan: 1,
        isVisible: true,
      };
      const resolved = ReportBuilderEngine.resolveCellValue(cell, cubeData);

      expect(resolved.rawValue).toBe(75000);
      expect(resolved.binding?.entityId).toBe('ent-1');
      expect(resolved.binding?.scenarioId).toBe('sc-actual');
    });

    it('should handle non-numeric cube data as string', () => {
      const stringCubeData: CubeData = { 'Status.Q1.value': 'On Track' };
      const cell: ReportCell = {
        id: 'cell-str',
        type: 'metric',
        content: {
          type: 'metric',
          content: {
            coords: 'Status.Q1',
            measure: 'value',
            format: 'decimal',
            decimals: 0,
            showSign: false,
          },
        },
        style: createDefaultStyle(),
        colspan: 1,
        rowspan: 1,
        isVisible: true,
      };
      const resolved = ReportBuilderEngine.resolveCellValue(cell, stringCubeData);

      expect(resolved.rawValue).toBe('On Track');
      expect(resolved.formattedValue).toBe('On Track');
    });

    it('should resolve formula cell with label', () => {
      const cell = createFormulaCell('A1/B1');
      const resolved = ReportBuilderEngine.resolveCellValue(cell, cubeData);

      expect(resolved.formattedValue).toBe('A1/B1');
    });

    it('should resolve chart cell with title', () => {
      const cell: ReportCell = {
        id: 'chart-1',
        type: 'chart',
        content: {
          type: 'chart',
          content: {
            chartId: 'c1',
            chartType: 'bar',
            title: 'Revenue Trend',
            width: 400,
            height: 300,
          },
        },
        style: createDefaultStyle(),
        colspan: 1,
        rowspan: 1,
        isVisible: true,
      };
      const resolved = ReportBuilderEngine.resolveCellValue(cell, cubeData);

      expect(resolved.formattedValue).toBe('[Chart: Revenue Trend]');
    });

    it('should resolve table cell', () => {
      const cell: ReportCell = {
        id: 'table-1',
        type: 'table',
        content: {
          type: 'table',
          content: { tableId: 't1', maxRows: 10, showHeaders: true, striped: false },
        },
        style: createDefaultStyle(),
        colspan: 1,
        rowspan: 1,
        isVisible: true,
      };
      const resolved = ReportBuilderEngine.resolveCellValue(cell, cubeData);

      expect(resolved.formattedValue).toBe('[Table]');
    });
  });

  // =========================================================================
  // DATA BINDING — resolveLayout
  // =========================================================================

  describe('resolveLayout', () => {
    it('should resolve all cells in a layout', () => {
      const layout = createTestLayout();
      const cubeData: CubeData = {
        'Revenue.Q1.amount': 100000,
        'Expenses.Q1.amount': 60000,
      };

      const resolved = ReportBuilderEngine.resolveLayout(layout, cubeData);

      expect(resolved).toHaveLength(2);
      expect(resolved[0]!).toHaveLength(2);
      expect(resolved![0]![1!].rawValue).toBe(100000);
      expect(resolved![1]![1!].rawValue).toBe(60000);
    });

    it('should handle empty layout', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('custom');
      const resolved = ReportBuilderEngine.resolveLayout(layout, {});

      expect(resolved).toHaveLength(0);
    });
  });

  // =========================================================================
  // DATA BINDING — buildMetricKey
  // =========================================================================

  describe('buildMetricKey', () => {
    it('should build key from MetricCellContent', () => {
      const content: MetricCellContent = {
        coords: 'Revenue.Q1',
        measure: 'amount',
        format: 'currency',
        decimals: 0,
        showSign: false,
      };
      expect(ReportBuilderEngine.buildMetricKey(content)).toBe('Revenue.Q1.amount');
    });

    it('should include optional fields', () => {
      const content: MetricCellContent = {
        coords: 'Revenue.Q1',
        measure: 'amount',
        entityId: 'ent-1',
        scenarioId: 'sc-actual',
        format: 'currency',
        decimals: 0,
        showSign: false,
      };
      expect(ReportBuilderEngine.buildMetricKey(content)).toBe('Revenue.Q1.amount.ent-1.sc-actual');
    });
  });

  // =========================================================================
  // SUBTOTAL / TOTAL CALCULATIONS
  // =========================================================================

  describe('calculateColumnSum', () => {
    it('should sum numeric values in a column range', () => {
      const resolved: ResolvedCell[][] = [
        [
          { cellId: 'c1', rawValue: 'Revenue', formattedValue: 'Revenue', binding: null },
          { cellId: 'c2', rawValue: 100000, formattedValue: '$100,000', binding: null },
        ],
        [
          { cellId: 'c3', rawValue: 'COGS', formattedValue: 'COGS', binding: null },
          { cellId: 'c4', rawValue: 40000, formattedValue: '$40,000', binding: null },
        ],
      ];

      const sum = ReportBuilderEngine.calculateColumnSum(resolved, 1, 0, 1);
      expect(sum).toBe(140000);
    });

    it('should skip null and non-numeric values', () => {
      const resolved: ResolvedCell[][] = [
        [
          { cellId: 'c1', rawValue: 'Label', formattedValue: 'Label', binding: null },
          { cellId: 'c2', rawValue: null, formattedValue: '—', binding: null },
        ],
        [
          { cellId: 'c3', rawValue: 'Total', formattedValue: 'Total', binding: null },
          { cellId: 'c4', rawValue: 50000, formattedValue: '$50,000', binding: null },
        ],
      ];

      const sum = ReportBuilderEngine.calculateColumnSum(resolved, 1, 0, 1);
      expect(sum).toBe(50000);
    });

    it('should handle empty range', () => {
      const resolved: ResolvedCell[][] = [];
      const sum = ReportBuilderEngine.calculateColumnSum(resolved, 0, 0, 5);
      expect(sum).toBe(0);
    });

    it('should clamp endRow to array length', () => {
      const resolved: ResolvedCell[][] = [
        [{ cellId: 'c1', rawValue: 100, formattedValue: '100', binding: null }],
      ];
      const sum = ReportBuilderEngine.calculateColumnSum(resolved, 0, 0, 100);
      expect(sum).toBe(100);
    });

    it('sums fractional values exactly (no IEEE-754 drift)', () => {
      // 0.1 + 0.2 + 0.3 is 0.6000000000000001 in floats; exact decimal → 0.6.
      const resolved: ResolvedCell[][] = [
        [{ cellId: 'a', rawValue: 0.1, formattedValue: '0.1', binding: null }],
        [{ cellId: 'b', rawValue: 0.2, formattedValue: '0.2', binding: null }],
        [{ cellId: 'c', rawValue: 0.3, formattedValue: '0.3', binding: null }],
      ];
      const sum = ReportBuilderEngine.calculateColumnSum(resolved, 0, 0, 2);
      expect(sum).toBe(0.6);
    });
  });

  describe('identifySectionRanges', () => {
    it('should identify data, subtotal, and total sections', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('income_statement');
      const sections = ReportBuilderEngine.identifySectionRanges(layout);

      expect(sections.length).toBeGreaterThan(0);
      const types = sections.map((s) => s.type);
      expect(types).toContain('data');
      expect(types).toContain('subtotal');
      expect(types).toContain('total');
    });

    it('should return contiguous ranges', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('income_statement');
      const sections = ReportBuilderEngine.identifySectionRanges(layout);

      for (const section of sections) {
        expect(section.startIndex).toBeLessThanOrEqual(section.endIndex);
      }
    });
  });

  describe('autoPopulateTotals', () => {
    it('should populate subtotal rows with summed data', () => {
      const layout = createTestLayout();
      const cubeData: CubeData = {
        'Revenue.Q1.amount': 100000,
        'Expenses.Q1.amount': 60000,
      };

      const result = ReportBuilderEngine.autoPopulateTotals(layout, cubeData);
      expect(result).toBeDefined();
      expect(result.rows).toHaveLength(layout.rows.length);
    });
  });

  // =========================================================================
  // FORMULA EVALUATION
  // =========================================================================

  describe('parseFormulaReferences', () => {
    it('should extract cell references from expression', () => {
      const refs = ReportBuilderEngine.parseFormulaReferences('A1+B2*C3');
      expect(refs).toContain('A1');
      expect(refs).toContain('B2');
      expect(refs).toContain('C3');
    });

    it('should deduplicate references', () => {
      const refs = ReportBuilderEngine.parseFormulaReferences('A1+A1+B1');
      expect(refs).toHaveLength(2);
      expect(refs).toContain('A1');
      expect(refs).toContain('B1');
    });

    it('should handle multi-letter columns', () => {
      const refs = ReportBuilderEngine.parseFormulaReferences('AA1+AB2');
      expect(refs).toContain('AA1');
      expect(refs).toContain('AB2');
    });

    it('should return empty array for expressions without references', () => {
      const refs = ReportBuilderEngine.parseFormulaReferences('100+200');
      expect(refs).toEqual([]);
    });
  });

  describe('evaluateFormula', () => {
    it('should evaluate simple addition', () => {
      const result = ReportBuilderEngine.evaluateFormula('A1+B1', { A1: 100, B1: 200 });
      expect(result).toBe(300);
    });

    it('should evaluate complex expression with precedence', () => {
      const result = ReportBuilderEngine.evaluateFormula('A1+B1*C1', { A1: 100, B1: 200, C1: 3 });
      expect(result).toBe(700); // 100 + (200 * 3)
    });

    it('should evaluate expression with parentheses', () => {
      const result = ReportBuilderEngine.evaluateFormula('(A1+B1)*C1', { A1: 100, B1: 200, C1: 3 });
      expect(result).toBe(900); // (100 + 200) * 3
    });

    it('should evaluate division', () => {
      const result = ReportBuilderEngine.evaluateFormula('A1/B1', { A1: 1000, B1: 4 });
      expect(result).toBe(250);
    });

    it('should throw on division by zero', () => {
      expect(() => ReportBuilderEngine.evaluateFormula('A1/B1', { A1: 100, B1: 0 })).toThrow(
        'Division by zero'
      );
    });

    it('should throw on missing cell reference', () => {
      expect(() => ReportBuilderEngine.evaluateFormula('A1+B1', { A1: 100 })).toThrow(
        'Missing value for cell reference: B1'
      );
    });

    it('should throw on non-finite cell value', () => {
      expect(() => ReportBuilderEngine.evaluateFormula('A1+B1', { A1: Infinity, B1: 100 })).toThrow(
        'Non-finite value'
      );
    });

    it('should evaluate percentage formula', () => {
      const result = ReportBuilderEngine.evaluateFormula('(A1-B1)/B1*100', { A1: 120, B1: 100 });
      expect(result).toBe(20);
    });
  });

  describe('safeEvaluate', () => {
    it('should evaluate simple arithmetic', () => {
      expect(ReportBuilderEngine.safeEvaluate('2+3')).toBe(5);
    });

    it('should handle operator precedence', () => {
      expect(ReportBuilderEngine.safeEvaluate('2+3*4')).toBe(14);
    });

    it('should handle parentheses', () => {
      expect(ReportBuilderEngine.safeEvaluate('(2+3)*4')).toBe(20);
    });

    it('should handle negative numbers', () => {
      expect(ReportBuilderEngine.safeEvaluate('-5+3')).toBe(-2);
    });

    it('should handle decimals', () => {
      expect(ReportBuilderEngine.safeEvaluate('1.5*2')).toBe(3);
    });

    it('should handle nested parentheses', () => {
      expect(ReportBuilderEngine.safeEvaluate('((2+3)*2)')).toBe(10);
    });

    it('should throw on missing closing parenthesis', () => {
      expect(() => ReportBuilderEngine.safeEvaluate('(2+3')).toThrow('Missing closing parenthesis');
    });

    it('should throw on empty expression', () => {
      expect(() => ReportBuilderEngine.safeEvaluate('')).toThrow();
    });
  });

  // =========================================================================
  // CIRCULAR REFERENCE DETECTION
  // =========================================================================

  describe('detectCircularReferences', () => {
    it('should return no circular refs for non-formula layouts', () => {
      const layout = createTestLayout();
      const deps = ReportBuilderEngine.detectCircularReferences(layout);

      const circular = deps.filter((d) => d.hasCircularRef);
      expect(circular).toHaveLength(0);
    });

    it('should detect circular references in formula cells', () => {
      const layout = createTestLayout();
      // Create a circular reference: A1 references B1, B1 references A1
      layout!.rows[0]!.cells[0] = {
        id: 'cell-A1',
        type: 'formula',
        content: {
          type: 'formula',
          content: { expression: 'B1', format: 'currency', decimals: 0 },
        },
        style: createDefaultStyle(),
        colspan: 1,
        rowspan: 1,
        isVisible: true,
      };
      layout!.rows[0]!.cells[1] = {
        id: 'cell-B1',
        type: 'formula',
        content: {
          type: 'formula',
          content: { expression: 'A1', format: 'currency', decimals: 0 },
        },
        style: createDefaultStyle(),
        colspan: 1,
        rowspan: 1,
        isVisible: true,
      };

      const deps = ReportBuilderEngine.detectCircularReferences(layout);
      const circular = deps.filter((d) => d.hasCircularRef);
      expect(circular.length).toBeGreaterThan(0);
    });

    it('should handle formulas without circular references', () => {
      const layout = createTestLayout();
      layout!.rows[0]!.cells[0] = {
        id: 'cell-A1',
        type: 'formula',
        content: {
          type: 'formula',
          content: { expression: 'B1+C1', format: 'currency', decimals: 0 },
        },
        style: createDefaultStyle(),
        colspan: 1,
        rowspan: 1,
        isVisible: true,
      };

      const deps = ReportBuilderEngine.detectCircularReferences(layout);
      const circular = deps.filter((d) => d.hasCircularRef);
      expect(circular).toHaveLength(0);
    });
  });

  describe('columnLetterToIndex', () => {
    it('should convert A to 0', () => {
      expect(ReportBuilderEngine.columnLetterToIndex('A')).toBe(0);
    });

    it('should convert B to 1', () => {
      expect(ReportBuilderEngine.columnLetterToIndex('B')).toBe(1);
    });

    it('should convert Z to 25', () => {
      expect(ReportBuilderEngine.columnLetterToIndex('Z')).toBe(25);
    });

    it('should convert AA to 26', () => {
      expect(ReportBuilderEngine.columnLetterToIndex('AA')).toBe(26);
    });

    it('should convert AB to 27', () => {
      expect(ReportBuilderEngine.columnLetterToIndex('AB')).toBe(27);
    });
  });

  describe('columnIndexToLetter', () => {
    it('should convert 0 to A', () => {
      expect(ReportBuilderEngine.columnIndexToLetter(0)).toBe('A');
    });

    it('should convert 25 to Z', () => {
      expect(ReportBuilderEngine.columnIndexToLetter(25)).toBe('Z');
    });

    it('should convert 26 to AA', () => {
      expect(ReportBuilderEngine.columnIndexToLetter(26)).toBe('AA');
    });

    it('should roundtrip with columnLetterToIndex', () => {
      for (let i = 0; i < 52; i++) {
        const letter = ReportBuilderEngine.columnIndexToLetter(i);
        expect(ReportBuilderEngine.columnLetterToIndex(letter)).toBe(i);
      }
    });
  });

  // =========================================================================
  // EXCEL EXPORT
  // =========================================================================

  describe('generateExcelExport', () => {
    it('should generate Excel data with headers and rows', () => {
      const report = createTestReport();
      const cubeData: CubeData = {
        'Revenue.Q1.amount': 100000,
        'Expenses.Q1.amount': 60000,
      };

      const result = ReportBuilderEngine.generateExcelExport(report, cubeData);

      expect(result.sheets).toHaveLength(1);
      expect(result!.sheets[0]!.name).toBe('Test Report');
      expect(result!.sheets[0]!.data.length).toBeGreaterThan(0);
      expect(result!.sheets[0]!.data[0]!).toEqual(['Item', 'Actual']); // Header row
    });

    it('should include column widths', () => {
      const report = createTestReport();
      const result = ReportBuilderEngine.generateExcelExport(report, {});

      expect(result!.sheets[0]!.columnWidths).toEqual([200, 140]);
    });

    it('should include metadata', () => {
      const report = createTestReport();
      const result = ReportBuilderEngine.generateExcelExport(report, {});

      expect(result.metadata.title).toBe('Test Report');
      expect(result.metadata.author).toBe('user-1');
      expect(result.metadata.orientation).toBe('landscape');
    });

    it('should resolve cube data values in cells', () => {
      const report = createTestReport();
      const cubeData: CubeData = {
        'Revenue.Q1.amount': 250000,
        'Expenses.Q1.amount': 150000,
      };

      const result = ReportBuilderEngine.generateExcelExport(report, cubeData);
      // First data row (index 1, index 0 is header), second column (index 1, index 0 is label)
      expect(result!.sheets[0]!.data[1]![1]).toBe(250000);
      expect(result!.sheets[0]!.data[2]![1]).toBe(150000);
    });

    it('should truncate long sheet names to 31 characters', () => {
      const report = { ...createTestReport(), name: 'A'.repeat(50) };
      const result = ReportBuilderEngine.generateExcelExport(report, {});

      expect(result!.sheets[0]!.name).toHaveLength(31);
    });
  });

  // =========================================================================
  // CSV EXPORT
  // =========================================================================

  describe('generateCSVExport', () => {
    it('should generate valid CSV content', () => {
      const report = createTestReport();
      const cubeData: CubeData = {
        'Revenue.Q1.amount': 100000,
        'Expenses.Q1.amount': 60000,
      };

      const result = ReportBuilderEngine.generateCSVExport(report, cubeData);

      expect(result.content).toBeTruthy();
      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toBe('Test_Report.csv');
    });

    it('should have header row as first line', () => {
      const report = createTestReport();
      const result = ReportBuilderEngine.generateCSVExport(report, {});

      const lines = result.content.split('\n');
      expect(lines[0]!).toBe('Item,Actual');
    });

    it('should escape values containing commas', () => {
      const report = createTestReport();
      // Modify first cell to contain a comma
      report!.layout.rows[0]!.cells[0] = createTextCell('Revenue, Net');
      const result = ReportBuilderEngine.generateCSVExport(report, {});

      const lines = result.content.split('\n');
      expect(lines[1]!).toContain('"Revenue, Net"');
    });

    it('should escape values containing quotes', () => {
      const report = createTestReport();
      report!.layout.rows[0]!.cells[0] = createTextCell('Revenue "Gross"');
      const result = ReportBuilderEngine.generateCSVExport(report, {});

      const lines = result.content.split('\n');
      expect(lines[1]!).toContain('"Revenue ""Gross"""');
    });

    it('should sanitize filename', () => {
      const report = { ...createTestReport(), name: 'My Report / 2024!' };
      const result = ReportBuilderEngine.generateCSVExport(report, {});

      expect(result.filename).toBe('My_Report___2024_.csv');
    });

    it('should use empty string for missing cube data', () => {
      const report = createTestReport();
      const result = ReportBuilderEngine.generateCSVExport(report, {});

      const lines = result.content.split('\n');
      // CSV export uses rawValue (null → empty), not formattedValue ('—')
      expect(lines[1]!).toContain(',');
    });
  });

  // =========================================================================
  // REPORT PARAMETERS
  // =========================================================================

  describe('addParameter', () => {
    const testParam: ReportParameter = {
      id: 'param-1',
      name: 'period',
      label: 'Period',
      type: 'select',
      value: 'Q1',
      defaultValue: 'Q1',
      options: [
        { label: 'Q1', value: 'Q1' },
        { label: 'Q2', value: 'Q2' },
      ],
      required: true,
    };

    it('should add a parameter to a report', () => {
      const report = createTestReport();
      const updated = ReportBuilderEngine.addParameter(report, testParam);

      expect(updated.parameters).toHaveLength(1);
      expect(updated!.parameters![0]!.id).toBe('param-1');
      expect(updated!.parameters![0]!.name).toBe('period');
    });

    it('should throw if parameter ID already exists', () => {
      let report = createTestReport();
      report = ReportBuilderEngine.addParameter(report, testParam);

      expect(() => ReportBuilderEngine.addParameter(report, testParam)).toThrow('already exists');
    });

    it('should increment version', () => {
      const report = createTestReport();
      const updated = ReportBuilderEngine.addParameter(report, testParam);

      expect(updated.version).toBe(report.version + 1);
    });
  });

  describe('updateParameterValue', () => {
    it('should update parameter value', () => {
      const param: ReportParameter = {
        id: 'param-1',
        name: 'period',
        label: 'Period',
        type: 'select',
        value: 'Q1',
        defaultValue: 'Q1',
        required: false,
      };
      let report = createTestReport();
      report = ReportBuilderEngine.addParameter(report, param);

      const updated = ReportBuilderEngine.updateParameterValue(report, 'param-1', 'Q2');
      expect(updated!.parameters![0]!.value).toBe('Q2');
    });

    it('should throw if parameter not found', () => {
      const report = createTestReport();
      expect(() => ReportBuilderEngine.updateParameterValue(report, 'nonexistent', 'Q2')).toThrow(
        'not found'
      );
    });
  });

  describe('removeParameter', () => {
    it('should remove a parameter', () => {
      const param: ReportParameter = {
        id: 'param-1',
        name: 'period',
        label: 'Period',
        type: 'select',
        value: 'Q1',
        defaultValue: 'Q1',
        required: false,
      };
      let report = createTestReport();
      report = ReportBuilderEngine.addParameter(report, param);

      const updated = ReportBuilderEngine.removeParameter(report, 'param-1');
      expect(updated.parameters).toHaveLength(0);
    });

    it('should not affect other parameters', () => {
      const param1: ReportParameter = {
        id: 'p1',
        name: 'a',
        label: 'A',
        type: 'text',
        value: '',
        defaultValue: '',
        required: false,
      };
      const param2: ReportParameter = {
        id: 'p2',
        name: 'b',
        label: 'B',
        type: 'text',
        value: '',
        defaultValue: '',
        required: false,
      };
      let report = createTestReport();
      report = ReportBuilderEngine.addParameter(report, param1);
      report = ReportBuilderEngine.addParameter(report, param2);

      const updated = ReportBuilderEngine.removeParameter(report, 'p1');
      expect(updated.parameters).toHaveLength(1);
      expect(updated!.parameters![0]!.id).toBe('p2');
    });
  });

  describe('getParameters', () => {
    it('should return empty array when no parameters', () => {
      const report = createTestReport();
      expect(ReportBuilderEngine.getParameters(report)).toEqual([]);
    });

    it('should return all parameters', () => {
      const param: ReportParameter = {
        id: 'p1',
        name: 'a',
        label: 'A',
        type: 'text',
        value: 'x',
        defaultValue: '',
        required: false,
      };
      let report = createTestReport();
      report = ReportBuilderEngine.addParameter(report, param);

      expect(ReportBuilderEngine.getParameters(report)).toHaveLength(1);
    });
  });

  // =========================================================================
  // SECTION MANAGEMENT
  // =========================================================================

  describe('getSections', () => {
    it('should extract sections from income statement layout', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('income_statement');
      const sections = ReportBuilderEngine.getSections(layout);

      expect(sections.length).toBeGreaterThan(0);
      const types = sections.map((s) => s.type);
      expect(types).toContain('data');
    });

    it('should return empty array for empty layout', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('custom');
      const sections = ReportBuilderEngine.getSections(layout);

      expect(sections).toEqual([]);
    });

    it('should have valid start and end indices', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('balance_sheet');
      const sections = ReportBuilderEngine.getSections(layout);

      for (const section of sections) {
        expect(section.startRowIndex).toBeLessThanOrEqual(section.endRowIndex);
        expect(section.startRowIndex).toBeGreaterThanOrEqual(0);
        expect(section.endRowIndex).toBeLessThan(layout.rows.length);
      }
    });

    it('should assign unique IDs to sections', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('income_statement');
      const sections = ReportBuilderEngine.getSections(layout);

      const ids = sections.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should set isCollapsed to false by default', () => {
      const layout = ReportBuilderEngine.getTemplateLayout('cash_flow');
      const sections = ReportBuilderEngine.getSections(layout);

      for (const section of sections) {
        expect(section.isCollapsed).toBe(false);
      }
    });
  });

  // =========================================================================
  // MULTI-FORMAT EXPORT DISPATCHER
  // =========================================================================

  describe('exportReport', () => {
    it('should dispatch to PDF export', () => {
      const report = createTestReport();
      const result = ReportBuilderEngine.exportReport(report, {}, 'pdf');

      expect(result).toHaveProperty('reportId');
      expect(result).toHaveProperty('title');
      expect((result as PDFExportMetadata).orientation).toBe('landscape');
    });

    it('should dispatch to Excel export', () => {
      const report = createTestReport();
      const result = ReportBuilderEngine.exportReport(report, {}, 'excel');

      expect(result).toHaveProperty('sheets');
      expect((result as ExcelExportResult).sheets).toHaveLength(1);
    });

    it('should dispatch to CSV export', () => {
      const report = createTestReport();
      const result = ReportBuilderEngine.exportReport(report, {}, 'csv');

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('filename');
      expect((result as CSVExportResult).mimeType).toBe('text/csv');
    });
  });

  // =========================================================================
  // COMPREHENSIVE TEMPLATE VALIDATION
  // =========================================================================

  describe('template layout validation', () => {
    it('should have matching cell counts in all template rows', () => {
      const templates: TemplateType[] = [
        'income_statement',
        'balance_sheet',
        'cash_flow',
        'budget_vs_actual',
        'variance_analysis',
        'board_pack',
        'executive_summary',
      ];

      for (const template of templates) {
        const layout = ReportBuilderEngine.getTemplateLayout(template);
        const result = ReportBuilderEngine.validateReport({
          ...createTestReport(),
          layout,
        });
        expect(result.valid).toBe(true);
      }
    });
  });
});
