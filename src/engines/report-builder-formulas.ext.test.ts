/**
 * report-builder-formulas.ext.test.ts — deep coverage of the report-builder
 * formula/binding layer (MISSION D wave 2, 2026-08-07). The base test covered
 * parsing only; this exercises evaluation precedence, cell resolution,
 * circular-reference detection, totals, sections, and parameters.
 */
import { describe, expect, it } from 'vitest';
import {
  addParameter,
  autoPopulateTotals,
  buildBindingKey,
  calculateColumnSum,
  columnIndexToLetter,
  columnLetterToIndex,
  detectCircularReferences,
  evaluateFormula,
  getParameters,
  getSections,
  identifySectionRanges,
  parseFormulaReferences,
  removeParameter,
  resolveCellValue,
  resolveLayout,
  safeEvaluate,
  updateParameterValue,
} from './report-builder-formulas';
import type {
  CellBinding,
  CubeData,
  MetricCellContent,
  NumberFormat,
  ReportCell,
  ReportDefinition,
  ReportLayout,
  ReportParameter,
  ReportRow,
} from './report-builder-types';

const fmt = (v: number, f: NumberFormat, d: number): string => `[${f}:${v.toFixed(d)}]`;

function cell(over: Partial<ReportCell> & { id: string }): ReportCell {
  return {
    type: 'text',
    content: { type: 'text', content: { text: '' } },
    style: { bold: false, italic: false, align: 'left', fillColor: '#fff', textColor: '#000' },
    colspan: 1,
    rowspan: 1,
    isVisible: true,
    ...over,
  } as ReportCell;
}

function row(id: string, type: ReportRow['type'], cells: ReportCell[]): ReportRow {
  return {
    id,
    type,
    cells,
    height: 20,
    isVisible: true,
    pageBreakBefore: false,
  };
}

function layout(
  rows: ReportRow[],
  columns = [
    { id: 'c0', type: 'label' as const, header: 'L', width: 80, isVisible: true, isLocked: false },
  ]
): ReportLayout {
  return {
    rows,
    columns,
    columnWidths: {},
    defaultRowHeight: 20,
    frozenColumns: 0,
    frozenRows: 0,
    filters: [],
  };
}

describe('safeEvaluate — arithmetic engine', () => {
  it('honors precedence and parentheses', () => {
    expect(safeEvaluate('2+3*4')).toBe(14);
    expect(safeEvaluate('(2+3)*4')).toBe(20);
    expect(safeEvaluate('10/4')).toBe(2.5);
    expect(safeEvaluate('2*(3+4)-5')).toBe(9);
    expect(safeEvaluate('-3+5')).toBe(2);
    expect(safeEvaluate('-(3+5)')).toBe(-8);
    expect(safeEvaluate('0.1+0.2')).toBeCloseTo(0.30000000000000004, 10); // float expr — document behavior
  });
  it('throws on malformed input', () => {
    expect(() => safeEvaluate('1/0')).toThrow('Division by zero');
    expect(() => safeEvaluate('(1+2')).toThrow('Missing closing parenthesis');
    expect(() => safeEvaluate('1+')).toThrow();
    expect(() => safeEvaluate('abc')).toThrow();
  });
  it('evaluateFormula substitutes cell references then evaluates', () => {
    expect(evaluateFormula('A1*B2', { A1: 6, B2: 7 })).toBe(42);
    expect(() => evaluateFormula('A1+1', {})).toThrow('Missing value');
    expect(() => evaluateFormula('A1', { A1: Infinity })).toThrow('Non-finite');
  });
  it('parseFormulaReferences finds unique cell refs', () => {
    expect(parseFormulaReferences('A1+B1+A1')).toEqual(['A1', 'B1']);
    expect(parseFormulaReferences('SUM(A1:B2)')).toContain('A1');
  });
  it('column letter conversions round-trip', () => {
    for (const [letter, idx] of [
      ['A', 0],
      ['Z', 25],
      ['AA', 26],
      ['AB', 27],
      ['ZZ', 701],
      ['AAA', 702],
    ] as const) {
      expect(columnLetterToIndex(letter)).toBe(idx);
      expect(columnIndexToLetter(idx)).toBe(letter);
    }
  });
});

describe('resolveCellValue — binding resolution', () => {
  const cube: CubeData = { 'R1.C1.revenue': 1000, 'R1.C2.cogs': '250.5' };

  it('text cells pass through', () => {
    const r = resolveCellValue(
      cell({ id: 't1', content: { type: 'text', content: { text: 'Label' } } }),
      cube,
      fmt
    );
    expect(r.rawValue).toBe('Label');
    expect(r.formattedValue).toBe('Label');
  });

  it('metric cells resolve from the cube with formatting', () => {
    const mc: MetricCellContent = {
      coords: 'R1.C1',
      measure: 'revenue',
      format: 'currency',
      decimals: 2,
      showSign: true,
    };
    const r = resolveCellValue(
      cell({ id: 'm1', type: 'metric', content: { type: 'metric', content: mc } }),
      cube,
      fmt
    );
    expect(r.rawValue).toBe(1000);
    expect(r.formattedValue).toBe('[currency:1000.00]');
    expect(r.binding).toEqual({ coords: 'R1.C1', measure: 'revenue' });
  });

  it('numeric strings coerce; non-finite values pass through as strings', () => {
    const numeric = resolveCellValue(
      cell({
        id: 'm2',
        type: 'metric',
        content: {
          type: 'metric',
          content: {
            coords: 'R1.C2',
            measure: 'cogs',
            format: 'number',
            decimals: 1,
            showSign: false,
          },
        },
      }),
      cube,
      fmt
    );
    expect(numeric.rawValue).toBe(250.5);
    const bad = resolveCellValue(
      cell({
        id: 'm3',
        type: 'metric',
        content: {
          type: 'metric',
          content: { coords: 'X', measure: 'boom', format: 'number', decimals: 1, showSign: false },
        },
      }),
      { 'X.boom': 'not-a-number' },
      fmt
    );
    expect(bad.rawValue).toBe('not-a-number');
  });

  it('missing cube values render an em-dash', () => {
    const r = resolveCellValue(
      cell({
        id: 'm4',
        type: 'metric',
        content: {
          type: 'metric',
          content: {
            coords: 'R9',
            measure: 'nope',
            format: 'number',
            decimals: 0,
            showSign: false,
          },
        },
      }),
      cube,
      fmt
    );
    expect(r.rawValue).toBeNull();
    expect(r.formattedValue).toBe('\u2014');
  });

  it('formula / chart / table cells resolve to labels', () => {
    const formula = resolveCellValue(
      cell({
        id: 'f1',
        type: 'formula',
        content: {
          type: 'formula',
          content: { expression: 'A1+B1', format: 'number', decimals: 0, label: 'Total' },
        },
      }),
      cube,
      fmt
    );
    expect(formula.formattedValue).toBe('Total');
    const chart = resolveCellValue(
      cell({
        id: 'ch1',
        type: 'chart',
        content: {
          type: 'chart',
          content: { chartId: 'x', chartType: 'bar', title: 'Sales', width: 100, height: 100 },
        },
      }),
      cube,
      fmt
    );
    expect(chart.formattedValue).toBe('[Chart: Sales]');
    const table = resolveCellValue(
      cell({
        id: 'tb1',
        type: 'table',
        content: {
          type: 'table',
          content: { tableId: 't', maxRows: 10, showHeaders: true, striped: false },
        },
      }),
      cube,
      fmt
    );
    expect(table.formattedValue).toBe('[Table]');
  });

  it('resolveLayout maps every cell', () => {
    const l = layout([
      row('r1', 'data', [cell({ id: 'a', content: { type: 'text', content: { text: 'X' } } })]),
      row('r2', 'data', [
        cell({
          id: 'b',
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
        }),
      ]),
    ]);
    const resolved = resolveLayout(l, cube, fmt);
    expect(resolved[0]![0]!.formattedValue).toBe('X');
    expect(resolved[1]![0]!.rawValue).toBe(1000);
  });
});

describe('circular reference detection', () => {
  const formulaCell = (id: string, expression: string): ReportCell =>
    cell({
      id,
      type: 'formula',
      content: { type: 'formula', content: { expression, format: 'number', decimals: 0 } },
    });

  it('detects a direct cycle A → B → A', () => {
    const l = layout(
      [
        row('r1', 'data', [
          cell({ id: 'label', content: { type: 'text', content: { text: '' } } }),
          formulaCell('A', 'B2'),
        ]),
        row('r2', 'data', [
          cell({ id: 'label2', content: { type: 'text', content: { text: '' } } }),
          formulaCell('B', 'B1'),
        ]),
      ],
      [
        {
          id: 'c0',
          type: 'label' as const,
          header: 'L',
          width: 80,
          isVisible: true,
          isLocked: false,
        },
        {
          id: 'c1',
          type: 'metric' as const,
          header: 'M',
          width: 80,
          isVisible: true,
          isLocked: false,
        },
      ]
    );
    const deps = detectCircularReferences(l);
    expect(deps.some((d) => d.hasCircularRef)).toBe(true);
  });

  it('acyclic references report hasCircularRef false', () => {
    const l = layout(
      [
        row('r1', 'data', [
          cell({ id: 'label', content: { type: 'text', content: { text: '' } } }),
          formulaCell('A', '10+20'),
        ]),
        row('r2', 'data', [
          cell({ id: 'label2', content: { type: 'text', content: { text: '' } } }),
          formulaCell('B', 'B1*2'),
        ]),
      ],
      [
        {
          id: 'c0',
          type: 'label' as const,
          header: 'L',
          width: 80,
          isVisible: true,
          isLocked: false,
        },
        {
          id: 'c1',
          type: 'metric' as const,
          header: 'M',
          width: 80,
          isVisible: true,
          isLocked: false,
        },
      ]
    );
    const deps = detectCircularReferences(l);
    expect(deps.every((d) => !d.hasCircularRef)).toBe(true);
    expect(deps.some((d) => d.cellId === 'A' && d.references.length === 0)).toBe(true);
    expect(deps.some((d) => d.cellId === 'B' && d.references.includes('A'))).toBe(true);
  });
});

describe('totals, sections, parameters', () => {
  const numCell = (raw: number | null): ResolvedCellLike => ({
    cellId: 'x',
    rawValue: raw,
    formattedValue: '',
    binding: null,
  });
  type ResolvedCellLike = {
    cellId: string;
    rawValue: number | string | null;
    formattedValue: string;
    binding: CellBinding | null;
  };

  it('calculateColumnSum sums exact decimals (0.1+0.2 = 0.3)', () => {
    const grid = [[numCell(0.1)], [numCell(0.2)], [numCell(0.3)]];
    const sum = calculateColumnSum(grid, 0, 0, 2);
    expect(sum).toBeCloseTo(0.6, 12); // 0.1+0.2+0.3 exact via sumMoney
    // skips null and non-numeric cells
    const mixed = [[numCell(null)], [numCell('x')], [numCell(7)]];
    expect(calculateColumnSum(mixed, 0, 0, 2)).toBe(7);
  });

  it('identifySectionRanges bands data/subtotal/total rows', () => {
    const l = layout([
      row('h', 'header', [cell({ id: 'h1', content: { type: 'text', content: { text: '' } } })]),
      row('d1', 'data', [cell({ id: 'd1c', content: { type: 'text', content: { text: '' } } })]),
      row('d2', 'data', [cell({ id: 'd2c', content: { type: 'text', content: { text: '' } } })]),
      row('s', 'subtotal', [cell({ id: 'sc', content: { type: 'text', content: { text: '' } } })]),
      row('t', 'total', [cell({ id: 'tc', content: { type: 'text', content: { text: '' } } })]),
    ]);
    const sections = identifySectionRanges(l);
    expect(sections).toEqual([
      { type: 'data', startIndex: 0, endIndex: 2 },
      { type: 'subtotal', startIndex: 3, endIndex: 3 },
      { type: 'total', startIndex: 4, endIndex: 4 },
    ]);
  });

  it('autoPopulateTotals converts metric cells in subtotal rows to sum bindings', () => {
    const metricCellInSubtotal = cell({
      id: 's1',
      type: 'metric',
      content: {
        type: 'metric',
        content: {
          coords: 'D1',
          measure: 'revenue',
          format: 'currency',
          decimals: 0,
          showSign: false,
        },
      },
    });
    const l = layout(
      [
        row('d', 'data', [
          cell({ id: 'dc', content: { type: 'text', content: { text: '' } } }),
          cell({
            id: 'dm',
            type: 'metric',
            content: {
              type: 'metric',
              content: {
                coords: 'R1',
                measure: 'revenue',
                format: 'currency',
                decimals: 0,
                showSign: false,
              },
            },
          }),
        ]),
        row('s', 'subtotal', [
          cell({ id: 'sl', content: { type: 'text', content: { text: 'Subtotal' } } }),
          metricCellInSubtotal,
        ]),
      ],
      [
        {
          id: 'c0',
          type: 'label' as const,
          header: 'L',
          width: 80,
          isVisible: true,
          isLocked: false,
        },
        {
          id: 'c1',
          type: 'metric' as const,
          header: 'M',
          width: 80,
          isVisible: true,
          isLocked: false,
        },
      ]
    );
    const out = autoPopulateTotals(l, {});
    const subtotalCell = out.rows[1]!.cells[1]!;
    expect(subtotalCell.type).toBe('metric');
    const content = subtotalCell.content as { content: MetricCellContent };
    expect(content.content.coords).toMatch(/^Auto\.subtotal\.1$/);
    expect(content.content.measure).toBe('sum');
  });

  it('getSections groups rows and titles from label cells', () => {
    const l = layout([
      row('d1', 'data', [
        cell({ id: 'l1', content: { type: 'text', content: { text: 'Revenue' } } }),
      ]),
      row('d2', 'data', [cell({ id: 'l2', content: { type: 'text', content: { text: '' } } })]),
      row('s', 'subtotal', [
        cell({ id: 'l3', content: { type: 'text', content: { text: 'Total Revenue' } } }),
      ]),
    ]);
    const sections = getSections(l);
    expect(sections).toHaveLength(2);
    expect(sections[0]!.type).toBe('data');
    expect(sections[0]!.title).toBe('Revenue');
    expect(sections[0]!.startRowIndex).toBe(0);
    expect(sections[0]!.endRowIndex).toBe(1);
    expect(sections[1]!.type).toBe('subtotal');
    expect(sections[1]!.title).toBe('Total Revenue');
  });

  const report: ReportDefinition = {
    id: 'r1',
    name: 'R',
    description: '',
    template: 'blank',
    layout: layout([]),
    filters: [],
    shares: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    createdBy: 'u',
    tags: [],
    isArchived: false,
    version: 1,
  };

  const param: ReportParameter = {
    id: 'p1',
    name: 'Entity',
    label: 'Entity',
    type: 'string',
    value: 'ACME',
    defaultValue: 'ACME',
    required: true,
  };

  it('addParameter appends and bumps version; duplicates throw', () => {
    const withP = addParameter(report, param);
    expect(withP.version).toBe(2);
    expect(getParameters(withP)).toHaveLength(1);
    expect(() => addParameter(withP, param)).toThrow('already exists');
  });

  it('updateParameterValue mutates the value', () => {
    const withP = addParameter(report, param);
    const updated = updateParameterValue(withP, 'p1', 'GLOBEX');
    expect(getParameters(updated)[0]!.value).toBe('GLOBEX');
    expect(updated.version).toBe(3);
    expect(() => updateParameterValue(withP, 'missing', 'x')).toThrow('not found');
  });

  it('removeParameter filters and bumps version', () => {
    const withP = addParameter(report, param);
    const without = removeParameter(withP, 'p1');
    expect(getParameters(without)).toHaveLength(0);
    expect(without.version).toBe(3);
  });

  it('buildBindingKey joins all present parts', () => {
    const b: CellBinding = {
      coords: 'R1',
      measure: 'rev',
      entityId: 'e1',
      scenarioId: 's1',
      periodId: 'p1',
    };
    expect(buildBindingKey(b)).toBe('R1.rev.e1.s1.p1');
    expect(buildBindingKey({ coords: 'R1', measure: 'rev' })).toBe('R1.rev');
  });
});
